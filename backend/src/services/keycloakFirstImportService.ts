import { logger } from '../utils/logger';
import { keycloakAdminClient } from './keycloakAdmin';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface StrictCSVUserRow {
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  school_udise_code: string;
  phone_number?: string;
  date_of_birth?: string;
  admission_year?: string;
  graduation_year?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ProcessedRow extends StrictCSVUserRow {
  rowIndex: number;
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
  keycloakId?: string;
  exists_in_keycloak: boolean;
  exists_in_db: boolean;
  operation: 'create' | 'update' | 'skip';
}

export interface BatchResult {
  success: boolean;
  totalRows: number;
  processed: number;
  created: number;
  updated: number;
  failed: number;
  keycloakIds: string[];
  failedRows: ProcessedRow[];
  errors: string[];
}

const VALID_ROLES = ['student', 'teacher', 'alumni', 'school_admin', 'platform_admin'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[\d\s\-()]{10,15}$/;

export class KeycloakFirstImportService {
  
  async validateStrictCSV(rows: StrictCSVUserRow[]): Promise<ProcessedRow[]> {
    const processedRows: ProcessedRow[] = [];
    const emailSet = new Set<string>();
    
    // Get existing users from both Keycloak and DB for idempotency checks
    const existingEmails = await this.getExistingUserEmails();
    const existingSchools = await this.getExistingSchools();
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const processedRow: ProcessedRow = {
        ...row,
        rowIndex: i + 1,
        isValid: true,
        errors: [],
        warnings: [],
        exists_in_keycloak: existingEmails.keycloak.has(row.email.toLowerCase()),
        exists_in_db: existingEmails.db.has(row.email.toLowerCase()),
        operation: 'create'
      };

      // Validate required fields
      this.validateRequiredFields(processedRow);
      
      // Validate email
      this.validateEmail(processedRow, emailSet);
      
      // Validate names
      this.validateNames(processedRow);
      
      // Validate role
      this.validateRole(processedRow);
      
      // Validate school
      this.validateSchool(processedRow, existingSchools);
      
      // Validate optional fields
      this.validateOptionalFields(processedRow);
      
      // Determine operation type
      this.determineOperation(processedRow);
      
      processedRows.push(processedRow);
    }
    
    return processedRows;
  }

  private validateRequiredFields(row: ProcessedRow): void {
    const required = ['email', 'first_name', 'last_name', 'role', 'school_udise_code'];
    
    for (const field of required) {
      const value = (row as any)[field];
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        row.errors.push({
          field,
          message: `${field} is required`,
          code: 'REQUIRED_FIELD_MISSING'
        });
        row.isValid = false;
      }
    }
  }

  private validateEmail(row: ProcessedRow, emailSet: Set<string>): void {
    const email = row.email?.trim().toLowerCase();
    
    if (!email) return;
    
    if (!EMAIL_REGEX.test(email)) {
      row.errors.push({
        field: 'email',
        message: 'Invalid email format',
        code: 'INVALID_EMAIL_FORMAT'
      });
      row.isValid = false;
      return;
    }
    
    if (emailSet.has(email)) {
      row.errors.push({
        field: 'email',
        message: 'Duplicate email in CSV',
        code: 'DUPLICATE_EMAIL_IN_CSV'
      });
      row.isValid = false;
      return;
    }
    
    emailSet.add(email);
    row.email = email;
  }

  private validateNames(row: ProcessedRow): void {
    const nameFields = ['first_name', 'last_name'];
    
    for (const field of nameFields) {
      const value = (row as any)[field]?.trim();
      if (!value) continue;
      
      if (value.length < 2 || value.length > 50) {
        row.errors.push({
          field,
          message: `${field} must be 2-50 characters`,
          code: 'INVALID_NAME_LENGTH'
        });
        row.isValid = false;
      }
      
      if (!/^[a-zA-Z\s'-]+$/.test(value)) {
        row.errors.push({
          field,
          message: `${field} contains invalid characters`,
          code: 'INVALID_NAME_CHARACTERS'
        });
        row.isValid = false;
      }
    }
  }

  private validateRole(row: ProcessedRow): void {
    const role = row.role?.trim().toLowerCase();
    if (!role) return;
    
    if (!VALID_ROLES.includes(role)) {
      row.errors.push({
        field: 'role',
        message: `Role must be one of: ${VALID_ROLES.join(', ')}`,
        code: 'INVALID_ROLE'
      });
      row.isValid = false;
    } else {
      row.role = role;
    }
  }

  private validateSchool(row: ProcessedRow, existingSchools: Map<string, any>): void {
    const udiseCode = row.school_udise_code?.trim();
    if (!udiseCode) return;
    
    if (!existingSchools.has(udiseCode)) {
      row.errors.push({
        field: 'school_udise_code',
        message: 'School UDISE code not found in database',
        code: 'SCHOOL_NOT_FOUND'
      });
      row.isValid = false;
    }
  }

  private validateOptionalFields(row: ProcessedRow): void {
    // Validate phone number
    if (row.phone_number) {
      const phone = row.phone_number.trim();
      if (phone && !PHONE_REGEX.test(phone)) {
        row.errors.push({
          field: 'phone_number',
          message: 'Invalid phone number format',
          code: 'INVALID_PHONE_FORMAT'
        });
        row.isValid = false;
      }
    }
    
    // Validate date of birth
    if (row.date_of_birth) {
      const dob = new Date(row.date_of_birth);
      const now = new Date();
      const age = now.getFullYear() - dob.getFullYear();
      
      if (isNaN(dob.getTime())) {
        row.errors.push({
          field: 'date_of_birth',
          message: 'Invalid date format (use YYYY-MM-DD)',
          code: 'INVALID_DATE_FORMAT'
        });
        row.isValid = false;
      } else if (age < 5 || age > 100) {
        row.errors.push({
          field: 'date_of_birth',
          message: 'Age must be between 5 and 100 years',
          code: 'INVALID_AGE_RANGE'
        });
        row.isValid = false;
      }
    }
    
    // Validate years
    if (row.admission_year && row.graduation_year) {
      const admission = parseInt(row.admission_year);
      const graduation = parseInt(row.graduation_year);
      const currentYear = new Date().getFullYear();
      
      if (admission > graduation) {
        row.errors.push({
          field: 'graduation_year',
          message: 'Graduation year must be after admission year',
          code: 'INVALID_YEAR_SEQUENCE'
        });
        row.isValid = false;
      }
      
      if (graduation > currentYear + 10) {
        row.warnings.push('Graduation year is far in the future');
      }
    }
  }

  private determineOperation(row: ProcessedRow): void {
    if (!row.isValid) {
      row.operation = 'skip';
      return;
    }
    
    if (row.exists_in_keycloak || row.exists_in_db) {
      row.operation = 'update';
      if (row.exists_in_keycloak && !row.exists_in_db) {
        row.warnings.push('User exists in Keycloak but not in database - will sync');
      } else if (!row.exists_in_keycloak && row.exists_in_db) {
        row.warnings.push('User exists in database but not in Keycloak - will create in Keycloak');
      }
    } else {
      row.operation = 'create';
    }
  }

  async executeKeycloakBatch(validRows: ProcessedRow[]): Promise<BatchResult> {
    const result: BatchResult = {
      success: false,
      totalRows: validRows.length,
      processed: 0,
      created: 0,
      updated: 0,
      failed: 0,
      keycloakIds: [],
      failedRows: [],
      errors: []
    };

    const createdKeycloakIds: string[] = [];
    
    try {
      // Process each row with Keycloak operations
      for (const row of validRows) {
        try {
          let keycloakId: string;
          
          if (row.operation === 'create') {
            keycloakId = await this.createUserInKeycloak(row);
            createdKeycloakIds.push(keycloakId);
            result.created++;
          } else if (row.operation === 'update') {
            keycloakId = await this.updateUserInKeycloak(row);
            result.updated++;
          } else {
            continue; // Skip invalid rows
          }
          
          row.keycloakId = keycloakId;
          result.keycloakIds.push(keycloakId);
          result.processed++;
          
        } catch (error) {
          logger.error(`Failed to process row ${row.rowIndex}:`, error);
          row.errors.push({
            field: 'keycloak',
            message: error instanceof Error ? error.message : 'Unknown Keycloak error',
            code: 'KEYCLOAK_OPERATION_FAILED'
          });
          result.failedRows.push(row);
          result.failed++;
          
          // If this was a create operation, we need to track it for potential rollback
          if (row.keycloakId) {
            createdKeycloakIds.push(row.keycloakId);
          }
        }
      }
      
      // If any rows failed, rollback all Keycloak operations
      if (result.failed > 0) {
        logger.warn(`Rolling back ${createdKeycloakIds.length} Keycloak users due to failures`);
        await this.rollbackKeycloakBatch(createdKeycloakIds);
        result.success = false;
        result.errors.push(`Failed to process ${result.failed} rows - all Keycloak operations rolled back`);
      } else {
        result.success = true;
      }
      
    } catch (error) {
      logger.error('Batch Keycloak operation failed:', error);
      
      // Rollback any created users
      if (createdKeycloakIds.length > 0) {
        await this.rollbackKeycloakBatch(createdKeycloakIds);
      }
      
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Batch operation failed');
    }
    
    return result;
  }

  async syncToDatabase(successfulRows: ProcessedRow[]): Promise<{ synced: number; failed: number; errors: string[] }> {
    const result = { synced: 0, failed: 0, errors: [] };
    
    try {
      // Get school mapping for UDISE codes
      const schools = await prisma.school.findMany({
        select: { id: true, code: true }
      });
      const schoolMap = new Map(schools.map(s => [s.code, s.id]));
      
      for (const row of successfulRows) {
        try {
          const schoolId = schoolMap.get(row.school_udise_code);
          if (!schoolId) {
            throw new Error(`School not found for UDISE code: ${row.school_udise_code}`);
          }
          
          const userData = {
            keycloakId: row.keycloakId!,
            email: row.email,
            firstName: row.first_name,
            lastName: row.last_name,
            fullName: `${row.first_name} ${row.last_name}`,
            role: row.role as any,
            schoolId: schoolId,
            phone: row.phone_number || null,
            dateOfBirth: row.date_of_birth ? new Date(row.date_of_birth) : null,
            joinYear: row.admission_year ? parseInt(row.admission_year) : new Date().getFullYear(),
            passOutYear: row.graduation_year ? parseInt(row.graduation_year) : null,
            isActive: false,
            isVerified: false,
            approvalStatus: 'PENDING' as any,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          await prisma.user.upsert({
            where: { email: row.email },
            update: userData,
            create: userData
          });
          
          result.synced++;
          
        } catch (error) {
          logger.error(`Failed to sync row ${row.rowIndex} to database:`, error);
          result.failed++;
          result.errors.push(`Row ${row.rowIndex}: ${error instanceof Error ? error.message : 'Database sync failed'}`);
        }
      }
      
    } catch (error) {
      logger.error('Database sync batch operation failed:', error);
      result.errors.push(error instanceof Error ? error.message : 'Database batch sync failed');
    }
    
    return result;
  }

  private async createUserInKeycloak(row: ProcessedRow): Promise<string> {
    // Generate a temporary password for new users
    const tempPassword = this.generateTempPassword();
    
    return await keycloakAdminClient.createUser({
      username: row.email,
      email: row.email,
      password: tempPassword,
      firstName: row.first_name,
      lastName: row.last_name,
      school_id: row.school_udise_code,
      user_type: row.role,
      phone: row.phone_number,
      dateOfBirth: row.date_of_birth,
      status: 'pending_approval'
    });
  }

  private async updateUserInKeycloak(row: ProcessedRow): Promise<string> {
    // Get existing user
    let existingUser = await keycloakAdminClient.getUserByEmail(row.email);
    
    if (!existingUser) {
      // User doesn't exist in Keycloak, create them
      return await this.createUserInKeycloak(row);
    }
    
    // Update user attributes
    await keycloakAdminClient.updateUserAttributes(existingUser.id, {
      school_id: [row.school_udise_code],
      user_type: [row.role],
      ...(row.phone_number && { phone: [row.phone_number] }),
      ...(row.date_of_birth && { date_of_birth: [row.date_of_birth] })
    });
    
    return existingUser.id;
  }

  async rollbackKeycloakBatch(keycloakIds: string[]): Promise<void> {
    for (const id of keycloakIds) {
      try {
        await keycloakAdminClient.deleteUser(id);
        logger.info(`Rolled back Keycloak user: ${id}`);
      } catch (error) {
        logger.error(`Failed to rollback Keycloak user ${id}:`, error);
      }
    }
  }

  private async getExistingUserEmails(): Promise<{ keycloak: Set<string>; db: Set<string> }> {
    // Get emails from database
    const dbUsers = await prisma.user.findMany({
      select: { email: true }
    });
    const dbEmails = new Set(dbUsers.map(u => u.email.toLowerCase()));
    
    // For Keycloak, we'll check during individual validation
    // This is a simplified approach - in production you might want to batch query Keycloak
    const keycloakEmails = new Set<string>();
    
    return { keycloak: keycloakEmails, db: dbEmails };
  }

  private async getExistingSchools(): Promise<Map<string, any>> {
    const schools = await prisma.school.findMany({
      select: { id: true, code: true, name: true }
    });
    return new Map(schools.map(s => [s.code, s]));
  }

  private generateTempPassword(): string {
    return Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
  }
}

export const keycloakFirstImportService = new KeycloakFirstImportService();