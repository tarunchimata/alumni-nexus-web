/**
 * User CSV Import Script for My School Buddies
 * Imports user data from CSV into users table with Keycloak integration
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parser';
import { logger } from '../utils/logger';
import { keycloakAdminClient } from '../services/keycloakAdmin';

const prisma = new PrismaClient();

interface CSVRow {
  [key: string]: string;
}

interface UserData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  schoolUdiseCode: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  admissionYear?: string;
  graduationYear?: string;
}

interface ImportStats {
  totalProcessed: number;
  totalSuccess: number;
  totalErrors: number;
  userCreated: number;
  keycloakCreated: number;
}

// Valid user roles
const VALID_ROLES = ['student', 'teacher', 'alumni', 'school_admin', 'platform_admin'];

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone number format
function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[0-9\-\s\(\)]+$/;
  return phone.length >= 10 && phoneRegex.test(phone);
}

// Validate date of birth (age between 5-100 years)
function isValidDateOfBirth(dob: string): boolean {
  if (!dob) return true; // Optional field
  
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
function cleanData(row: CSVRow): UserData | null {
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

  // Validate email format
  if (!isValidEmail(email)) {
    return null;
  }

  // Validate role
  if (!VALID_ROLES.includes(role.toLowerCase())) {
    return null;
  }

  const phoneNumber = getField(['phone_number', 'phone', 'Phone', 'PHONE', 'contact_number']);
  const dateOfBirth = getField(['date_of_birth', 'dob', 'DOB', 'birth_date']);
  const admissionYear = getField(['admission_year', 'admissionYear', 'admission', 'ADMISSION_YEAR']);
  const graduationYear = getField(['graduation_year', 'graduationYear', 'graduation', 'GRADUATION_YEAR']);

  // Validate optional fields
  if (phoneNumber && !isValidPhone(phoneNumber)) {
    logger.warn(`Invalid phone number for ${email}: ${phoneNumber}`);
  }

  if (dateOfBirth && !isValidDateOfBirth(dateOfBirth)) {
    logger.warn(`Invalid date of birth for ${email}: ${dateOfBirth}`);
  }

  return {
    email: email.toLowerCase(),
    firstName,
    lastName,
    role: role.toLowerCase(),
    schoolUdiseCode,
    phoneNumber: phoneNumber || undefined,
    dateOfBirth: dateOfBirth || undefined,
    admissionYear: admissionYear || undefined,
    graduationYear: graduationYear || undefined
  };
}

// Check if school exists
async function validateSchool(udiseCode: string): Promise<string | null> {
  const school = await prisma.school.findFirst({
    where: {
      OR: [
        { udiseSchoolCode: udiseCode },
        { udiseCode: udiseCode }
      ]
    },
    select: { id: true, schoolName: true }
  });

  if (!school) {
    logger.warn(`School not found for UDISE code: ${udiseCode}`);
    return null;
  }

  return school.id;
}

// Create user in database and Keycloak
async function createUser(userData: UserData, schoolId: string): Promise<{ userCreated: boolean; keycloakCreated: boolean }> {
  let userCreated = false;
  let keycloakCreated = false;

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      logger.warn(`User already exists: ${userData.email}`);
      return { userCreated: false, keycloakCreated: false };
    }

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        schoolId: schoolId,
        phoneNumber: userData.phoneNumber,
        dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : null,
        admissionYear: userData.admissionYear ? parseInt(userData.admissionYear) : null,
        graduationYear: userData.graduationYear ? parseInt(userData.graduationYear) : null,
        status: 'pending_approval'
      }
    });

    userCreated = true;
    logger.debug(`User created in database: ${userData.email}`);

    // Create user in Keycloak
    try {
      const defaultPassword = 'TempPass123!'; // Users will change on first login

      await keycloakAdminClient.createUser({
        username: userData.email,
        email: userData.email,
        password: defaultPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        school_id: schoolId,
        user_type: userData.role,
        phone: userData.phoneNumber,
        dateOfBirth: userData.dateOfBirth,
        status: 'pending_approval'
      });

      keycloakCreated = true;
      logger.debug(`User created in Keycloak: ${userData.email}`);

    } catch (keycloakError: any) {
      logger.error(`Failed to create user in Keycloak: ${userData.email}`, keycloakError.message);
      // Continue - user exists in database even if Keycloak creation fails
    }

    return { userCreated, keycloakCreated };

  } catch (error: any) {
    logger.error(`Failed to create user: ${userData.email}`, error.message);
    return { userCreated: false, keycloakCreated: false };
  }
}

export async function importUsers(csvFilePath: string): Promise<void> {
  if (!fs.existsSync(csvFilePath)) {
    throw new Error(`CSV file not found: ${csvFilePath}`);
  }

  logger.info('Starting user import from CSV...');
  
  const stats: ImportStats = {
    totalProcessed: 0,
    totalSuccess: 0,
    totalErrors: 0,
    userCreated: 0,
    keycloakCreated: 0
  };

  const errors: Array<{ row: number; error: string; data?: any }> = [];
  const results: CSVRow[] = [];

  // Read CSV file
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data: CSVRow) => {
        results.push(data);
      })
      .on('end', () => {
        logger.info(`Processing ${results.length} rows from CSV...`);
        resolve();
      })
      .on('error', reject);
  });

  // Log CSV structure
  if (results.length > 0) {
    logger.info('CSV columns detected:', Object.keys(results[0]));
    logger.info('First row sample:', results[0]);
  }

  // Process each row
  for (let i = 0; i < results.length; i++) {
    const rowNumber = i + 1;
    stats.totalProcessed++;

    try {
      const userData = cleanData(results[i]);
      
      if (!userData) {
        errors.push({
          row: rowNumber,
          error: 'Invalid or missing required fields',
          data: results[i]
        });
        stats.totalErrors++;
        continue;
      }

      // Validate school exists
      const schoolId = await validateSchool(userData.schoolUdiseCode);
      if (!schoolId) {
        errors.push({
          row: rowNumber,
          error: `School not found for UDISE code: ${userData.schoolUdiseCode}`,
          data: userData
        });
        stats.totalErrors++;
        continue;
      }

      // Create user
      const { userCreated, keycloakCreated } = await createUser(userData, schoolId);
      
      if (userCreated) {
        stats.userCreated++;
      }
      
      if (keycloakCreated) {
        stats.keycloakCreated++;
      }

      if (userCreated || keycloakCreated) {
        stats.totalSuccess++;
      } else {
        stats.totalErrors++;
        errors.push({
          row: rowNumber,
          error: 'Failed to create user in database or Keycloak',
          data: userData
        });
      }

      // Progress logging
      if (stats.totalProcessed % 100 === 0) {
        logger.info(`Processed ${stats.totalProcessed} users... (Success: ${stats.totalSuccess}, Errors: ${stats.totalErrors})`);
      }

    } catch (error: any) {
      stats.totalErrors++;
      errors.push({
        row: rowNumber,
        error: error.message,
        data: results[i]
      });
    }
  }

  // Final summary
  logger.info(`User import completed!`);
  logger.info(`📊 Import Statistics:`);
  logger.info(`   Total Processed: ${stats.totalProcessed}`);
  logger.info(`   Total Success: ${stats.totalSuccess}`);
  logger.info(`   Database Users Created: ${stats.userCreated}`);
  logger.info(`   Keycloak Users Created: ${stats.keycloakCreated}`);
  logger.info(`   Total Errors: ${stats.totalErrors}`);
  logger.info(`   Success Rate: ${((stats.totalSuccess / stats.totalProcessed) * 100).toFixed(2)}%`);

  // Save errors to file
  if (errors.length > 0) {
    const errorFile = 'user-import-errors.json';
    fs.writeFileSync(errorFile, JSON.stringify(errors, null, 2));
    logger.warn(`${errors.length} errors occurred. Details saved to ${errorFile}`);
    logger.warn('Sample errors:', errors.slice(0, 5));
  }
}

// CLI execution
async function main() {
  try {
    const csvPath = process.argv[2];
    if (!csvPath) {
      console.error('Usage: npm run import-users <path-to-csv-file>');
      process.exit(1);
    }

    await importUsers(csvPath);
    logger.info('User import completed successfully');
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