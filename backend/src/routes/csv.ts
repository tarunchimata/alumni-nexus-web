import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { keycloakMiddleware, requireRole, AuthenticatedRequest } from '../middleware/keycloak';
import { prisma } from '../index';
import { logger } from '../utils/logger';
import { createUserImportJob, approveJob, activateJob, rollbackJob } from '../services/importService';


const router: express.Router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// Apply authentication to all CSV routes
router.use(keycloakMiddleware);

interface CSVUser {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  schoolId?: string;
  graduationYear?: string;
}

interface CSVSchool {
  name: string;
  address: string;
  establishedYear?: string;
  type?: string;
}

// POST /api/csv/upload/users - Upload and validate user CSV (staging only)
router.post('/upload/users', requireRole(['platform_admin', 'school_admin']), upload.single('file'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    logger.info('CSV user upload started', {
      filename: req.file.originalname,
      size: req.file.size,
      uploadedBy: req.user?.email,
      contentLength: req.headers['content-length']
    });

    // Resolve uploader DB user to get schoolId if available
    const uploaderKcId = req.user?.id;
    const uploaderDb = uploaderKcId ? await prisma.user.findFirst({ where: { keycloakId: uploaderKcId } }) : null;

    const job = await createUserImportJob(req.file.buffer, req.file.originalname, uploaderDb?.id || 0, uploaderDb?.schoolId || undefined);

    res.json({
      message: 'CSV uploaded, validated, and staged successfully',
      jobId: job.jobId,
      counts: job.counts,
      preview: job.rows
    });
  } catch (error) {
    logger.error('CSV user upload failed:', error);
    res.status(500).json({ error: 'Failed to process CSV file' });
  }
});

// POST /api/csv/upload/schools - Upload and validate school CSV
router.post('/upload/schools', requireRole(['platform_admin']), upload.single('file'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    logger.info('CSV school upload started', {
      filename: req.file.originalname,
      size: req.file.size,
      uploadedBy: req.user?.email,
      contentLength: req.headers['content-length']
    });

    const results: CSVSchool[] = [];

    // Parse CSV
    const readable = Readable.from(req.file.buffer);
    
    await new Promise((resolve, reject) => {
      readable
        .pipe(csv())
        .on('data', (data) => {
          results.push(data);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    logger.info(`Parsed ${results.length} school rows from CSV`, { preview: results.slice(0, 1) });

    // Validate CSV data
    const validationErrors = await validateSchools(results);
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        validationErrors,
        rowCount: results.length
      });
    }

    res.json({
      message: 'School CSV uploaded and validated successfully',
      rowCount: results.length,
      data: results.slice(0, 5), // Preview first 5 rows
      previewOnly: true
    });
  } catch (error) {
    logger.error('CSV school upload failed:', error);
    res.status(500).json({ error: 'Failed to process CSV file' });
  }
});

// Jobs list
router.get('/jobs', requireRole(['platform_admin', 'school_admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const { status, uploaderId, page = '1', pageSize = '20' } = req.query as any;
    const take = Math.min(parseInt(pageSize) || 20, 100);
    const skip = ((parseInt(page) || 1) - 1) * take;

    const where: any = {};
    if (status) where.status = status as any;
    if (uploaderId) where.uploaderId = parseInt(uploaderId as string);

    const [items, total] = await Promise.all([
      prisma.importJob.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.importJob.count({ where })
    ]);

    res.json({ items, total, page: parseInt(page), pageSize: take });
  } catch (error) {
    logger.error('List jobs failed:', error);
    res.status(500).json({ error: 'Failed to list jobs' });
  }
});

// Job details
router.get('/jobs/:id', requireRole(['platform_admin', 'school_admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const job = await prisma.importJob.findUnique({ where: { id }, include: { rows: true } });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (error) {
    logger.error('Get job failed:', error);
    res.status(500).json({ error: 'Failed to get job' });
  }
});

// Approve + start provisioning
router.post('/jobs/:id/approve', requireRole(['platform_admin', 'school_admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const summary = await approveJob(id, 0);
    res.json({ message: 'Provisioning started', summary });
  } catch (error) {
    logger.error('Approve job failed:', error);
    res.status(500).json({ error: 'Failed to approve job' });
  }
});

// Activate provisioned users
router.post('/jobs/:id/activate', requireRole(['platform_admin', 'school_admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await activateJob(id);
    res.json({ message: 'Activation completed', ...result });
  } catch (error) {
    logger.error('Activate job failed:', error);
    res.status(500).json({ error: 'Failed to activate job' });
  }
});

// Rollback job
router.post('/jobs/:id/rollback', requireRole(['platform_admin', 'school_admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await rollbackJob(id);
    res.json({ message: 'Rollback completed', ...result });
  } catch (error) {
    logger.error('Rollback job failed:', error);
    res.status(500).json({ error: 'Failed to rollback job' });
  }
});

// Export failed/invalid rows as CSV
router.get('/jobs/:id/export-failed', requireRole(['platform_admin', 'school_admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const job = await prisma.importJob.findUnique({ where: { id } });
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const rows = await prisma.importRow.findMany({
      where: {
        importJobId: id,
        OR: [
          { status: 'invalid' as any },
          { status: 'failed' as any },
        ],
      },
      orderBy: { rowNumber: 'asc' },
    });

    // Prepare CSV
    const allKeys = new Set<string>();
    rows.forEach(r => Object.keys((r.rawData as any) || {}).forEach(k => allKeys.add(k)));
    const headers = ['row_number', 'status', 'errors', ...Array.from(allKeys)];
    const lines: string[] = [];
    lines.push(headers.join(','));
    for (const r of rows) {
      const data = r.rawData as any;
      const errors = Array.isArray(r.validationErrors) ? (r.validationErrors as any[]).join('; ') : '';
      const rowValues = [
        String(r.rowNumber ?? ''),
        String(r.status ?? ''),
        JSON.stringify(errors).replaceAll(',', ';'),
        ...Array.from(allKeys).map(k => {
          const v = data?.[k];
          const s = v === undefined || v === null ? '' : String(v);
          // escape quotes and commas
          const escaped = '"' + s.replace(/"/g, '""') + '"';
          return escaped;
        })
      ];
      lines.push(rowValues.join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="job-${id}-failed.csv"`);
    return res.status(200).send(lines.join('\n'));
  } catch (error) {
    logger.error('Export failed rows failed:', error);
    return res.status(500).json({ error: 'Failed to export failed rows' });
  }
});

// Minimal logs endpoint synthesized from rows timeline
router.get('/jobs/:id/logs', requireRole(['platform_admin', 'school_admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const job = await prisma.importJob.findUnique({ where: { id } });
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const rows = await prisma.importRow.findMany({
      where: { importJobId: id },
      orderBy: { updatedAt: 'asc' },
      select: { id: true, rowNumber: true, status: true, validationErrors: true, result: true, createdAt: true, updatedAt: true }
    });

    const events = rows.map(r => ({
      timestamp: r.updatedAt || r.createdAt,
      level: r.status === 'failed' ? 'error' : (r.status === 'invalid' ? 'warning' : 'info'),
      message: `Row ${r.rowNumber} status: ${r.status}`,
      rowId: r.id,
      rowNumber: r.rowNumber,
      details: { validationErrors: r.validationErrors, result: r.result }
    }));

    return res.json({ job: { id: job.id, status: job.status, filename: job.filename, createdAt: job.createdAt, updatedAt: job.updatedAt }, events });
  } catch (error) {
    logger.error('Get job logs failed:', error);
    return res.status(500).json({ error: 'Failed to fetch job logs' });
  }
});

// Edit and revalidate a single row
router.patch('/jobs/:id/rows/:rowId', requireRole(['platform_admin', 'school_admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const rowId = parseInt(req.params.rowId);
    const row = await prisma.importRow.findUnique({ where: { id: rowId } });
    if (!row || row.importJobId !== id) return res.status(404).json({ error: 'Row not found' });

    const updatedRaw = { ...(row.rawData as any), ...(req.body || {}) };

    // Re-validate minimal rules
    const errors: string[] = [];
    const email = String(updatedRaw.email || '').toLowerCase().trim();
    const role = String(updatedRaw.role || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) errors.push('email is required');
    else if (!emailRegex.test(email)) errors.push('invalid email');
    const validRoles = ['platform_admin','school_admin','teacher','student','alumni'];
    if (!role || !validRoles.includes(role)) errors.push('invalid role');

    const existing = email ? await prisma.user.findUnique({ where: { email } }) : null;
    const status = errors.length ? 'invalid' : (existing ? 'will_update' : 'valid');

    const updated = await prisma.importRow.update({ where: { id: rowId }, data: { rawData: updatedRaw as any, validationErrors: errors.length ? errors as any : null, status: status as any } });
    res.json(updated);
  } catch (error) {
    logger.error('Update row failed:', error);
    res.status(500).json({ error: 'Failed to update row' });
  }
});

// POST /api/csv/import/schools - Import validated schools
router.post('/import/schools', requireRole(['platform_admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const { data } = req.body;
    
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Invalid import data' });
    }

    logger.info(`Starting bulk school import: ${data.length} schools`, {
      importedBy: req.user?.email
    });

    // Re-validate before import
    const validationErrors = await validateSchools(data);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed before import',
        validationErrors
      });
    }

    // Bulk import schools
    const imported = [];
    const failed = [];

    for (const schoolData of data) {
      try {
        const school = await prisma.school.create({
          data: {
            institutionId: `SCH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            schoolName: schoolData.name,
            stateName: 'Unknown', // Required field
            yearOfEstablishment: schoolData.establishedYear || null,
            address: schoolData.address,
            name: schoolData.name, // Legacy field
            isActive: true
          }
        });
        imported.push(school);
      } catch (error) {
        logger.error('Failed to import school:', error);
        failed.push({ name: schoolData.name, error: 'Database insertion failed' });
      }
    }

    logger.info(`School import completed: ${imported.length} imported, ${failed.length} failed`);

    res.json({
      message: 'School import completed',
      imported: imported.length,
      failed: failed.length,
      failedItems: failed
    });
  } catch (error) {
    logger.error('School import failed:', error);
    res.status(500).json({ error: 'Failed to import schools' });
  }
});

// Validation functions
async function validateUsers(users: CSVUser[], userSchoolId?: string): Promise<string[]> {
  const errors: string[] = [];
  const emails = new Set();

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const rowNum = i + 1;

    // Required fields
    if (!user.firstName) errors.push(`Row ${rowNum}: firstName is required`);
    if (!user.lastName) errors.push(`Row ${rowNum}: lastName is required`);
    if (!user.email) errors.push(`Row ${rowNum}: email is required`);
    if (!user.role) errors.push(`Row ${rowNum}: role is required`);

    // Email validation
    if (user.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(user.email)) {
        errors.push(`Row ${rowNum}: invalid email format`);
      }
      
      // Check for duplicates in CSV
      if (emails.has(user.email)) {
        errors.push(`Row ${rowNum}: duplicate email in CSV`);
      }
      emails.add(user.email);

      // Check if email already exists in database
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email.toLowerCase() }
      });
      if (existingUser) {
        errors.push(`Row ${rowNum}: email already exists in database`);
      }
    }

    // Role validation
    const validRoles = ['platform_admin', 'school_admin', 'teacher', 'student', 'alumni'];
    if (user.role && !validRoles.includes(user.role)) {
      errors.push(`Row ${rowNum}: invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    // School ID validation
    if (user.schoolId) {
      const school = await prisma.school.findUnique({
        where: { id: parseInt(user.schoolId) }
      });
      if (!school) {
        errors.push(`Row ${rowNum}: school ID ${user.schoolId} does not exist`);
      }
    } else if (userSchoolId && user.role !== 'platform_admin') {
      // Auto-assign school admin's school to users without schoolId
      user.schoolId = userSchoolId;
    }
  }

  return errors;
}

async function validateSchools(schools: CSVSchool[]): Promise<string[]> {
  const errors: string[] = [];
  const names = new Set();

  for (let i = 0; i < schools.length; i++) {
    const school = schools[i];
    const rowNum = i + 1;

    // Required fields
    if (!school.name) errors.push(`Row ${rowNum}: name is required`);
    if (!school.address) errors.push(`Row ${rowNum}: address is required`);

    // Check for duplicates in CSV
    if (school.name) {
      if (names.has(school.name)) {
        errors.push(`Row ${rowNum}: duplicate school name in CSV`);
      }
      names.add(school.name);

      // Check if school already exists in database
      const existingSchool = await prisma.school.findFirst({
        where: { name: school.name }
      });
      if (existingSchool) {
        errors.push(`Row ${rowNum}: school name already exists in database`);
      }
    }

    // Year validation
    if (school.establishedYear) {
      const year = parseInt(school.establishedYear);
      if (isNaN(year) || year < 1800 || year > new Date().getFullYear()) {
        errors.push(`Row ${rowNum}: invalid established year`);
      }
    }
  }

  return errors;
}

export default router;