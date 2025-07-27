/**
 * Optimized School CSV Import Script for Large Datasets (1M+ records)
 * Uses connection pooling, batch processing, and retry logic for production imports
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parser';
import { logger } from '../utils/logger';

// Enhanced Prisma client with optimized connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=20&pool_timeout=30&connect_timeout=60'
    }
  },
  log: ['error', 'warn']
});

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

const BATCH_SIZE = 300; // Reduced batch size for better connection management
const MAX_RETRIES = 3; // Retry failed batches
const RETRY_DELAY = 5000; // 5 seconds between retries

// Pre-generate institution IDs for each state to avoid database queries
const stateCounters = new Map<string, number>();

// Progress tracking
interface ImportProgress {
  totalProcessed: number;
  totalSuccess: number;
  totalErrors: number;
  startTime: number;
  estimatedTotal: number;
}

// Connection health check
async function checkConnectionHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.warn('Database connection health check failed:', error);
    return false;
  }
}

// Sleep utility for retry delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

async function processBatchWithRetry(schools: SchoolData[], retryCount = 0): Promise<{ success: number; errors: any[] }> {
  const errors: any[] = [];
  let success = 0;

  // Check connection health before processing
  const isHealthy = await checkConnectionHealth();
  if (!isHealthy && retryCount < MAX_RETRIES) {
    logger.warn(`Connection unhealthy, retrying in ${RETRY_DELAY}ms... (${retryCount + 1}/${MAX_RETRIES})`);
    await sleep(RETRY_DELAY);
    return processBatchWithRetry(schools, retryCount + 1);
  }

  try {
    const validSchools = schools.filter(school => {
      if (!school.schoolName || !school.stateName) {
        errors.push({ error: 'Missing required fields', data: school });
        return false;
      }
      return true;
    });

    if (validSchools.length === 0) {
      return { success: 0, errors };
    }

    // Process in smaller chunks if batch is large
    const chunkSize = Math.min(100, validSchools.length);
    const chunks = [];
    for (let i = 0; i < validSchools.length; i += chunkSize) {
      chunks.push(validSchools.slice(i, i + chunkSize));
    }

    for (const chunk of chunks) {
      try {
        await prisma.school.createMany({
          data: chunk.map(school => ({
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
          skipDuplicates: true
        });
        
        success += chunk.length;
        
        // Small delay between chunks to prevent connection exhaustion
        if (chunks.length > 1) {
          await sleep(100);
        }
        
      } catch (chunkError: any) {
        logger.error(`Chunk processing error: ${chunkError.message}`);
        errors.push({ error: chunkError.message, chunk: chunk.length });
      }
    }

  } catch (error: any) {
    logger.error('Batch processing error:', error);
    
    // Retry on connection errors
    if ((error.code === 'P2024' || error.message.includes('connection')) && retryCount < MAX_RETRIES) {
      logger.warn(`Retrying batch due to connection error... (${retryCount + 1}/${MAX_RETRIES})`);
      await sleep(RETRY_DELAY);
      return processBatchWithRetry(schools, retryCount + 1);
    }
    
    errors.push({ error: error.message, batch: schools.length });
  }

  return { success, errors };
}

// Progress reporting with ETA
function reportProgress(progress: ImportProgress) {
  const { totalProcessed, totalSuccess, totalErrors, startTime, estimatedTotal } = progress;
  const elapsed = Date.now() - startTime;
  const rate = totalProcessed / (elapsed / 1000); // records per second
  const eta = estimatedTotal > 0 ? (estimatedTotal - totalProcessed) / rate : 0;
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  logger.info(`Progress: ${totalProcessed}/${estimatedTotal || '?'} (${((totalProcessed / (estimatedTotal || totalProcessed)) * 100).toFixed(1)}%) | Success: ${totalSuccess} | Errors: ${totalErrors} | Rate: ${rate.toFixed(1)}/sec | ETA: ${formatTime(eta)}`);
}

async function importSchoolsBulk(csvFilePath: string) {
  if (!fs.existsSync(csvFilePath)) {
    throw new Error(`CSV file not found: ${csvFilePath}`);
  }

  // Count total lines for progress estimation
  const lineCount = await new Promise<number>((resolve, reject) => {
    let count = 0;
    fs.createReadStream(csvFilePath)
      .on('data', (chunk) => {
        count += chunk.toString().split('\n').length - 1;
      })
      .on('end', () => resolve(count - 1)) // -1 for header
      .on('error', reject);
  });

  await initializeStateCounters();
  
  logger.info(`Starting optimized bulk school import for ${lineCount} records...`);
  
  let allData: SchoolData[] = [];
  let totalProcessed = 0;
  let totalSuccess = 0;
  let totalErrors = 0;
  const startTime = Date.now();

  // Read all data synchronously first (more memory efficient for large files)
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data: any) => {
        const schoolData = cleanData(data);
        allData.push(schoolData);
      })
      .on('end', () => {
        logger.info(`Loaded ${allData.length} records from CSV, starting batch processing...`);
        resolve();
      })
      .on('error', reject);
  });

  // Process in batches with connection management
  for (let i = 0; i < allData.length; i += BATCH_SIZE) {
    const batch = allData.slice(i, i + BATCH_SIZE);
    
    try {
      const { success, errors } = await processBatchWithRetry(batch);
      totalProcessed += batch.length;
      totalSuccess += success;
      totalErrors += errors.length;

      // Report progress every 5 batches
      if ((i / BATCH_SIZE) % 5 === 0 || i + BATCH_SIZE >= allData.length) {
        reportProgress({
          totalProcessed,
          totalSuccess,
          totalErrors,
          startTime,
          estimatedTotal: allData.length
        });
      }

      // Connection health maintenance - disconnect and reconnect every 50 batches
      if ((i / BATCH_SIZE) % 50 === 0 && i > 0) {
        logger.info('Performing connection maintenance...');
        await prisma.$disconnect();
        await sleep(2000);
        // Prisma will auto-reconnect on next query
      }

      // Memory cleanup
      if (totalProcessed % 10000 === 0 && global.gc) {
        global.gc();
      }

    } catch (error: any) {
      logger.error(`Critical error processing batch ${i / BATCH_SIZE}:`, error);
      totalErrors += batch.length;
      
      // Continue with next batch instead of failing completely
      if (error.code === 'P2024') {
        logger.warn('Connection pool exhausted, waiting before continuing...');
        await sleep(10000);
      }
    }
  }

  // Final cleanup
  allData = [];
  
  logger.info(`Import completed: ${totalSuccess} schools created, ${totalErrors} errors from ${totalProcessed} total records`);
  logger.info(`Success rate: ${((totalSuccess / totalProcessed) * 100).toFixed(2)}%`);
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