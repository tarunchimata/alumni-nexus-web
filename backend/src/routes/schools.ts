
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthenticatedRequest, authenticateToken, requireRole, requirePermission } from '../middleware/auth';
import { prisma } from '../index';
import { logger } from '../utils/logger';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Apply authentication to all routes
router.use(authenticateToken);

// Get all schools - accessible by all authenticated users
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { page = 1, limit = 10, search, schoolType, managementType } = req.query;
    
    const where: any = { isActive: true };
    
    // School admins and teachers can only see their own school
    if (req.user && !req.user.roles.includes('platform_admin')) {
      if (req.user.schoolId) {
        where.id = req.user.schoolId;
      } else {
        // User has no school access
        return res.json({
          schools: [],
          pagination: { page: 1, limit: 10, total: 0, pages: 0 },
        });
      }
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { udiseCode: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    
    if (schoolType) where.schoolType = schoolType;
    if (managementType) where.managementType = managementType;

    const schools = await prisma.school.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true, classes: true },
        },
      },
    });

    const total = await prisma.school.count({ where });

    res.json({
      schools,
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
    body('name').trim().isLength({ min: 2 }).withMessage('School name is required'),
    body('udiseCode').trim().isLength({ min: 1 }).withMessage('UDISE code is required'),
    body('schoolType').isIn(['Primary', 'Secondary', 'Higher_Secondary']).withMessage('Invalid school type'),
    body('managementType').isIn(['Government', 'Private']).withMessage('Invalid management type'),
    body('address').trim().isLength({ min: 5 }).withMessage('Address is required'),
  ],
  async (req: AuthenticatedRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, udiseCode, schoolType, managementType, address, contactNumber } = req.body;

      const school = await prisma.school.create({
        data: {
          name,
          udiseCode,
          schoolType,
          managementType,
          address,
          contactNumber,
        },
      });

      logger.info(`School created by ${req.user!.email}: ${school.name}`);
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
                    name: row.name,
                    udiseCode: row.udise_code,
                    schoolType: row.school_type,
                    managementType: row.management_type,
                    address: row.address,
                    contactNumber: row.contact_number,
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
