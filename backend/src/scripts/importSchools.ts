#!/usr/bin/env ts-node

/**
 * School CSV Import Script for My School Buddies
 * Imports school data from CSV into the schools table with proper institution_id generation
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parser';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// State code mapping for institution_id generation
const STATE_CODES: Record<string, string> = {
  'Andhra Pradesh': 'AP',
  'Arunachal Pradesh': 'AR',
  'Assam': 'AS',
  'Bihar': 'BR',
  'Chhattisgarh': 'CT',
  'Goa': 'GA',
  'Gujarat': 'GJ',
  'Haryana': 'HR',
  'Himachal Pradesh': 'HP',
  'Jharkhand': 'JH',
  'Karnataka': 'KA',
  'Kerala': 'KL',
  'Madhya Pradesh': 'MP',
  'Maharashtra': 'MH',
  'Manipur': 'MN',
  'Meghalaya': 'ML',
  'Mizoram': 'MZ',
  'Nagaland': 'NL',
  'Odisha': 'OR',
  'Punjab': 'PB',
  'Rajasthan': 'RJ',
  'Sikkim': 'SK',
  'Tamil Nadu': 'TN',
  'Telangana': 'TG',
  'Tripura': 'TR',
  'Uttar Pradesh': 'UP',
  'Uttarakhand': 'UK',
  'West Bengal': 'WB',
  'Delhi': 'DL',
  'Puducherry': 'PY',
  'Chandigarh': 'CH',
  'Dadra and Nagar Haveli': 'DN',
  'Daman and Diu': 'DD',
  'Jammu and Kashmir': 'JK',
  'Ladakh': 'LA',
  'Lakshadweep': 'LD',
  'Andaman and Nicobar Islands': 'AN'
};

interface CSVRow {
  'State Name': string;
  'District': string;
  'Sub District': string;
  'Village': string;
  'Pincode': string;
  'School Name': string;
  'UDISE Code': string;
  'School Category': string;
  'School Type': string;
  'School Management': string;
  'Year of Establishment': string;
  'School Status': string;
  'School Location Type': string;
  'Class From': string;
  'Class To': string;
  'Affiliated Board Sec.': string;
  'Affiliated Board H. Sec.': string;
}

interface SchoolData {
  institutionId: string;
  schoolName: string;
  udiseSchoolCode?: string;
  schoolCategory?: string;
  schoolType?: string;
  management?: string;
  yearOfEstablishment?: string;
  status?: string;
  locationType?: string;
  classFrom?: string;
  classTo?: string;
  affBoardSec?: string;
  affBoardHSec?: string;
  stateName: string;
  districtName?: string;
  subDistrictName?: string;
  villageName?: string;
  pincode?: string;
}

// Generate institution ID: INC-IN-<state_code>-<5_digit_number>
async function generateInstitutionId(stateName: string): Promise<string> {
  const stateCode = STATE_CODES[stateName.trim()] || 'XX';
  
  // Find the highest existing number for this state
  const existingSchools = await prisma.school.findMany({
    where: {
      institutionId: {
        startsWith: `INC-IN-${stateCode}-`
      }
    },
    select: { institutionId: true },
    orderBy: { institutionId: 'desc' }
  });

  let nextNumber = 1;
  if (existingSchools.length > 0) {
    const lastId = existingSchools[0].institutionId;
    const numberPart = lastId.split('-').pop();
    if (numberPart) {
      nextNumber = parseInt(numberPart) + 1;
    }
  }

  return `INC-IN-${stateCode}-${nextNumber.toString().padStart(5, '0')}`;
}

// Clean and standardize data
function cleanData(row: CSVRow): SchoolData {
  return {
    institutionId: '', // Will be generated
    schoolName: row['School Name']?.trim() || '',
    udiseSchoolCode: row['UDISE Code']?.trim() || undefined,
    schoolCategory: row['School Category']?.trim() || undefined,
    schoolType: row['School Type']?.trim() || undefined,
    management: row['School Management']?.trim() || undefined,
    yearOfEstablishment: row['Year of Establishment']?.trim() || undefined,
    status: row['School Status']?.trim() || undefined,
    locationType: row['School Location Type']?.trim() || undefined,
    classFrom: row['Class From']?.trim() || undefined,
    classTo: row['Class To']?.trim() || undefined,
    affBoardSec: row['Affiliated Board Sec.']?.trim() || undefined,
    affBoardHSec: row['Affiliated Board H. Sec.']?.trim() || undefined,
    stateName: row['State Name']?.trim() || '',
    districtName: row['District']?.trim() || undefined,
    subDistrictName: row['Sub District']?.trim() || undefined,
    villageName: row['Village']?.trim() || undefined,
    pincode: row['Pincode']?.trim()?.substring(0, 6) || undefined, // Trim to 6 digits
  };
}

async function importSchools(csvFilePath: string) {
  if (!fs.existsSync(csvFilePath)) {
    throw new Error(`CSV file not found: ${csvFilePath}`);
  }

  logger.info('Starting school import from CSV...');
  
  const results: CSVRow[] = [];
  const errors: Array<{ row: number; error: string; data?: any }> = [];
  let successCount = 0;
  let rowCount = 0;

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data: CSVRow) => {
        results.push(data);
      })
      .on('end', async () => {
        logger.info(`Processing ${results.length} rows from CSV...`);

        for (const row of results) {
          rowCount++;
          try {
            const schoolData = cleanData(row);
            
            // Validate required fields
            if (!schoolData.schoolName || !schoolData.stateName) {
              errors.push({
                row: rowCount,
                error: 'Missing required fields: schoolName or stateName',
                data: schoolData
              });
              continue;
            }

            // Generate institution ID
            schoolData.institutionId = await generateInstitutionId(schoolData.stateName);

            // Check for duplicate UDISE codes
            if (schoolData.udiseSchoolCode) {
              const existing = await prisma.school.findFirst({
                where: { udiseSchoolCode: schoolData.udiseSchoolCode }
              });
              if (existing) {
                errors.push({
                  row: rowCount,
                  error: `Duplicate UDISE code: ${schoolData.udiseSchoolCode}`,
                  data: schoolData
                });
                continue;
              }
            }

            // Create school record
            await prisma.school.create({
              data: schoolData
            });

            successCount++;
            
            if (successCount % 100 === 0) {
              logger.info(`Processed ${successCount} schools...`);
            }

          } catch (error: any) {
            errors.push({
              row: rowCount,
              error: error.message,
              data: row
            });
          }
        }

        logger.info(`Import completed: ${successCount} schools created, ${errors.length} errors`);
        
        if (errors.length > 0) {
          logger.warn('Import errors:', errors.slice(0, 10)); // Log first 10 errors
          fs.writeFileSync('import-errors.json', JSON.stringify(errors, null, 2));
          logger.info('Full error details saved to import-errors.json');
        }

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
      console.error('Usage: npm run import-schools <path-to-csv-file>');
      process.exit(1);
    }

    await importSchools(csvPath);
    logger.info('School import completed successfully');
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

export { importSchools };