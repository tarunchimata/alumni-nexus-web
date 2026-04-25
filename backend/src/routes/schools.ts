import express, { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthenticatedRequest, authenticateToken, requireRole } from '../middleware/auth';
import { prisma } from '../index';
import { logger } from '../utils/logger';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import axios from 'axios';

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
    
    // For platform admins, fetch from external API
    if (req.user && req.user.roles.includes('platform_admin')) {
      try {
        const response = await axios.get(process.env.SCHOOLS_API_URL || 'https://api.hostingmanager.in/api/schools/all', {
          timeout: parseInt(process.env.API_TIMEOUT || '30000')
        });
        let schools = response.data || [];
        
        // Apply filters
        if (search) {
          schools = schools.filter((school: any) => 
            school.school_name?.toLowerCase().includes((search as string).toLowerCase()) ||
            school.udise_school_code?.toLowerCase().includes((search as string).toLowerCase())
          );
        }
        
        if (schoolType) {
          schools = schools.filter((school: any) => school.school_type === schoolType);
        }
        
        if (managementType) {
          schools = schools.filter((school: any) => school.management === managementType);
        }
        
        // Apply pagination
        const startIndex = (Number(page) - 1) * Number(limit);
        const endIndex = startIndex + Number(limit);
        const paginatedSchools = schools.slice(startIndex, endIndex);
        
        // Transform to match expected format
        const transformedSchools = paginatedSchools.map((school: any) => ({
          id: school.id,
          schoolName: school.school_name,
          udiseSchoolCode: school.udise_school_code,
          schoolCategory: school.school_category,
          schoolType: school.school_type,
          management: school.management,
          stateName: school.state_name,
          districtName: school.district_name,
          villageName: school.village_name,
          pincode: school.pincode,
          status: school.status === 'Operational' ? 'active' : 'inactive',
          isActive: school.status === 'Operational',
          address: `${school.village_name || ''}, ${school.district_name || ''}, ${school.state_name || ''}`,
          contactNumber: school.contact_number || ''
        }));
        
        return res.json({
          schools: transformedSchools,
          pagination: { 
            page: Number(page), 
            limit: Number(limit), 
            total: schools.length, 
            pages: Math.ceil(schools.length / Number(limit)) 
          },
        });
      } catch (apiError) {
        logger.error('Failed to fetch schools from external API:', apiError);
        // Fallback to empty response
        return res.json({
          schools: [],
          pagination: { page: 1, limit: Number(limit), total: 0, pages: 0 },
        });
      }
    }
    
    // For non-platform admins, return empty or limited data
    return res.json({
      schools: [],
      pagination: { page: 1, limit: Number(limit), total: 0, pages: 0 },
    });
  } catch (error) {
    logger.error('Schools fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
});

export default router;
