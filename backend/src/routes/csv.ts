import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { AuthenticatedRequest, authenticateToken, requireRole } from '../middleware/auth';
import { prisma } from '../index';
import { logger } from '../utils/logger';

const router: express.Router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
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
router.use(authenticateToken);

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

// POST /api/csv/upload/users - Upload and validate user CSV
router.post('/upload/users', requireRole(['platform_admin', 'school_admin']), upload.single('file'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    logger.info('CSV user upload started', {
      filename: req.file.originalname,
      size: req.file.size,
      uploadedBy: req.user?.email
    });

    const results: CSVUser[] = [];
    const errors: string[] = [];

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

    logger.info(`Parsed ${results.length} rows from CSV`);

    // Validate CSV data
    const validationErrors = await validateUsers(results, req.user?.schoolId);
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        validationErrors,
        rowCount: results.length
      });
    }

    res.json({
      message: 'CSV uploaded and validated successfully',
      rowCount: results.length,
      data: results.slice(0, 5), // Preview first 5 rows
      previewOnly: true
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
      uploadedBy: req.user?.email
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

    logger.info(`Parsed ${results.length} school rows from CSV`);

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

// POST /api/csv/import/users - Import validated users
router.post('/import/users', requireRole(['platform_admin', 'school_admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const { data } = req.body;
    
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Invalid import data' });
    }

    logger.info(`Starting bulk user import: ${data.length} users`, {
      importedBy: req.user?.email
    });

    // Re-validate before import
    const validationErrors = await validateUsers(data, req.user?.schoolId);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed before import',
        validationErrors
      });
    }

    // Bulk import users
    const imported = [];
    const failed = [];

    for (const userData of data) {
      try {
        const user = await prisma.user.create({
          data: {
            keycloakId: `csv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate temporary keycloakId for CSV imports
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email.toLowerCase(),
            role: userData.role as any,
            schoolId: userData.schoolId ? parseInt(userData.schoolId) : null,
            isActive: false, // Requires approval
            graduationYear: userData.graduationYear ? parseInt(userData.graduationYear) : null
          }
        });
        imported.push(user);
      } catch (error) {
        logger.error('Failed to import user:', error);
        failed.push({ email: userData.email, error: 'Database insertion failed' });
      }
    }

    logger.info(`User import completed: ${imported.length} imported, ${failed.length} failed`);

    res.json({
      message: 'User import completed',
      imported: imported.length,
      failed: failed.length,
      failedItems: failed
    });
  } catch (error) {
    logger.error('User import failed:', error);
    res.status(500).json({ error: 'Failed to import users' });
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