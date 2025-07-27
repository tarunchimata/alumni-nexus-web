/**
 * Optimized School CSV Import Script for Large Datasets (1M+ records)
 * Uses batch processing and transactions for better performance
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parser';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// State code mapping for institution_id generation
const STATE_CODES: Record<string, string> = {
  'Andhra Pradesh': 'AP', 'Arunachal Pradesh': 'AR', 'Assam': 'AS', 'Bihar': 'BR',
  'Chhattisgarh': 'CT', 'Goa': 'GA', 'Gujarat': 'GJ', 'Haryana': 'HR',
  'Himachal Pradesh': 'HP', 'Jharkhand': 'JH', 'Karnataka': 'KA', 'Kerala': 'KL',
  'Madhya Pradesh': 'MP', 'Maharashtra': 'MH', 'Manipur': 'MN', 'Meghalaya': 'ML',
  'Mizoram': 'MZ', 'Nagaland': 'NL', 'Odisha': 'OR', 'Punjab': 'PB',
  'Rajasthan': 'RJ', 'Sikkim': 'SK', 'Tamil Nadu': 'TN', 'Telangana': 'TG',
  'Tripura': 'TR', 'Uttar Pradesh': 'UP', 'Uttarakhand': 'UK', 'West Bengal': 'WB',
  'Delhi': 'DL', 'Puducherry': 'PY', 'Chandigarh': 'CH', 'Jammu and Kashmir': 'JK',
  'Ladakh': 'LA', 'Lakshadweep': 'LD', 'Andaman and Nicobar Islands': 'AN'
};

interface SchoolData {
  institutionId: string;
  schoolName: string;
  udiseSchoolCode?: string;
  schoolCategory?: string;
  schoolType?: string;
  management?: string;
  stateName: string;
  districtName?: string;
  address?: string;
  contactNumber?: string;
}

const BATCH_SIZE = 1000; // Process 1000 records per batch

// Pre-generate institution IDs for each state to avoid database queries
const stateCounters = new Map<string, number>();

async function initializeStateCounters() {
  logger.info('Initializing state counters...');
  
  for (const [stateName, stateCode] of Object.entries(STATE_CODES)) {
    const maxId = await prisma.school.findFirst({
      where: {
        institutionId: { startsWith: `INC-IN-${stateCode}-` }
      },
      select: { institutionId: true },
      orderBy: { institutionId: 'desc' }
    });
    
    let nextNumber = 1;
    if (maxId?.institutionId) {
      const numberPart = maxId.institutionId.split('-').pop();
      if (numberPart) {
        nextNumber = parseInt(numberPart) + 1;
      }
    }
    stateCounters.set(stateCode, nextNumber);
  }
}

function generateInstitutionId(stateName: string): string {
  const stateCode = STATE_CODES[stateName.trim()] || 'XX';
  const counter = stateCounters.get(stateCode) || 1;
  stateCounters.set(stateCode, counter + 1);
  return `INC-IN-${stateCode}-${counter.toString().padStart(5, '0')}`;
}

function cleanData(row: any): SchoolData {
  const getField = (possibleNames: string[]): string => {
    for (const name of possibleNames) {
      if (row[name] !== undefined && row[name] !== '') {
        return row[name].trim();
      }
    }
    return '';
  };

  const schoolName = getField(['School Name', 'school_name', 'name', 'SCHOOL_NAME']);
  const stateName = getField(['State Name', 'state_name', 'state', 'STATE_NAME']);
  
  return {
    institutionId: generateInstitutionId(stateName),
    schoolName,
    udiseSchoolCode: getField(['UDISE Code', 'udise_code', 'UDISE']),
    schoolCategory: getField(['School Category', 'school_category', 'category']),
    schoolType: getField(['School Type', 'school_type', 'type']),
    management: getField(['Management', 'management', 'school_management']),
    stateName,
    districtName: getField(['District', 'district', 'district_name']),
    address: getField(['Address', 'address', 'full_address']),
    contactNumber: getField(['Contact Number', 'contact_number', 'phone'])
  };
}

async function processBatch(schools: SchoolData[]): Promise<{ success: number; errors: any[] }> {
  const errors: any[] = [];
  let success = 0;

  try {
    const validSchools = schools.filter(school => {
      if (!school.schoolName || !school.stateName) {
        errors.push({ error: 'Missing required fields', data: school });
        return false;
      }
      return true;
    });

    // Use createMany for better performance
    await prisma.school.createMany({
      data: validSchools.map(school => ({
        institutionId: school.institutionId,
        schoolName: school.schoolName,
        udiseSchoolCode: school.udiseSchoolCode,
        schoolCategory: school.schoolCategory,
        schoolType: school.schoolType,
        management: school.management,
        stateName: school.stateName,
        districtName: school.districtName,
        address: school.address,
        contactNumber: school.contactNumber,
        status: 'active',
        // Legacy fields
        name: school.schoolName,
        udiseCode: school.udiseSchoolCode,
        schoolTypeLegacy: school.schoolCategory?.includes('Primary') ? 'Primary' : 
                         school.schoolCategory?.includes('Higher Secondary') ? 'Higher Secondary' : 'Secondary',
        managementType: school.management?.includes('Government') ? 'Government' : 'Private'
      })),
      skipDuplicates: true // Skip duplicates instead of failing
    });

    success = validSchools.length;
  } catch (error: any) {
    logger.error('Batch processing error:', error);
    errors.push({ error: error.message, batch: schools.length });
  }

  return { success, errors };
}

async function importSchoolsBulk(csvFilePath: string) {
  if (!fs.existsSync(csvFilePath)) {
    throw new Error(`CSV file not found: ${csvFilePath}`);
  }

  await initializeStateCounters();
  
  logger.info('Starting optimized bulk school import...');
  
  const results: any[] = [];
  let batch: SchoolData[] = [];
  let totalProcessed = 0;
  let totalSuccess = 0;
  let totalErrors = 0;

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', async (data: any) => {
        const schoolData = cleanData(data);
        batch.push(schoolData);

        if (batch.length >= BATCH_SIZE) {
          const { success, errors } = await processBatch(batch);
          totalProcessed += batch.length;
          totalSuccess += success;
          totalErrors += errors.length;
          
          logger.info(`Processed ${totalProcessed} records - Success: ${totalSuccess}, Errors: ${totalErrors}`);
          
          batch = [];
        }
      })
      .on('end', async () => {
        // Process remaining batch
        if (batch.length > 0) {
          const { success, errors } = await processBatch(batch);
          totalProcessed += batch.length;
          totalSuccess += success;
          totalErrors += errors.length;
        }

        logger.info(`Import completed: ${totalSuccess} schools created, ${totalErrors} errors from ${totalProcessed} total records`);
        resolve();
      })
      .on('error', (error) => {
        logger.error('CSV parsing error:', error);
        reject(error);
      });
  });
}

// Main execution
async function main() {
  try {
    const csvPath = process.argv[2];
    if (!csvPath) {
      console.error('Usage: npm run import-schools-bulk <path-to-csv-file>');
      process.exit(1);
    }

    const startTime = Date.now();
    await importSchoolsBulk(csvPath);
    const endTime = Date.now();
    
    logger.info(`Total import time: ${(endTime - startTime) / 1000} seconds`);
  } catch (error) {
    logger.error('Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { importSchoolsBulk };