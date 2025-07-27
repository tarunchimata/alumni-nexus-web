/**
 * Production-Ready Optimized School Import Script
 * Handles 1M+ records with connection pooling, retry logic, and progress monitoring
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parser';
import { logger } from '../utils/logger';

// Connection-optimized Prisma client
const createOptimizedPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // Add connection pooling parameters if not present
  const hasPooling = connectionString.includes('connection_limit');
  const optimizedUrl = hasPooling 
    ? connectionString 
    : `${connectionString}?connection_limit=20&pool_timeout=30&connect_timeout=60`;

  return new PrismaClient({
    datasources: {
      db: { url: optimizedUrl }
    },
    log: ['error', 'warn']
  });
};

let prisma = createOptimizedPrismaClient();

// Configuration
const CONFIG = {
  BATCH_SIZE: 200,        // Smaller batches for better connection management
  MAX_RETRIES: 5,         // Increased retries
  RETRY_DELAY: 3000,      // 3 seconds between retries
  CONNECTION_RESET_INTERVAL: 30, // Reset connection every 30 batches
  PROGRESS_REPORT_INTERVAL: 5,   // Report progress every 5 batches
  MEMORY_CLEANUP_INTERVAL: 5000, // Cleanup memory every 5000 records
};

// State code mapping
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

interface ImportStats {
  totalProcessed: number;
  totalSuccess: number;
  totalErrors: number;
  startTime: number;
  estimatedTotal: number;
  lastReportTime: number;
}

// Utility functions
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function checkConnectionHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.warn('Connection health check failed:', error);
    return false;
  }
}

async function resetConnection(): Promise<void> {
  try {
    await prisma.$disconnect();
    await sleep(2000);
    prisma = createOptimizedPrismaClient();
    logger.info('Database connection reset successfully');
  } catch (error) {
    logger.error('Failed to reset database connection:', error);
    throw error;
  }
}

// State counters for ID generation
const stateCounters = new Map<string, number>();

async function initializeStateCounters(): Promise<void> {
  logger.info('Initializing state counters...');
  
  for (const [stateName, stateCode] of Object.entries(STATE_CODES)) {
    try {
      const maxId = await prisma.school.findFirst({
        where: { institutionId: { startsWith: `INC-IN-${stateCode}-` } },
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
    } catch (error) {
      logger.warn(`Failed to initialize counter for ${stateName}, starting from 1`);
      stateCounters.set(stateCode, 1);
    }
  }
  
  logger.info('State counters initialized');
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

async function processBatchWithRetry(schools: SchoolData[], batchIndex: number, retryCount = 0): Promise<{ success: number; errors: any[] }> {
  const errors: any[] = [];
  let success = 0;

  try {
    // Validate schools
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

    // Process in small chunks to avoid connection exhaustion
    const chunkSize = 50;
    for (let i = 0; i < validSchools.length; i += chunkSize) {
      const chunk = validSchools.slice(i, i + chunkSize);
      
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
            // Legacy fields for compatibility
            name: school.schoolName,
            udiseCode: school.udiseSchoolCode,
            schoolTypeLegacy: school.schoolCategory?.includes('Primary') ? 'Primary' : 
                             school.schoolCategory?.includes('Higher Secondary') ? 'Higher Secondary' : 'Secondary',
            managementType: school.management?.includes('Government') ? 'Government' : 'Private'
          })),
          skipDuplicates: true
        });
        
        success += chunk.length;
        
        // Small delay between chunks
        if (i + chunkSize < validSchools.length) {
          await sleep(50);
        }
        
      } catch (chunkError: any) {
        logger.error(`Chunk ${i}-${i + chunkSize} error:`, chunkError.message);
        errors.push({ error: chunkError.message, chunk: chunk.length });
      }
    }

  } catch (error: any) {
    logger.error(`Batch ${batchIndex} error:`, error.message);
    
    // Handle connection-related errors with retries
    if ((error.code === 'P2024' || error.message.includes('connection') || error.message.includes('timeout')) && retryCount < CONFIG.MAX_RETRIES) {
      logger.warn(`Retrying batch ${batchIndex}... (${retryCount + 1}/${CONFIG.MAX_RETRIES})`);
      
      // Check and reset connection if needed
      const isHealthy = await checkConnectionHealth();
      if (!isHealthy) {
        await resetConnection();
      }
      
      await sleep(CONFIG.RETRY_DELAY * (retryCount + 1)); // Exponential backoff
      return processBatchWithRetry(schools, batchIndex, retryCount + 1);
    }
    
    errors.push({ error: error.message, batch: schools.length });
  }

  return { success, errors };
}

function reportProgress(stats: ImportStats): void {
  const { totalProcessed, totalSuccess, totalErrors, startTime, estimatedTotal } = stats;
  const elapsed = (Date.now() - startTime) / 1000;
  const rate = totalProcessed / elapsed;
  const eta = estimatedTotal > 0 ? (estimatedTotal - totalProcessed) / rate : 0;
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const successRate = ((totalSuccess / totalProcessed) * 100).toFixed(1);
  const progress = estimatedTotal > 0 ? ((totalProcessed / estimatedTotal) * 100).toFixed(1) : '0.0';

  logger.info(`Progress: ${totalProcessed}/${estimatedTotal || '?'} (${progress}%) | Success: ${totalSuccess} (${successRate}%) | Errors: ${totalErrors} | Rate: ${rate.toFixed(1)}/sec | ETA: ${formatTime(eta)}`);
}

export async function importSchoolsOptimized(csvFilePath: string): Promise<void> {
  if (!fs.existsSync(csvFilePath)) {
    throw new Error(`CSV file not found: ${csvFilePath}`);
  }

  const stats: ImportStats = {
    totalProcessed: 0,
    totalSuccess: 0,
    totalErrors: 0,
    startTime: Date.now(),
    estimatedTotal: 0,
    lastReportTime: Date.now()
  };

  logger.info(`Starting optimized school import from: ${csvFilePath}`);

  try {
    // Initialize state counters
    await initializeStateCounters();

    // Load and process data
    const allData: SchoolData[] = [];
    
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (data: any) => {
          const schoolData = cleanData(data);
          allData.push(schoolData);
        })
        .on('end', () => {
          stats.estimatedTotal = allData.length;
          logger.info(`Loaded ${allData.length} records from CSV, starting batch processing...`);
          resolve();
        })
        .on('error', reject);
    });

    // Process in optimized batches
    for (let i = 0; i < allData.length; i += CONFIG.BATCH_SIZE) {
      const batch = allData.slice(i, i + CONFIG.BATCH_SIZE);
      const batchIndex = Math.floor(i / CONFIG.BATCH_SIZE);
      
      const { success, errors } = await processBatchWithRetry(batch, batchIndex);
      
      stats.totalProcessed += batch.length;
      stats.totalSuccess += success;
      stats.totalErrors += errors.length;

      // Progress reporting
      if (batchIndex % CONFIG.PROGRESS_REPORT_INTERVAL === 0 || i + CONFIG.BATCH_SIZE >= allData.length) {
        reportProgress(stats);
      }

      // Connection maintenance
      if (batchIndex % CONFIG.CONNECTION_RESET_INTERVAL === 0 && batchIndex > 0) {
        logger.info('Performing connection maintenance...');
        await resetConnection();
      }

      // Memory cleanup
      if (stats.totalProcessed % CONFIG.MEMORY_CLEANUP_INTERVAL === 0 && global.gc) {
        global.gc();
        logger.debug('Memory cleanup performed');
      }
    }

    const finalElapsed = (Date.now() - stats.startTime) / 1000;
    const finalRate = stats.totalProcessed / finalElapsed;
    const successRate = ((stats.totalSuccess / stats.totalProcessed) * 100).toFixed(2);

    logger.info(`Import completed successfully!`);
    logger.info(`📊 Final Statistics:`);
    logger.info(`   Total Processed: ${stats.totalProcessed}`);
    logger.info(`   Successfully Imported: ${stats.totalSuccess}`);
    logger.info(`   Errors: ${stats.totalErrors}`);
    logger.info(`   Success Rate: ${successRate}%`);
    logger.info(`   Total Time: ${Math.floor(finalElapsed / 60)}m ${Math.floor(finalElapsed % 60)}s`);
    logger.info(`   Average Rate: ${finalRate.toFixed(1)} records/sec`);

  } catch (error) {
    logger.error('Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// CLI execution
async function main() {
  try {
    const csvPath = process.argv[2];
    if (!csvPath) {
      console.error('Usage: npm run import-schools-optimized <path-to-csv-file>');
      process.exit(1);
    }

    await importSchoolsOptimized(csvPath);
  } catch (error) {
    logger.error('Import failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}