import express from 'express';
import { AuthenticatedRequest, authenticateToken, requireRole } from '../middleware/auth';
import { prisma } from '../index';
import { logger } from '../utils/logger';

const router = express.Router();

// Apply authentication to all dashboard routes
router.use(authenticateToken);

// Platform Admin Dashboard Data
router.get('/platform-admin', requireRole('platform_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    logger.info('Platform admin dashboard data requested');

    // Get real stats from database
    const [totalUsers, totalSchools, pendingApprovals, systemHealth] = await Promise.all([
      // Total users count
      prisma.users.count(),
      
      // Total schools count  
      prisma.schools.count(),
      
      // Pending approvals (users with pending status)
      prisma.users.count({
        where: { status: 'pending_approval' }
      }),
      
      // System health check (simplified - check if DB connection works)
      prisma.$queryRaw`SELECT 1 as health`.then(() => ({ status: 'healthy', uptime: 99.8 }))
    ]);

    // Get recent activity
    const recentUsers = await prisma.users.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        userType: true,
        status: true,
        createdAt: true
      }
    });

    // Get pending schools
    const pendingSchools = await prisma.schools.findMany({
      where: { status: 'pending' },
      take: 5,
      select: {
        id: true,
        name: true,
        createdAt: true,
        status: true
      }
    });

    const dashboardData = {
      stats: {
        totalUsers,
        totalSchools,
        pendingApprovals,
        systemHealth: systemHealth.status
      },
      recentActivity: recentUsers,
      pendingSchools,
      alerts: [
        {
          type: 'info',
          message: `${pendingApprovals} users pending approval`,
          timestamp: new Date().toISOString()
        }
      ]
    };

    res.json(dashboardData);
  } catch (error) {
    logger.error('Platform admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// School Admin Dashboard Data
router.get('/school-admin', requireRole(['school_admin']), async (req: AuthenticatedRequest, res) => {
  try {
    logger.info('School admin dashboard data requested');
    
    const schoolId = req.user?.schoolId;
    if (!schoolId) {
      return res.status(400).json({ error: 'School ID not found for user' });
    }

    // Get school-specific stats
    const [totalStudents, totalAlumni, totalTeachers, pendingApprovals] = await Promise.all([
      // Students in this school
      prisma.users.count({
        where: { 
          schoolId: schoolId,
          userType: 'student',
          status: 'active'
        }
      }),
      
      // Alumni from this school
      prisma.users.count({
        where: { 
          schoolId: schoolId,
          userType: 'alumni',
          status: 'active'
        }
      }),
      
      // Teachers in this school
      prisma.users.count({
        where: { 
          schoolId: schoolId,
          userType: 'teacher',
          status: 'active'
        }
      }),
      
      // Pending approvals for this school
      prisma.users.count({
        where: { 
          schoolId: schoolId,
          status: 'pending_approval'
        }
      })
    ]);

    // Get recent registrations for this school
    const recentRegistrations = await prisma.users.findMany({
      where: { 
        schoolId: schoolId,
        status: 'pending_approval'
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        userType: true,
        createdAt: true
      }
    });

    // Get school information
    const school = await prisma.schools.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        address: true,
        status: true
      }
    });

    const dashboardData = {
      school,
      stats: {
        totalStudents,
        totalAlumni,
        totalTeachers,
        pendingApprovals
      },
      pendingRegistrations: recentRegistrations,
      alerts: [
        {
          type: 'info', 
          message: `${pendingApprovals} users waiting for approval`,
          timestamp: new Date().toISOString()
        }
      ]
    };

    res.json(dashboardData);
  } catch (error) {
    logger.error('School admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// Teacher Dashboard Data
router.get('/teacher', requireRole(['teacher']), async (req: AuthenticatedRequest, res) => {
  try {
    logger.info('Teacher dashboard data requested');
    
    const teacherId = req.user?.id;
    const schoolId = req.user?.schoolId;

    if (!teacherId || !schoolId) {
      return res.status(400).json({ error: 'Teacher or school information not found' });
    }

    // Get teacher's assigned classes (if classes table exists)
    // For now, get students from same school
    const [studentsInSchool, totalStudents] = await Promise.all([
      // Active students in same school
      prisma.users.findMany({
        where: {
          schoolId: schoolId,
          userType: 'student',
          status: 'active'
        },
        take: 20,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true
        }
      }),
      
      // Total students count
      prisma.users.count({
        where: {
          schoolId: schoolId,
          userType: 'student',
          status: 'active'
        }
      })
    ]);

    // Get school info
    const school = await prisma.schools.findUnique({
      where: { id: schoolId },
      select: {
        name: true,
        address: true
      }
    });

    const dashboardData = {
      school,
      stats: {
        totalStudents,
        assignedClasses: 0, // TODO: Implement when classes table is ready
        activeStudents: studentsInSchool.length
      },
      students: studentsInSchool,
      upcomingEvents: [], // TODO: Implement events
      alerts: [
        {
          type: 'info',
          message: `You have access to ${totalStudents} students in your school`,
          timestamp: new Date().toISOString()
        }
      ]
    };

    res.json(dashboardData);
  } catch (error) {
    logger.error('Teacher dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// Student Dashboard Data
router.get('/student', requireRole(['student']), async (req: AuthenticatedRequest, res) => {
  try {
    logger.info('Student dashboard data requested');
    
    const studentId = req.user?.id;
    const schoolId = req.user?.schoolId;

    if (!studentId || !schoolId) {
      return res.status(400).json({ error: 'Student or school information not found' });
    }

    // Get student's school and classmates
    const [school, classmates, teachers] = await Promise.all([
      // School information
      prisma.schools.findUnique({
        where: { id: schoolId },
        select: {
          name: true,
          address: true
        }
      }),
      
      // Other students in same school
      prisma.users.findMany({
        where: {
          schoolId: schoolId,
          userType: 'student',
          status: 'active',
          id: { not: studentId }
        },
        take: 10,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }),
      
      // Teachers in same school
      prisma.users.findMany({
        where: {
          schoolId: schoolId,
          userType: 'teacher',
          status: 'active'
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      })
    ]);

    const dashboardData = {
      school,
      stats: {
        classmatesCount: classmates.length,
        teachersCount: teachers.length,
        enrolledClasses: 0 // TODO: Implement when classes table is ready
      },
      classmates,
      teachers,
      upcomingEvents: [], // TODO: Implement events
      alerts: [
        {
          type: 'welcome',
          message: `Welcome to ${school?.name}! Connect with your classmates and teachers.`,
          timestamp: new Date().toISOString()
        }
      ]
    };

    res.json(dashboardData);
  } catch (error) {
    logger.error('Student dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// Alumni Dashboard Data
router.get('/alumni', requireRole(['alumni']), async (req: AuthenticatedRequest, res) => {
  try {
    logger.info('Alumni dashboard data requested');
    
    const alumniId = req.user?.id;
    const schoolId = req.user?.schoolId;

    if (!alumniId || !schoolId) {
      return res.status(400).json({ error: 'Alumni or school information not found' });
    }

    // Get alumni's school and fellow alumni
    const [school, fellowAlumni, currentStudents] = await Promise.all([
      // School information
      prisma.schools.findUnique({
        where: { id: schoolId },
        select: {
          name: true,
          address: true
        }
      }),
      
      // Other alumni from same school
      prisma.users.findMany({
        where: {
          schoolId: schoolId,
          userType: 'alumni',
          status: 'active',
          id: { not: alumniId }
        },
        take: 10,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true
        }
      }),
      
      // Current students (for mentoring opportunities)
      prisma.users.count({
        where: {
          schoolId: schoolId,
          userType: 'student',
          status: 'active'
        }
      })
    ]);

    const dashboardData = {
      school,
      stats: {
        fellowAlumniCount: fellowAlumni.length,
        currentStudents,
        mentoringOpportunities: Math.floor(currentStudents * 0.1), // 10% of students need mentors
        networkConnections: fellowAlumni.length
      },
      fellowAlumni,
      mentoringOpportunities: [], // TODO: Implement mentoring system
      upcomingEvents: [], // TODO: Implement events
      alerts: [
        {
          type: 'network',
          message: `Connect with ${fellowAlumni.length} fellow alumni from ${school?.name}`,
          timestamp: new Date().toISOString()
        }
      ]
    };

    res.json(dashboardData);
  } catch (error) {
    logger.error('Alumni dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

export default router;
