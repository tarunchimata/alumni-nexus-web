/**
 * Production-Ready Optimized User Import Script
 * Handles 1M+ user records with advanced connection pooling, retry logic, and progress monitoring
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parser';
import { logger } from '../utils/logger';
import { keycloakAdminClient } from '../services/keycloakAdmin';

// Connection-optimized Prisma client
const createOptimizedPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const hasPooling = connectionString.includes('connection_limit');
  const optimizedUrl = hasPooling 
    ? connectionString 
    : `${connectionString}?connection_limit=25&pool_timeout=30&connect_timeout=60`;

  return new PrismaClient({
    datasources: { db: { url: optimizedUrl } },
    log: ['error', 'warn']
  });
};

let prisma = createOptimizedPrismaClient();

// Configuration
const CONFIG = {
  BATCH_SIZE: 200,              // Optimized batch size for user processing
  MAX_RETRIES: 5,               // Maximum retry attempts
  RETRY_DELAY: 3000,            // Base retry delay (ms)
  CONNECTION_RESET_INTERVAL: 25, // Reset connection every N batches
  PROGRESS_REPORT_INTERVAL: 3,   // Report progress every N batches
  MEMORY_CLEANUP_INTERVAL: 2500, // Cleanup memory every N records
  KEYCLOAK_BATCH_SIZE: 50,      // Smaller batches for Keycloak to avoid rate limits
  KEYCLOAK_DELAY: 100,          // Delay between Keycloak calls (ms)
};

interface UserData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  schoolId: string;
  phoneNumber?: string;
  dateOfBirth?: Date | null;
  admissionYear?: number | null;
  graduationYear?: number | null;
}

interface ImportStats {
  totalProcessed: number;
  totalSuccess: number;
  totalErrors: number;
  userCreated: number;
  keycloakCreated: number;
  keycloakErrors: number;
  startTime: number;
  lastReportTime: number;
}

const VALID_ROLES = ['student', 'teacher', 'alumni', 'school_admin', 'platform_admin'];

// Enhanced school cache with pre-loading
const schoolCache = new Map<string, { id: string; name: string }>();

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

// Validation functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[0-9\-\s\(\)]+$/;
  return phone.length >= 10 && phoneRegex.test(phone);
}

function isValidDateOfBirth(dob: string): boolean {
  if (!dob) return true;
  
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return false;
  
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1 >= 5 && age - 1 <= 100;
  }
  return age >= 5 && age <= 100;
}

// Enhanced data cleaning with better validation
function cleanData(row: any): UserData | null {
  const getField = (possibleNames: string[]): string => {
    for (const name of possibleNames) {
      if (row[name] !== undefined && row[name] !== '') {
        return row[name].trim();
      }
    }
    return '';
  };

  const email = getField(['email', 'Email', 'EMAIL', 'email_address']);
  const firstName = getField(['first_name', 'firstName', 'First Name', 'FIRST_NAME']);
  const lastName = getField(['last_name', 'lastName', 'Last Name', 'LAST_NAME']);
  const role = getField(['role', 'Role', 'ROLE', 'user_type', 'userType']);
  const schoolUdiseCode = getField(['school_udise_code', 'udise_code', 'UDISE_CODE', 'school_code']);

  // Validate required fields
  if (!email || !firstName || !lastName || !role || !schoolUdiseCode) {
    return null;
  }

  if (!isValidEmail(email) || !VALID_ROLES.includes(role.toLowerCase())) {
    return null;
  }

  // Get school from cache
  const school = schoolCache.get(schoolUdiseCode);
  if (!school) {
    return null;
  }

  const phoneNumber = getField(['phone_number', 'phone', 'Phone', 'PHONE', 'contact_number']);
  const dateOfBirth = getField(['date_of_birth', 'dob', 'DOB', 'birth_date']);
  const admissionYear = getField(['admission_year', 'admissionYear', 'admission', 'ADMISSION_YEAR']);
  const graduationYear = getField(['graduation_year', 'graduationYear', 'graduation', 'GRADUATION_YEAR']);

  return {
    email: email.toLowerCase(),
    firstName,
    lastName,
    role: role.toLowerCase(),
    schoolId: school.id,
    phoneNumber: phoneNumber && isValidPhone(phoneNumber) ? phoneNumber : undefined,
    dateOfBirth: dateOfBirth && isValidDateOfBirth(dateOfBirth) ? new Date(dateOfBirth) : null,
    admissionYear: admissionYear ? parseInt(admissionYear) : null,
    graduationYear: graduationYear ? parseInt(graduationYear) : null
  };
}

// Enhanced school cache loading
async function loadSchoolCache(): Promise<void> {
  logger.info('Loading enhanced school cache...');
  
  const schools = await prisma.school.findMany({
    select: {
      id: true,
      udiseSchoolCode: true,
      udiseCode: true,
      schoolName: true
    }
  });

  for (const school of schools) {
    const schoolInfo = { id: school.id, name: school.schoolName };
    
    if (school.udiseSchoolCode) {
      schoolCache.set(school.udiseSchoolCode, schoolInfo);
    }
    if (school.udiseCode) {
      schoolCache.set(school.udiseCode, schoolInfo);
    }
  }

  logger.info(`Enhanced school cache loaded: ${schoolCache.size} schools`);
}

// Optimized Keycloak user creation with batching
async function createKeycloakUsers(users: UserData[]): Promise<{ success: number; errors: any[] }> {
  const errors: any[] = [];
  let success = 0;

  // Process Keycloak users in smaller batches to avoid rate limits
  for (let i = 0; i < users.length; i += CONFIG.KEYCLOAK_BATCH_SIZE) {
    const batch = users.slice(i, i + CONFIG.KEYCLOAK_BATCH_SIZE);
    
    for (const user of batch) {
      try {
        await keycloakAdminClient.createUser({
          username: user.email,
          email: user.email,
          password: 'TempPass123!',
          firstName: user.firstName,
          lastName: user.lastName,
          school_id: user.schoolId,
          user_type: user.role,
          phone: user.phoneNumber,
          dateOfBirth: user.dateOfBirth?.toISOString(),
          status: 'pending_approval'
        });
        success++;
        
        // Small delay to avoid rate limiting
        await sleep(CONFIG.KEYCLOAK_DELAY);
        
      } catch (keycloakError: any) {
        errors.push({
          email: user.email,
          error: `Keycloak creation failed: ${keycloakError.message}`,
          type: 'keycloak'
        });
      }
    }
    
    // Longer delay between batches
    if (i + CONFIG.KEYCLOAK_BATCH_SIZE < users.length) {
      await sleep(CONFIG.KEYCLOAK_DELAY * 5);
    }
  }

  return { success, errors };
}

// Advanced batch processing with retry logic
async function processBatchWithRetry(users: UserData[], batchIndex: number, retryCount = 0): Promise<{ success: number; errors: any[] }> {
  const errors: any[] = [];
  let success = 0;

  try {
    // Check connection health
    const isHealthy = await checkConnectionHealth();
    if (!isHealthy && retryCount < CONFIG.MAX_RETRIES) {
      logger.warn(`Connection unhealthy, retrying batch ${batchIndex}... (${retryCount + 1}/${CONFIG.MAX_RETRIES})`);
      await resetConnection();
      await sleep(CONFIG.RETRY_DELAY);
      return processBatchWithRetry(users, batchIndex, retryCount + 1);
    }

    // Filter out existing users efficiently
    const userEmails = users.map(u => u.email);
    const existingUsers = await prisma.user.findMany({
      where: { email: { in: userEmails } },
      select: { email: true }
    });

    const existingEmails = new Set(existingUsers.map(u => u.email));
    const newUsers = users.filter(u => !existingEmails.has(u.email));

    if (newUsers.length === 0) {
      logger.debug(`Batch ${batchIndex}: All users already exist`);
      return { success: 0, errors };
    }

    // Create users in database with optimized chunking
    const chunkSize = 100;
    let dbSuccess = 0;
    
    for (let i = 0; i < newUsers.length; i += chunkSize) {
      const chunk = newUsers.slice(i, i + chunkSize);
      
      try {
        const result = await prisma.user.createMany({
          data: chunk.map(user => ({
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            schoolId: user.schoolId,
            phoneNumber: user.phoneNumber,
            dateOfBirth: user.dateOfBirth,
            admissionYear: user.admissionYear,
            graduationYear: user.graduationYear,
            status: 'pending_approval'
          })),
          skipDuplicates: true
        });
        
        dbSuccess += result.count;
        
        // Small delay between chunks
        if (i + chunkSize < newUsers.length) {
          await sleep(100);
        }
        
      } catch (chunkError: any) {
        logger.error(`Database chunk error in batch ${batchIndex}:`, chunkError.message);
        errors.push({ error: chunkError.message, chunk: chunk.length });
      }
    }

    success = dbSuccess;
    logger.debug(`Batch ${batchIndex}: Created ${success} users in database`);

    // Create users in Keycloak (only for successfully created DB users)
    if (success > 0) {
      const { success: keycloakSuccess, errors: keycloakErrors } = await createKeycloakUsers(newUsers.slice(0, success));
      errors.push(...keycloakErrors);
      logger.debug(`Batch ${batchIndex}: Created ${keycloakSuccess} users in Keycloak`);
    }

  } catch (error: any) {
    logger.error(`Batch ${batchIndex} error:`, error.message);
    
    // Enhanced retry logic for different error types
    if (retryCount < CONFIG.MAX_RETRIES) {
      const shouldRetry = 
        error.code === 'P2024' || 
        error.message.includes('connection') || 
        error.message.includes('timeout') ||
        error.message.includes('pool');
        
      if (shouldRetry) {
        logger.warn(`Retrying batch ${batchIndex}... (${retryCount + 1}/${CONFIG.MAX_RETRIES})`);
        await resetConnection();
        await sleep(CONFIG.RETRY_DELAY * (retryCount + 1)); // Exponential backoff
        return processBatchWithRetry(users, batchIndex, retryCount + 1);
      }
    }
    
    errors.push({ error: error.message, batch: users.length });
  }

  return { success, errors };
}

// Enhanced progress reporting
function reportProgress(stats: ImportStats, estimatedTotal: number): void {
  const elapsed = (Date.now() - stats.startTime) / 1000;
  const rate = stats.totalProcessed / elapsed;
  const eta = estimatedTotal > 0 ? (estimatedTotal - stats.totalProcessed) / rate : 0;
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const progress = estimatedTotal > 0 ? ((stats.totalProcessed / estimatedTotal) * 100).toFixed(1) : '0.0';
  const successRate = ((stats.totalSuccess / stats.totalProcessed) * 100).toFixed(1);
  const keycloakRate = stats.userCreated > 0 ? ((stats.keycloakCreated / stats.userCreated) * 100).toFixed(1) : '0.0';

  logger.info(`Progress: ${stats.totalProcessed}/${estimatedTotal} (${progress}%) | Success: ${stats.totalSuccess} (${successRate}%) | DB: ${stats.userCreated} | KC: ${stats.keycloakCreated} (${keycloakRate}%) | Errors: ${stats.totalErrors} | Rate: ${rate.toFixed(1)}/sec | ETA: ${formatTime(eta)}`);
}

export async function importUsersOptimized(csvFilePath: string): Promise<void> {
  if (!fs.existsSync(csvFilePath)) {
    throw new Error(`CSV file not found: ${csvFilePath}`);
  }

  const stats: ImportStats = {
    totalProcessed: 0,
    totalSuccess: 0,
    totalErrors: 0,
    userCreated: 0,
    keycloakCreated: 0,
    keycloakErrors: 0,
    startTime: Date.now(),
    lastReportTime: Date.now()
  };

  logger.info(`Starting optimized user import from: ${csvFilePath}`);

  try {
    // Load school cache
    await loadSchoolCache();

    // Load and process data with memory optimization
    let allData: UserData[] = [];
    const invalidRows: any[] = [];

    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (data: any) => {
          const userData = cleanData(data);
          if (userData) {
            allData.push(userData);
          } else {
            invalidRows.push(data);
          }
        })
        .on('end', () => {
          logger.info(`Loaded ${allData.length} valid users from CSV (${invalidRows.length} invalid rows)`);
          resolve();
        })
        .on('error', reject);
    });

    if (invalidRows.length > 0) {
      logger.warn(`Found ${invalidRows.length} invalid rows. Sample:`, invalidRows.slice(0, 3));
      
      // Save invalid rows for analysis
      fs.writeFileSync('user-import-invalid-rows.json', JSON.stringify(invalidRows.slice(0, 100), null, 2));
      logger.info('Sample invalid rows saved to user-import-invalid-rows.json');
    }

    // Process in optimized batches
    const allErrors: any[] = [];
    
    for (let i = 0; i < allData.length; i += CONFIG.BATCH_SIZE) {
      const batch = allData.slice(i, i + CONFIG.BATCH_SIZE);
      const batchIndex = Math.floor(i / CONFIG.BATCH_SIZE);
      
      const { success, errors } = await processBatchWithRetry(batch, batchIndex);
      
      stats.totalProcessed += batch.length;
      stats.totalSuccess += success;
      stats.userCreated += success;
      stats.totalErrors += errors.length;
      allErrors.push(...errors);

      // Count Keycloak successes and errors separately
      const keycloakErrors = errors.filter(e => e.type === 'keycloak').length;
      stats.keycloakErrors += keycloakErrors;
      stats.keycloakCreated += (success - keycloakErrors);

      // Progress reporting
      if (batchIndex % CONFIG.PROGRESS_REPORT_INTERVAL === 0 || i + CONFIG.BATCH_SIZE >= allData.length) {
        reportProgress(stats, allData.length);
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

    // Final cleanup
    allData = [];

    // Final summary
    const finalElapsed = (Date.now() - stats.startTime) / 1000;
    const finalRate = stats.totalProcessed / finalElapsed;
    const successRate = ((stats.totalSuccess / stats.totalProcessed) * 100).toFixed(2);
    const keycloakSuccessRate = stats.userCreated > 0 ? ((stats.keycloakCreated / stats.userCreated) * 100).toFixed(2) : '0.00';

    logger.info(`Optimized user import completed successfully!`);
    logger.info(`📊 Final Statistics:`);
    logger.info(`   Total Processed: ${stats.totalProcessed}`);
    logger.info(`   Successfully Created: ${stats.totalSuccess}`);
    logger.info(`   Database Users: ${stats.userCreated}`);
    logger.info(`   Keycloak Users: ${stats.keycloakCreated} (${keycloakSuccessRate}%)`);
    logger.info(`   Keycloak Errors: ${stats.keycloakErrors}`);
    logger.info(`   Total Errors: ${stats.totalErrors}`);
    logger.info(`   Success Rate: ${successRate}%`);
    logger.info(`   Total Time: ${Math.floor(finalElapsed / 60)}m ${Math.floor(finalElapsed % 60)}s`);
    logger.info(`   Average Rate: ${finalRate.toFixed(1)} records/sec`);

    // Save comprehensive error report
    if (allErrors.length > 0) {
      const errorFile = 'user-optimized-import-errors.json';
      const errorSummary = {
        totalErrors: allErrors.length,
        errorsByType: allErrors.reduce((acc, error) => {
          const type = error.type || 'database';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        sampleErrors: allErrors.slice(0, 10),
        fullErrors: allErrors
      };
      
      fs.writeFileSync(errorFile, JSON.stringify(errorSummary, null, 2));
      logger.warn(`Comprehensive error report saved to ${errorFile}`);
    }

  } catch (error) {
    logger.error('Optimized import failed:', error);
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
      console.error('Usage: npm run import-users-optimized <path-to-csv-file>');
      process.exit(1);
    }

    await importUsersOptimized(csvPath);
  } catch (error) {
    logger.error('Import failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}