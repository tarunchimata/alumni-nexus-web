
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthenticatedRequest, requireRole } from '../middleware/keycloak';
import { prisma } from '../index';
import { logger } from '../utils/logger';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Get all schools
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { page = 1, limit = 10, search, schoolType, managementType } = req.query;
    
    const where: any = { isActive: true };
    
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

// Create school
router.post('/',
  requireRole(['platform_admin']),
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

      res.status(201).json(school);
    } catch (error) {
      logger.error('School creation error:', error);
      res.status(500).json({ error: 'Failed to create school' });
    }
  }
);

// Bulk import schools from CSV
router.post('/bulk',
  requireRole(['platform_admin']),
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
