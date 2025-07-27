/**
 * Bulk User CSV Import Script for My School Buddies
 * Handles large user datasets with batch processing and Keycloak integration
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parser';
import { logger } from '../utils/logger';
import { keycloakAdminClient } from '../services/keycloakAdmin';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=15&pool_timeout=30&connect_timeout=60'
    }
  },
  log: ['error', 'warn']
});

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
  startTime: number;
}

const BATCH_SIZE = 500;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const VALID_ROLES = ['student', 'teacher', 'alumni', 'school_admin', 'platform_admin'];

// School cache to avoid repeated database queries
const schoolCache = new Map<string, string>();

// Utility functions
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1 >= 5 && age - 1 <= 100;
  }
  return age >= 5 && age <= 100;
}

// Clean and validate user data
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

  // Get school ID from cache
  const schoolId = schoolCache.get(schoolUdiseCode);
  if (!schoolId) {
    return null; // School not found
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
    schoolId,
    phoneNumber: phoneNumber && isValidPhone(phoneNumber) ? phoneNumber : undefined,
    dateOfBirth: dateOfBirth && isValidDateOfBirth(dateOfBirth) ? new Date(dateOfBirth) : null,
    admissionYear: admissionYear ? parseInt(admissionYear) : null,
    graduationYear: graduationYear ? parseInt(graduationYear) : null
  };
}

// Load school cache
async function loadSchoolCache(): Promise<void> {
  logger.info('Loading school cache...');
  
  const schools = await prisma.school.findMany({
    select: {
      id: true,
      udiseSchoolCode: true,
      udiseCode: true,
      schoolName: true
    }
  });

  for (const school of schools) {
    if (school.udiseSchoolCode) {
      schoolCache.set(school.udiseSchoolCode, school.id);
    }
    if (school.udiseCode) {
      schoolCache.set(school.udiseCode, school.id);
    }
  }

  logger.info(`School cache loaded: ${schoolCache.size} schools`);
}

// Process batch with retry logic
async function processBatchWithRetry(users: UserData[], batchIndex: number, retryCount = 0): Promise<{ success: number; errors: any[] }> {
  const errors: any[] = [];
  let success = 0;

  try {
    // Filter out existing users
    const userEmails = users.map(u => u.email);
    const existingUsers = await prisma.user.findMany({
      where: { email: { in: userEmails } },
      select: { email: true }
    });

    const existingEmails = new Set(existingUsers.map(u => u.email));
    const newUsers = users.filter(u => !existingEmails.has(u.email));

    if (newUsers.length === 0) {
      logger.info(`Batch ${batchIndex}: All users already exist`);
      return { success: 0, errors };
    }

    // Create users in database (batch insert)
    const createdUsers = await prisma.user.createMany({
      data: newUsers.map(user => ({
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

    success = createdUsers.count;
    logger.debug(`Batch ${batchIndex}: Created ${success} users in database`);

    // Create users in Keycloak (individual calls with error handling)
    let keycloakSuccess = 0;
    for (const user of newUsers) {
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
        keycloakSuccess++;
      } catch (keycloakError: any) {
        errors.push({
          email: user.email,
          error: `Keycloak creation failed: ${keycloakError.message}`,
          type: 'keycloak'
        });
      }
    }

    logger.debug(`Batch ${batchIndex}: Created ${keycloakSuccess} users in Keycloak`);

  } catch (error: any) {
    logger.error(`Batch ${batchIndex} error:`, error.message);
    
    // Retry on connection errors
    if ((error.code === 'P2024' || error.message.includes('connection')) && retryCount < MAX_RETRIES) {
      logger.warn(`Retrying batch ${batchIndex}... (${retryCount + 1}/${MAX_RETRIES})`);
      await sleep(RETRY_DELAY * (retryCount + 1));
      return processBatchWithRetry(users, batchIndex, retryCount + 1);
    }
    
    errors.push({ error: error.message, batch: users.length });
  }

  return { success, errors };
}

// Progress reporting
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

  logger.info(`Progress: ${stats.totalProcessed}/${estimatedTotal} (${progress}%) | Success: ${stats.totalSuccess} (${successRate}%) | DB: ${stats.userCreated} | KC: ${stats.keycloakCreated} | Errors: ${stats.totalErrors} | Rate: ${rate.toFixed(1)}/sec | ETA: ${formatTime(eta)}`);
}

export async function importUsersBulk(csvFilePath: string): Promise<void> {
  if (!fs.existsSync(csvFilePath)) {
    throw new Error(`CSV file not found: ${csvFilePath}`);
  }

  const stats: ImportStats = {
    totalProcessed: 0,
    totalSuccess: 0,
    totalErrors: 0,
    userCreated: 0,
    keycloakCreated: 0,
    startTime: Date.now()
  };

  logger.info(`Starting bulk user import from: ${csvFilePath}`);

  try {
    // Load school cache
    await loadSchoolCache();

    // Load all data
    const allData: UserData[] = [];
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
    }

    // Process in batches
    const allErrors: any[] = [];
    
    for (let i = 0; i < allData.length; i += BATCH_SIZE) {
      const batch = allData.slice(i, i + BATCH_SIZE);
      const batchIndex = Math.floor(i / BATCH_SIZE);
      
      const { success, errors } = await processBatchWithRetry(batch, batchIndex);
      
      stats.totalProcessed += batch.length;
      stats.totalSuccess += success;
      stats.userCreated += success;
      stats.totalErrors += errors.length;
      allErrors.push(...errors);

      // Count Keycloak successes (success - keycloak errors)
      const keycloakErrors = errors.filter(e => e.type === 'keycloak').length;
      stats.keycloakCreated += (success - keycloakErrors);

      // Report progress every 5 batches
      if (batchIndex % 5 === 0 || i + BATCH_SIZE >= allData.length) {
        reportProgress(stats, allData.length);
      }

      // Connection maintenance every 20 batches
      if (batchIndex % 20 === 0 && batchIndex > 0) {
        logger.info('Performing connection maintenance...');
        await prisma.$disconnect();
        await sleep(2000);
      }
    }

    // Final summary
    const finalElapsed = (Date.now() - stats.startTime) / 1000;
    const successRate = ((stats.totalSuccess / stats.totalProcessed) * 100).toFixed(2);

    logger.info(`Bulk user import completed!`);
    logger.info(`📊 Final Statistics:`);
    logger.info(`   Total Processed: ${stats.totalProcessed}`);
    logger.info(`   Successfully Created: ${stats.totalSuccess}`);
    logger.info(`   Database Users: ${stats.userCreated}`);
    logger.info(`   Keycloak Users: ${stats.keycloakCreated}`);
    logger.info(`   Total Errors: ${stats.totalErrors}`);
    logger.info(`   Success Rate: ${successRate}%`);
    logger.info(`   Total Time: ${Math.floor(finalElapsed / 60)}m ${Math.floor(finalElapsed % 60)}s`);

    // Save errors
    if (allErrors.length > 0) {
      const errorFile = 'user-bulk-import-errors.json';
      fs.writeFileSync(errorFile, JSON.stringify(allErrors, null, 2));
      logger.warn(`Errors saved to ${errorFile}`);
    }

  } catch (error) {
    logger.error('Bulk import failed:', error);
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
      console.error('Usage: npm run import-users-bulk <path-to-csv-file>');
      process.exit(1);
    }

    await importUsersBulk(csvPath);
  } catch (error) {
    logger.error('Import failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}