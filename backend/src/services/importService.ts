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

  // Validate
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  const seenEmails = new Set<string>();

  const validation = await Promise.all(rows.map(async (row, idx) => {
    const errors: string[] = [];
    const email = String(row.email || '').toLowerCase().trim();
    if (!email) errors.push('email is required');
    else if (!emailRegex.test(email)) errors.push('invalid email');
    if (seenEmails.has(email)) errors.push('duplicate email in CSV');
    seenEmails.add(email);

    const role = String(row.role || '').trim();
    const validRoles = ['platform_admin','school_admin','teacher','student','alumni'];
    if (!role) errors.push('role is required');
    else if (!validRoles.includes(role)) errors.push(`invalid role: ${role}`);

    // School checks
    let schoolId = row.schoolId ? parseInt(String(row.schoolId)) : undefined;
    if (!schoolId && uploaderSchoolId && role !== 'platform_admin') {
      schoolId = uploaderSchoolId;
      row.schoolId = String(schoolId);
    }
    if (schoolId) {
      const school = await prisma.school.findUnique({ where: { id: schoolId } });
      if (!school) errors.push(`unknown schoolId ${schoolId}`);
    }

    // Existing email in DB is not fatal; mark will_update
    const existing = email ? await prisma.user.findUnique({ where: { email } }) : null;

    return {
      rowNumber: idx + 1,
      rawData: row,
      validationErrors: errors,
      status: errors.length ? 'invalid' as ImportRowStatus : (existing ? 'will_update' : 'valid') as ImportRowStatus,
    };
  }));

  const job = await prisma.importJob.create({
    data: {
      uploaderId,
      filename,
      status: isDryRun ? 'dry_run' : 'uploaded',
      isDryRun,
      rows: {
        create: validation.map(v => ({
          rowNumber: v.rowNumber,
          rawData: v.rawData,
          validationErrors: v.validationErrors.length ? v.validationErrors as any : undefined,
          status: v.status as any,
        }))
      }
    },
    include: { rows: true }
  });

  const counts = {
    total: job.rows.length,
    valid: job.rows.filter((r: any) => r.status === 'valid' || r.status === 'will_update').length,
    invalid: job.rows.filter((r: any) => r.status === 'invalid').length,
  };

  return { jobId: job.id, counts, rows: job.rows.slice(0, 20) };
}

export async function approveJob(jobId: number, approverId: number) {
  const batchId = randomUUID();
  const job = await prisma.importJob.update({ where: { id: jobId }, data: { status: 'approved', importBatchId: batchId } });
  // Start provisioning
  emit(jobId, 'import:started', { jobId, importBatchId: batchId });
  await prisma.importJob.update({ where: { id: jobId }, data: { status: 'provisioning' } });

  const rows = await prisma.importRow.findMany({ where: { importJobId: jobId } });
  const limit = pLimit(CONCURRENCY);
  let processed = 0; let created = 0; let updated = 0; let failed = 0;

  const results = await Promise.all(rows.map((row: any) => limit(async () => {
    if (!(row.status === 'valid' || row.status === 'will_update')) return null;
    const data = row.rawData as any;
    const email = String(data.email).toLowerCase();
    const role = String(data.role);
    const firstName = String(data.firstName || '');
    const lastName = String(data.lastName || '');
    const schoolId = data.schoolId ? parseInt(String(data.schoolId)) : undefined;

    let action: 'created'|'updated'|'skipped'|'failed' = 'skipped';
    let keycloakUserId: string | undefined;
    let appUserId: number | undefined;
    let message = '';

    // Retry wrapper
    const attempt = async (fn: () => Promise<void>) => {
      const max = 3;
      for (let i=0;i<max;i++) {
        try { await fn(); return; } catch (e) {
          if (i === max-1) throw e; await new Promise(r => setTimeout(r, 500*(i+1)));
        }
      }
    };

    try {
      // Keycloak-first
      const existingKc = await keycloakAdminClient.getUserByEmail(email);
      if (existingKc && existingKc.id) {
        keycloakUserId = existingKc.id;
        // ensure role
        await keycloakAdminClient.assignUserRole(existingKc.id, role);
        // ensure attributes
        await keycloakAdminClient.updateUserAttributes(existingKc.id, {
          status: ['pending_approval'],
          ...(schoolId ? { school_id: [String(schoolId)] } : {}),
        });
        action = 'updated';
      } else {
        // create disabled
        const tmpPassword = Math.random().toString(36).slice(2) + 'A1!';
        const userId = await keycloakAdminClient.createUser({
          username: email,
          email,
          password: tmpPassword,
          firstName,
          lastName,
          school_id: schoolId ? String(schoolId) : '',
          user_type: role,
          status: 'pending_approval'
        });
        keycloakUserId = userId as string;
        // ensure disabled
        await keycloakAdminClient.setUserEnabled(keycloakUserId!, false);
        action = 'created';
      }

      // Upsert App DB by email
      const upserted = await prisma.user.upsert({
        where: { email },
        update: {
          keycloakId: keycloakUserId,
          role: role as any,
          schoolId: schoolId || null,
          isActive: false,
        },
        create: {
          keycloakId: keycloakUserId || undefined,
          email,
          firstName,
          lastName,
          role: role as any,
          schoolId: schoolId || null,
          isActive: false,
        }
      });
      appUserId = upserted.id;

      // Persist per-row result
      await prisma.importRow.update({
        where: { id: row.id },
        data: {
          status: 'provisioned',
          result: { action, keycloakUserId, appUserId }
        } as any
      });

      processed++; if (action === 'created') created++; if (action === 'updated') updated++;
      emit(jobId, 'import:row_result', { rowId: row.id, action });
    } catch (err: any) {
      failed++;
      message = err?.message || 'unknown error';
      await prisma.importRow.update({ where: { id: row.id }, data: { status: 'failed', result: { action: 'failed', message } as any } });
      emit(jobId, 'import:row_result', { rowId: row.id, action: 'failed', message });
    }
  })));

  const summary = { processed, created, updated, failed };
  await prisma.importJob.update({ where: { id: jobId }, data: { status: 'provisioned', summary } });
  emit(jobId, 'import:done', { jobId, summary });
  return summary;
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
