import express, { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthenticatedRequest, authenticateToken, requireRole } from '../middleware/auth';
import { prisma } from '../lib/prisma';
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
      by: ['state'],
      where: {
        state: { not: null },
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
        name: s.state,
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
      by: ['district'],
      where: {
        state: state,
        district: { not: null },
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
        name: d.district,
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

    // Since School model doesn't have status field, return basic stats
    const statusCounts = { active: total };

    res.json({
      total,
      byStatus: statusCounts,
      activeSchools: total,
      pendingSchools: 0, // No pending status in School model
      rejectedSchools: 0, // No rejected status in School model
    });
  } catch (error) {
    logger.error('Comprehensive stats fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get schools grouped by management type
router.get('/api/schools-by-management', async (req: AuthenticatedRequest, res) => {
  try {
    // Get all schools with management field
    const schools = await prisma.school.findMany({
      where: {
        management: { not: null },
      },
      select: {
        management: true,
      },
    });

    // Group by management in JavaScript
    const managementMap = new Map<string, number>();
    schools.forEach(school => {
      if (school.management) {
        managementMap.set(school.management, (managementMap.get(school.management) || 0) + 1);
      }
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
    // Get all schools with type field
    const schools = await prisma.school.findMany({
      where: {
        type: { not: null },
      },
      select: {
        type: true,
      },
    });

    // Group by type in JavaScript
    const typeMap = new Map<string, number>();
    schools.forEach(school => {
      if (school.type) {
        typeMap.set(school.type, (typeMap.get(school.type) || 0) + 1);
      }
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
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        management: true,
        state: true,
        district: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const uniqueStates = new Set<string>();
    const uniqueDistricts = new Set<string>();
    
    // Get user counts for each school
    const schoolsWithCounts = await Promise.all(
      schools.map(async (school) => ({
        ...school,
        _count: {
          User: await prisma.user.count({ where: { schoolId: school.id } })
        }
      }))
    );
    
    schoolsWithCounts.forEach(school => {
      if (school.state) uniqueStates.add(school.state);
      if (school.district) uniqueDistricts.add(school.district);
    });

    res.json({
      schools: schoolsWithCounts.map(school => ({
        id: school.id,
        name: school.name,
        schoolName: school.name,
        udiseCode: school.code,
        districtName: school.district,
        stateName: school.state,
        schoolType: school.type,
        management: school.management,
        status: 'active', // Default status since schema doesn't have this field
        userCount: school._count.User,
        classCount: 0, // No classes in schema
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
        state,
        district,
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        management: true,
        state: true,
        district: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Get user counts for each school
    const schoolsWithCounts = await Promise.all(
      schools.map(async (school) => ({
        ...school,
        _count: {
          User: await prisma.user.count({ where: { schoolId: school.id } })
        }
      }))
    );

    res.json({
      schools: schoolsWithCounts.map(school => ({
        id: school.id,
        name: school.name,
        schoolName: school.name,
        udiseCode: school.code,
        districtName: school.district,
        stateName: school.state,
        schoolType: school.type,
        management: school.management,
        status: 'active', // Default status
        userCount: school._count.User,
        classCount: 0, // No classes in schema, set to 0
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
