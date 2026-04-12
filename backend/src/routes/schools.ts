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

// Get all unique states with school counts
router.get('/api/states', async (req: AuthenticatedRequest, res) => {
  try {
    const states = await prisma.school.groupBy({
      by: ['stateName'],
      where: {
        stateName: { not: null },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    res.json({
      states: states.map(s => ({
        name: s.stateName,
        school_count: s._count.id,
      })),
    });
  } catch (error) {
    logger.error('States fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch states' });
  }
});

// Get districts for a specific state with school counts
router.get('/api/states/:state/districts-with-schools', async (req: AuthenticatedRequest, res) => {
  try {
    const { state } = req.params;

    const districts = await prisma.school.groupBy({
      by: ['districtName'],
      where: {
        stateName: state,
        districtName: { not: null },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    res.json({
      districts: districts.map(d => ({
        name: d.districtName,
        school_count: d._count.id,
      })),
    });
  } catch (error) {
    logger.error('Districts fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch districts' });
  }
});

// Get comprehensive statistics
router.get('/api/comprehensive-stats', async (req: AuthenticatedRequest, res) => {
  try {
    const total = await prisma.school.count();
    
    const byStatus = await prisma.school.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const statusCounts = byStatus.reduce((acc, item) => {
      acc[item.status || 'unknown'] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      total,
      byStatus: statusCounts,
      activeSchools: statusCounts.active || 0,
      pendingSchools: statusCounts.pending || 0,
      rejectedSchools: statusCounts.rejected || 0,
    });
  } catch (error) {
    logger.error('Comprehensive stats fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get schools grouped by management type
router.get('/api/schools-by-management', async (req: AuthenticatedRequest, res) => {
  try {
    const byManagement = await prisma.school.groupBy({
      by: ['management'],
      where: {
        management: { not: null },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    // Also check managementType field
    const byManagementType = await prisma.school.groupBy({
      by: ['managementType'],
      where: {
        managementType: { not: null },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    // Merge results
    const managementMap = new Map();
    byManagement.forEach(item => {
      managementMap.set(item.management, (managementMap.get(item.management) || 0) + item._count.id);
    });
    byManagementType.forEach(item => {
      managementMap.set(item.managementType, (managementMap.get(item.managementType) || 0) + item._count.id);
    });

    const data = Array.from(managementMap.entries()).map(([type, count]) => ({
      management_type: type,
      count,
    }));

    res.json({ data });
  } catch (error) {
    logger.error('Management stats fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch management statistics' });
  }
});

// Get schools grouped by school type
router.get('/api/schools-by-type', async (req: AuthenticatedRequest, res) => {
  try {
    const bySchoolType = await prisma.school.groupBy({
      by: ['schoolType'],
      where: {
        schoolType: { not: null },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    // Also check schoolTypeLegacy field
    const bySchoolTypeLegacy = await prisma.school.groupBy({
      by: ['schoolTypeLegacy'],
      where: {
        schoolTypeLegacy: { not: null },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    // Merge results
    const typeMap = new Map();
    bySchoolType.forEach(item => {
      typeMap.set(item.schoolType, (typeMap.get(item.schoolType) || 0) + item._count.id);
    });
    bySchoolTypeLegacy.forEach(item => {
      typeMap.set(item.schoolTypeLegacy, (typeMap.get(item.schoolTypeLegacy) || 0) + item._count.id);
    });

    const data = Array.from(typeMap.entries()).map(([type, count]) => ({
      school_type: type,
      count,
    }));

    res.json({ data });
  } catch (error) {
    logger.error('School type stats fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch school type statistics' });
  }
});

// Get hierarchical school data (all schools with state/district hierarchy)
router.get('/api/hierarchical', async (req: AuthenticatedRequest, res) => {
  try {
    const schools = await prisma.school.findMany({
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
        updatedAt: true,
        name: true,
        udiseCode: true,
        _count: {
          select: { users: true, classes: true },
        },
      },
    });

    const uniqueStates = new Set<string>();
    const uniqueDistricts = new Set<string>();
    
    schools.forEach(school => {
      if (school.stateName) uniqueStates.add(school.stateName);
      if (school.districtName) uniqueDistricts.add(school.districtName);
    });

    res.json({
      schools: schools.map(school => ({
        id: school.id,
        name: school.schoolName || school.name,
        schoolName: school.schoolName || school.name,
        udiseCode: school.udiseSchoolCode || school.udiseCode,
        districtName: school.districtName,
        stateName: school.stateName,
        schoolType: school.schoolType,
        management: school.management,
        status: school.status,
        userCount: school._count.users,
        classCount: school._count.classes,
        createdAt: school.createdAt,
        updatedAt: school.updatedAt,
      })),
      summary: {
        total: schools.length,
        states: uniqueStates.size,
        districts: uniqueDistricts.size,
      },
    });
  } catch (error) {
    logger.error('Hierarchical data fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch hierarchical data' });
  }
});

// Get schools for a specific state and district
router.get('/api/states/:state/districts/:district/schools', async (req: AuthenticatedRequest, res) => {
  try {
    const { state, district } = req.params;

    const schools = await prisma.school.findMany({
      where: {
        stateName: state,
        districtName: district,
      },
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
        updatedAt: true,
        name: true,
        udiseCode: true,
        _count: {
          select: { users: true, classes: true },
        },
      },
    });

    res.json({
      schools: schools.map(school => ({
        id: school.id,
        name: school.schoolName || school.name,
        schoolName: school.schoolName || school.name,
        udiseCode: school.udiseSchoolCode || school.udiseCode,
        districtName: school.districtName,
        stateName: school.stateName,
        schoolType: school.schoolType,
        management: school.management,
        status: school.status,
        userCount: school._count.users,
        classCount: school._count.classes,
        createdAt: school.createdAt,
        updatedAt: school.updatedAt,
      })),
      total: schools.length,
    });
  } catch (error) {
    logger.error('State/district schools fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch schools for state and district' });
  }
});

// Get all schools - accessible by all authenticated users
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { page = 1, limit = 1000, search, schoolType, managementType } = req.query;
    
    const where: any = {}; // Remove status filter to get all schools
    
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
        updatedAt: true,
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
        schoolName: school.schoolName || school.name,
        udiseCode: school.udiseSchoolCode || school.udiseCode,
        districtName: school.districtName,
        stateName: school.stateName,
        schoolType: school.schoolType,
        management: school.management,
        status: school.status,
        userCount: school._count.users,
        classCount: school._count.classes,
        createdAt: school.createdAt,
        updatedAt: school.updatedAt,
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

// Get school requests (for dashboard approval workflow)
router.get('/requests', requireRole(['platform_admin', 'school_admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    
    // For now, return empty array since school_requests table doesn't exist yet
    // This will be implemented when school registration workflow is added
    const requests = [];
    
    res.json({
      success: true,
      data: requests,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: 0,
        totalPages: 0
      }
    });
  } catch (error) {
    logger.error('School requests fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch school requests' });
  }
});

// Approve school request (placeholder for future implementation)
router.post('/requests/:id/approve', requireRole(['platform_admin', 'school_admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    // Placeholder implementation - will be enhanced when school_requests table exists
    res.json({
      success: true,
      message: 'School request approved successfully'
    });
  } catch (error) {
    logger.error('School request approval error:', error);
    res.status(500).json({ error: 'Failed to approve school request' });
  }
});

// Reject school request (placeholder for future implementation)
router.post('/requests/:id/reject', requireRole(['platform_admin', 'school_admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    // Placeholder implementation - will be enhanced when school_requests table exists
    res.json({
      success: true,
      message: 'School request rejected successfully'
    });
  } catch (error) {
    logger.error('School request rejection error:', error);
    res.status(500).json({ error: 'Failed to reject school request' });
  }
});

// Export schools data as CSV
router.get('/export', requireRole(['platform_admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const { state, district, status, management, type, search, format = 'csv' } = req.query;
    
    // Build where clause based on filters
    const where: any = {};
    if (state) where.stateName = state;
    if (district) where.districtName = district;
    if (status) where.status = status;
    if (management) where.managementType = management;
    if (type) where.schoolTypeLegacy = type;
    if (search) {
      where.OR = [
        { schoolName: { contains: search as string, mode: 'insensitive' } },
        { udiseSchoolCode: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const schools = await prisma.school.findMany({
      where,
      orderBy: { schoolName: 'asc' },
    });

    // Generate CSV content
    const headers = [
      'Institution ID',
      'School Name',
      'UDISE Code',
      'State',
      'District',
      'Address',
      'Contact Number',
      'Status',
      'Management Type',
      'School Type',
      'Created At'
    ];

    const csvRows = [headers.join(',')];
    
    schools.forEach(school => {
      const row = [
        school.institutionId || '',
        `"${school.schoolName?.replace(/"/g, '""') || ''}"`,
        school.udiseSchoolCode || '',
        school.stateName || '',
        school.districtName || '',
        `"${school.address?.replace(/"/g, '""') || ''}"`,
        school.contactNumber || '',
        school.status || '',
        school.managementType || '',
        school.schoolTypeLegacy || '',
        school.createdAt?.toISOString() || ''
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const filename = `schools-export-${Date.now()}.${format}`;

    logger.info(`Schools export by ${req.user!.email}: ${schools.length} schools`);
    
    res.json({
      success: true,
      data: csvContent,
      filename,
      count: schools.length
    });
  } catch (error) {
    logger.error('Schools export error:', error);
    res.status(500).json({ error: 'Failed to export schools' });
  }
});

export default router;