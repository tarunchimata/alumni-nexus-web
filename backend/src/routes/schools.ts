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
                    status: 'active',
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