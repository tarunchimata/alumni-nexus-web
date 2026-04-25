import { logger } from '../utils/logger';

// Stub implementation for import functionality
// Since the database doesn't have ImportJob/ImportRow models, this provides basic functionality

export interface ImportJobStub {
  id: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  summary?: any;
  jobId?: string;
  counts?: {
    total: number;
    valid: number;
    invalid: number;
  };
  rows?: ImportRowStub[];
}

export interface ImportRowStub {
  id: string;
  jobId: string;
  status: 'valid' | 'invalid' | 'will_update';
  data: any;
  errors?: string[];
}

// In-memory storage for import jobs (in production, this could use User table or a simple log table)
const importJobs = new Map<string, ImportJobStub>();
const importRows = new Map<string, ImportRowStub[]>();

export async function createUserImportJob(data: {
  filename: string;
  uploaderId: string;
  summary: any;
}): Promise<ImportJobStub> {
  const job: ImportJobStub = {
    id: `job_${Date.now()}`,
    jobId: `job_${Date.now()}`,
    filename: data.filename,
    status: 'pending',
    createdAt: new Date(),
    summary: data.summary,
    counts: {
      total: 0,
      valid: 0,
      invalid: 0
    },
    rows: []
  };
  
  importJobs.set(job.id, job);
  importRows.set(job.id, []);
  
  logger.info(`Created import job: ${job.id} for file: ${data.filename}`);
  return job;
}

export async function approveJob(jobId: string, approverId: string): Promise<void> {
  const job = importJobs.get(jobId);
  if (!job) {
    throw new Error(`Import job ${jobId} not found`);
  }
  
  job.status = 'processing';
  logger.info(`Approved import job: ${jobId} by: ${approverId}`);
}

export async function activateJob(jobId: string): Promise<void> {
  const job = importJobs.get(jobId);
  if (!job) {
    throw new Error(`Import job ${jobId} not found`);
  }
  
  job.status = 'completed';
  logger.info(`Activated import job: ${jobId}`);
}

export async function rollbackJob(jobId: string): Promise<void> {
  const job = importJobs.get(jobId);
  if (!job) {
    throw new Error(`Import job ${jobId} not found`);
  }
  
  job.status = 'failed';
  logger.info(`Rolled back import job: ${jobId}`);
}

export async function getImportJob(jobId: string): Promise<ImportJobStub & { rows: ImportRowStub[] } | null> {
  const job = importJobs.get(jobId);
  const rows = importRows.get(jobId) || [];
  
  if (!job) {
    return null;
  }
  
  return { ...job, rows };
}

export async function updateImportRow(rowId: string, data: Partial<ImportRowStub>): Promise<void> {
  // Find the row across all jobs
  for (const [jobId, rows] of importRows.entries()) {
    const rowIndex = rows.findIndex(row => row.id === rowId);
    if (rowIndex !== -1) {
      rows[rowIndex] = { ...rows[rowIndex], ...data };
      return;
    }
  }
  
  throw new Error(`Import row ${rowId} not found`);
}
