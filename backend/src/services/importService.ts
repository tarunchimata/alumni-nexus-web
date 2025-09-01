import csv from 'csv-parser';
import { Readable } from 'stream';
import pLimit from 'p-limit';
import { randomUUID } from 'crypto';
import { prisma } from '../index';
import { logger } from '../utils/logger';
import { keycloakAdminClient } from './keycloakAdmin';
import { socketServer } from '../socket/socketServer';

export type ImportJobStatus = 'uploaded'|'approved'|'provisioning'|'provisioned'|'activated'|'rolled_back'|'failed'|'dry_run'|'dry_run_complete';
export type ImportRowStatus = 'pending'|'valid'|'invalid'|'provisioned'|'activated'|'failed'|'skipped'|'will_update';

const CONCURRENCY = parseInt(process.env.IMPORT_CONCURRENCY || '5');

function emit(jobId: number, event: string, payload: any) {
  try {
    socketServer?.emitToRoom?.(`import-job-${jobId}`, event, payload);
  } catch {}
}

export interface CSVUserRow {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  schoolId?: string;
  grade?: string;
  class?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  admissionYear?: string;
  subject?: string;
  department?: string;
  joinYear?: string;
  graduationYear?: string;
}

export async function createUserImportJob(fileBuffer: Buffer, filename: string, uploaderId: number, uploaderSchoolId?: number, isDryRun: boolean = false) {
  logger.info(`Creating Keycloak-first import job: ${filename} by uploader ${uploaderId}`);
  
  // Parse CSV
  const rows: any[] = [];
  const readable = Readable.from(fileBuffer);
  await new Promise((resolve, reject) => {
    readable
      .pipe(csv())
      .on('data', (data) => rows.push(data))
      .on('end', resolve)
      .on('error', reject);
  });

  logger.info(`Parsed ${rows.length} rows from CSV`);

  // Import strict validation service
  const { keycloakFirstImportService } = await import('./keycloakFirstImportService');
  
  // Convert parsed CSV to strict format
  const strictRows = rows.map(row => ({
    email: String(row.email || row.Email || '').toLowerCase().trim(),
    first_name: String(row.first_name || row.firstName || row.FirstName || '').trim(),
    last_name: String(row.last_name || row.lastName || row.LastName || '').trim(),
    role: String(row.role || row.Role || '').toLowerCase().trim(),
    school_udise_code: String(row.school_udise_code || row.schoolId || row.school_id || row.SchoolId || '').trim(),
    phone_number: row.phone_number || row.phoneNumber || row.phone || undefined,
    date_of_birth: row.date_of_birth || row.dateOfBirth || row.dob || undefined,
    admission_year: row.admission_year || row.admissionYear || undefined,
    graduation_year: row.graduation_year || row.graduationYear || undefined
  }));

  // Validate with strict validation
  const processedRows = await keycloakFirstImportService.validateStrictCSV(strictRows);
  
  // Create import job with processed results
  const job = await prisma.importJob.create({
    data: {
      uploaderId,
      filename,
      status: isDryRun ? 'dry_run' : 'uploaded',
      isDryRun,
      rows: {
        create: processedRows.map(row => ({
          rowNumber: row.rowIndex,
          rawData: {
            email: row.email,
            firstName: row.first_name,
            lastName: row.last_name,
            role: row.role,
            schoolId: row.school_udise_code,
            phoneNumber: row.phone_number,
            dateOfBirth: row.date_of_birth,
            admissionYear: row.admission_year,
            graduationYear: row.graduation_year
          },
          validationErrors: row.errors.length > 0 ? row.errors.map(e => e.message) : undefined,
          status: row.isValid ? (row.exists_in_db ? 'will_update' : 'valid') : 'invalid',
        }))
      }
    },
    include: { rows: true }
  });

  const counts = {
    total: job.rows.length,
    valid: job.rows.filter(r => r.status === 'valid' || r.status === 'will_update').length,
    invalid: job.rows.filter(r => r.status === 'invalid').length,
  };

  logger.info(`Created job ${job.id} with ${counts.total} rows (${counts.valid} valid, ${counts.invalid} invalid)`);

  return { jobId: job.id, counts, rows: job.rows.slice(0, 20) };
}

export async function approveJob(jobId: number, approverId: number): Promise<{ processed: number; created: number; updated: number; failed: number; }> {
  const startTime = Date.now();
  logger.info(`Starting Keycloak-first job approval: ${jobId} by approver ${approverId}`);

  try {
    // Update job status to 'provisioning'
    const job = await prisma.importJob.update({
      where: { id: jobId },
      data: { 
        status: 'provisioning',
        approved_by: approverId,
        approved_at: new Date()
      },
      include: { rows: true }
    });

    const validRows = job.rows.filter(row => row.status === 'valid' || row.status === 'will_update');
    logger.info(`Processing ${validRows.length} valid rows for job ${jobId} with Keycloak-first approach`);

    // Import the Keycloak-first service
    const { keycloakFirstImportService } = await import('./keycloakFirstImportService');
    
    // Convert rows to StrictCSVUserRow format
    const csvRows = validRows.map(row => {
      const data = row.rawData as any;
      return {
        email: String(data.email || '').toLowerCase().trim(),
        first_name: String(data.firstName || ''),
        last_name: String(data.lastName || ''),
        role: String(data.role || ''),
        school_udise_code: String(data.schoolId || ''),
        phone_number: data.phoneNumber ? String(data.phoneNumber) : undefined,
        date_of_birth: data.dateOfBirth ? String(data.dateOfBirth) : undefined,
        admission_year: data.admissionYear ? String(data.admissionYear) : undefined,
        graduation_year: data.graduationYear ? String(data.graduationYear) : undefined
      };
    });

    // Re-validate with strict validation
    const processedRows = await keycloakFirstImportService.validateStrictCSV(csvRows);
    const validProcessedRows = processedRows.filter(row => row.isValid);

    logger.info(`${validProcessedRows.length} rows passed strict validation out of ${processedRows.length}`);

    // Execute Keycloak batch operations (atomic)
    const keycloakResult = await keycloakFirstImportService.executeKeycloakBatch(validProcessedRows);
    
    if (!keycloakResult.success) {
      // Mark job as failed and update row statuses
      await prisma.importJob.update({
        where: { id: jobId },
        data: { 
          status: 'failed',
          summary: {
            processed: 0,
            created: 0,
            updated: 0,
            failed: keycloakResult.totalRows,
            error: 'Keycloak batch operation failed',
            details: keycloakResult.errors
          }
        }
      });

      // Update failed rows
      for (let i = 0; i < processedRows.length; i++) {
        const row = processedRows[i];
        const originalRow = validRows[i];
        
        await prisma.importRow.update({
          where: { id: originalRow.id },
          data: {
            status: row.isValid && !keycloakResult.failedRows.find(f => f.rowIndex === row.rowIndex) ? 'failed' : 'invalid',
            result: {
              action: 'failed',
              errors: row.errors,
              message: 'Keycloak batch operation failed'
            }
          }
        });
      }

      throw new Error(`Keycloak operations failed: ${keycloakResult.errors.join(', ')}`);
    }

    // Sync successful rows to database  
    const successfulRows = validProcessedRows.filter(row => 
      row.keycloakId && !keycloakResult.failedRows.find(f => f.rowIndex === row.rowIndex)
    );

    const dbResult = await keycloakFirstImportService.syncToDatabase(successfulRows);
    
    if (dbResult.failed > 0) {
      logger.warn(`Database sync had ${dbResult.failed} failures, but Keycloak operations were successful`);
    }

    // Update row statuses based on results
    for (let i = 0; i < processedRows.length; i++) {
      const row = processedRows[i];
      const originalRow = validRows[i];
      const wasSuccessful = successfulRows.find(s => s.rowIndex === row.rowIndex);
      
      await prisma.importRow.update({
        where: { id: originalRow.id },
        data: {
          status: wasSuccessful ? 'provisioned' : 'failed',
          result: {
            action: wasSuccessful ? (row.operation === 'create' ? 'created' : 'updated') : 'failed',
            keycloakUserId: row.keycloakId || null,
            errors: row.errors.length > 0 ? row.errors : undefined,
            message: wasSuccessful ? 'Successfully provisioned in Keycloak and synced to database' : 'Processing failed'
          }
        }
      });
    }

    // Update job status and summary
    const summary = {
      processed: keycloakResult.processed,
      created: keycloakResult.created,
      updated: keycloakResult.updated,
      failed: keycloakResult.failed + dbResult.failed,
      db_synced: dbResult.synced,
      db_sync_failed: dbResult.failed
    };

    await prisma.importJob.update({
      where: { id: jobId },
      data: { 
        status: 'provisioned',
        summary
      }
    });

    const duration = Date.now() - startTime;
    logger.info(`Job ${jobId} completed in ${duration}ms. Summary:`, summary);

    // Emit completion event
    emit(jobId, 'import:done', { jobId, summary });

    return summary;

  } catch (error) {
    logger.error(`Job ${jobId} failed:`, error);
    
    await prisma.importJob.update({
      where: { id: jobId },
      data: { 
        status: 'failed',
        summary: {
          processed: 0,
          created: 0,
          updated: 0,
          failed: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    });

    throw error;
  }
}

export async function activateJob(jobId: number) {
  const job = await prisma.importJob.findUnique({ where: { id: jobId }, include: { rows: true } });
  if (!job) throw new Error('Job not found');
  let activated = 0; let failed = 0;
  for (const row of job.rows) {
    if (row.status !== 'provisioned') continue;
    const result: any = row.result || {};
    if (!result.keycloakUserId || !result.appUserId) continue;
    try {
      await keycloakAdminClient.setUserEnabled(result.keycloakUserId, true);
      await prisma.user.update({ where: { id: result.appUserId }, data: { isActive: true } });
      await prisma.importRow.update({ where: { id: row.id }, data: { status: 'activated' } });
      activated++;
    } catch (e) {
      failed++;
      await prisma.importRow.update({ where: { id: row.id }, data: { status: 'failed' } });
    }
  }
  await prisma.importJob.update({ where: { id: jobId }, data: { status: 'activated', summary: { ...(job.summary as any), activated, activationFailed: failed } } });
  return { activated, failed };
}

export async function rollbackJob(jobId: number) {
  const job = await prisma.importJob.findUnique({ where: { id: jobId }, include: { rows: true } });
  if (!job) throw new Error('Job not found');
  let kcDeleted = 0; let dbDeleted = 0; let kcDisabled = 0; let errors = 0;

  for (const row of job.rows) {
    const result: any = row.result || {};
    try {
      if (result.keycloakUserId && row.status !== 'will_update') {
        try {
          await keycloakAdminClient.deleteUser(result.keycloakUserId);
          kcDeleted++;
        } catch (e) {
          await keycloakAdminClient.setUserEnabled(result.keycloakUserId, false);
          kcDisabled++;
        }
      }
      if (result.appUserId) {
        await prisma.user.delete({ where: { id: result.appUserId } });
        dbDeleted++;
      }
      await prisma.importRow.update({ where: { id: row.id }, data: { status: 'failed' } });
    } catch (e) {
      errors++;
    }
  }
  await prisma.importJob.update({ where: { id: jobId }, data: { status: 'rolled_back', summary: { ...(job.summary as any), kcDeleted, kcDisabled, dbDeleted, rollbackErrors: errors } } });
  return { kcDeleted, kcDisabled, dbDeleted, errors };
}
