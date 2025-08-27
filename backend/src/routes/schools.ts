import express, { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthenticatedRequest, authenticateToken, requireRole } from '../middleware/auth';
import { prisma } from '../index';
import { logger } from '../utils/logger';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';

const router: express.Router = Router();
const upload = multer({ dest: 'uploads/' });

// Apply authentication to all routes
router.use(authenticateToken);

// Get all schools - accessible by all authenticated users
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { page = 1, limit = 1000, search, schoolType, managementType } = req.query;
    
    const where: any = { status: 'active' };
    
    // School admins and teachers can only see their own school
    if (req.user && !req.user.roles.includes('platform_admin')) {
      if (req.user.schoolId) {
        where.id = req.user.schoolId;
      } else {
        // User has no school access
        return res.json({
          schools: [],
          pagination: { page: 1, limit: Number(limit), total: 0, pages: 0 },
        });
      }
    }
    
    if (search) {
      where.OR = [
        { schoolName: { contains: search as string, mode: 'insensitive' } },
        { udiseSchoolCode: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    
    if (schoolType) where.schoolType = schoolType;
    if (managementType) where.managementType = managementType;

    const schools = await prisma.school.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { schoolName: 'asc' },
      select: {
        id: true,
        institutionId: true,
        schoolName: true,
        udiseSchoolCode: true,
        schoolCategory: true,
        schoolType: true,
        management: true,
        stateName: true,
        districtName: true,
        locationType: true,
        status: true,
        createdAt: true,
        // Legacy compatibility fields
        name: true,
        udiseCode: true,
        _count: {
          select: { users: true, classes: true },
        },
      },
    });

    const total = await prisma.school.count({ where });

    logger.info(`Schools fetched: ${schools.length} of ${total} total`);

    res.json({
      schools: schools.map(school => ({
        id: school.id,
        name: school.schoolName || school.name,
        udiseCode: school.udiseSchoolCode || school.udiseCode,
        districtName: school.districtName,
        stateName: school.stateName,
        schoolType: school.schoolType,
        management: school.management,
        status: school.status,
        userCount: school._count.users,
        classCount: school._count.classes,
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Schools fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
});

// Create school - only platform admins
router.post('/',
  requireRole('platform_admin'),
  [
    body('schoolName').trim().isLength({ min: 2 }).withMessage('School name is required'),
    body('stateName').trim().isLength({ min: 2 }).withMessage('State name is required'),
    body('institutionId').trim().isLength({ min: 1 }).withMessage('Institution ID is required'),
  ],
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { schoolName, stateName, institutionId, udiseSchoolCode, districtName, address, contactNumber } = req.body;

      const school = await prisma.school.create({
        data: {
          institutionId,
          schoolName,
          stateName,
          udiseSchoolCode,
          districtName,
          address,
          contactNumber,
          status: 'active',
          // Legacy fields
          name: schoolName,
          udiseCode: udiseSchoolCode,
          schoolTypeLegacy: 'Primary',
          managementType: 'Government',
        },
      });

      logger.info(`School created by ${req.user!.email}: ${school.schoolName}`);
      res.status(201).json(school);
    } catch (error) {
      logger.error('School creation error:', error);
      res.status(500).json({ error: 'Failed to create school' });
    }
  }
);

// Get single school - accessible by all authenticated users
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    const where: any = { id };
    
    // School admins and teachers can only see their own school
    if (req.user && !req.user.roles.includes('platform_admin')) {
      if (req.user.schoolId !== id) {
        return res.status(403).json({ error: 'Access denied to this school' });
      }
    }

    const school = await prisma.school.findUnique({
      where,
      select: {
        id: true,
        institutionId: true,
        schoolName: true,
        udiseSchoolCode: true,
        schoolCategory: true,
        schoolType: true,
        management: true,
        stateName: true,
        districtName: true,
        locationType: true,
        status: true,
        address: true,
        contactNumber: true,
        createdAt: true,
        updatedAt: true,
        // Legacy compatibility fields
        name: true,
        udiseCode: true,
        _count: {
          select: { users: true, classes: true },
        },
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            status: true,
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    logger.info(`School profile fetched: ${school.schoolName} by ${req.user!.email}`);
    res.json({
      ...school,
      name: school.schoolName || school.name,
      udiseCode: school.udiseSchoolCode || school.udiseCode,
    });
  } catch (error) {
    logger.error('School fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch school' });
  }
});

// Update school - only platform admins
router.put('/:id',
  requireRole('platform_admin'),
  [
    body('schoolName').optional().trim().isLength({ min: 2 }).withMessage('School name must be at least 2 characters'),
    body('stateName').optional().trim().isLength({ min: 2 }).withMessage('State name must be at least 2 characters'),
  ],
  async (req: AuthenticatedRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { schoolName, stateName, districtName, address, contactNumber, status } = req.body;

      const updateData: any = {};
      if (schoolName) {
        updateData.schoolName = schoolName;
        updateData.name = schoolName; // Legacy compatibility
      }
      if (stateName) updateData.stateName = stateName;
      if (districtName) updateData.districtName = districtName;
      if (address) updateData.address = address;
      if (contactNumber) updateData.contactNumber = contactNumber;
      if (status) updateData.status = status;

      const school = await prisma.school.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          institutionId: true,
          schoolName: true,
          udiseSchoolCode: true,
          stateName: true,
          districtName: true,
          status: true,
          updatedAt: true,
        },
      });

      logger.info(`School updated by ${req.user!.email}: ${school.schoolName}`);
      res.json(school);
    } catch (error) {
      logger.error('School update error:', error);
      res.status(500).json({ error: 'Failed to update school' });
    }
  }
);

// Approve school - only platform admins
router.post('/:id/approve',
  requireRole('platform_admin'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;

      const school = await prisma.school.update({
        where: { id },
        data: { status: 'approved' },
        select: {
          id: true,
          schoolName: true,
          status: true,
          updatedAt: true,
        },
      });

      logger.info(`School approved by ${req.user!.email}: ${school.schoolName}`);
      res.json({ success: true, school });
    } catch (error) {
      logger.error('School approval error:', error);
      res.status(500).json({ error: 'Failed to approve school' });
    }
  }
);

// Validate school - only platform admins
router.post('/:id/validate',
  requireRole('platform_admin'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;

      const school = await prisma.school.findUnique({
        where: { id },
        select: {
          id: true,
          schoolName: true,
          udiseSchoolCode: true,
          stateName: true,
          districtName: true,
          address: true,
        },
      });

      if (!school) {
        return res.status(404).json({ error: 'School not found' });
      }

      // Check for duplicates based on name + location
      const duplicates = await prisma.school.findMany({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                {
                  AND: [
                    { schoolName: { equals: school.schoolName, mode: 'insensitive' } },
                    { districtName: { equals: school.districtName, mode: 'insensitive' } },
                    { stateName: { equals: school.stateName, mode: 'insensitive' } },
                  ],
                },
                { udiseSchoolCode: school.udiseSchoolCode },
              ],
            },
          ],
        },
        select: {
          id: true,
          schoolName: true,
          udiseSchoolCode: true,
          districtName: true,
          stateName: true,
          status: true,
        },
      });

      const validationResult = {
        schoolId: id,
        isValid: duplicates.length === 0,
        duplicates: duplicates,
        issues: [] as string[],
      };

      // Check for data quality issues
      if (!school.schoolName || school.schoolName.length < 2) {
        validationResult.issues.push('School name is too short');
      }
      if (!school.udiseSchoolCode) {
        validationResult.issues.push('Missing UDISE code');
      }
      if (!school.stateName) {
        validationResult.issues.push('Missing state information');
      }
      if (!school.districtName) {
        validationResult.issues.push('Missing district information');
      }

      logger.info(`School validation completed by ${req.user!.email}: ${school.schoolName} - ${validationResult.isValid ? 'Valid' : 'Issues found'}`);
      res.json(validationResult);
    } catch (error) {
      logger.error('School validation error:', error);
      res.status(500).json({ error: 'Failed to validate school' });
    }
  }
);

// Bulk import schools from CSV - only platform admins
router.post('/bulk',
  requireRole('platform_admin'),
  upload.single('file'),
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'CSV file is required' });
      }

      const results: any[] = [];
      const errors: any[] = [];

      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          try {
            const createdSchools = [];
            
            for (const row of results) {
              try {
                const school = await prisma.school.create({
                  data: {
                    institutionId: row.institution_id || `INC-IN-XX-${Date.now()}`,
                    schoolName: row.school_name || row.name,
                    stateName: row.state_name || row.state,
                    udiseSchoolCode: row.udise_code,
                    districtName: row.district_name || row.district,
                    address: row.address,
                    contactNumber: row.contact_number,
                    status: 'pending',
                    // Legacy fields
                    name: row.school_name || row.name,
                    udiseCode: row.udise_code,
                    schoolTypeLegacy: row.school_type || 'Primary',
                    managementType: row.management_type || 'Government',
                  },
                });
                createdSchools.push(school);
              } catch (error: any) {
                errors.push({
                  row,
                  error: error.message,
                });
              }
            }

            // Clean up uploaded file
            fs.unlinkSync(req.file!.path);

            logger.info(`Bulk import completed by ${req.user!.email}: ${createdSchools.length} schools created`);
            res.json({
              success: true,
              created: createdSchools.length,
              errors: errors.length,
              schools: createdSchools,
              errorDetails: errors,
            });
          } catch (error) {
            logger.error('Bulk import processing error:', error);
            res.status(500).json({ error: 'Failed to process CSV import' });
          }
        });
    } catch (error) {
      logger.error('Bulk import error:', error);
      res.status(500).json({ error: 'Failed to import schools' });
    }
  }
);

export default router;