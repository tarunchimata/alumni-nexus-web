import express, { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateToken, requireRole } from '../middleware/auth';
import { prisma } from '../index';
import { logger } from '../utils/logger';
import { keycloakAdminClient } from '../services/keycloakAdmin';
import axios from 'axios';

const router: Router = express.Router();

// Apply authentication to all dashboard routes
router.use(authenticateToken);

// Helper function to fetch users from Keycloak
async function fetchUsersFromKeycloak() {
  try {
    await keycloakAdminClient.authenticate();
    const kcAdmin = await keycloakAdminClient.getAdmin();
    const users = await kcAdmin.users.find({ realm: process.env.KEYCLOAK_REALM });
    return { users: users || [] };
  } catch (error) {
    logger.error('Failed to fetch users from Keycloak:', error);
    return { users: [] };
  }
}

// GET /api/dashboard/:role - Get dashboard data based on role
router.get('/:role', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role } = req.params;
    const userId = req.user?.id ? parseInt(req.user.id, 10) : undefined;
    const schoolId = req.user?.schoolId ? parseInt(req.user.schoolId, 10) : undefined;

    logger.info(`Fetching dashboard data for role: ${role}, user: ${userId}`);

    // Get base statistics from external APIs
    const [schoolsResponse, keycloakUsersResponse] = await Promise.all([
      axios.get(process.env.SCHOOLS_API_URL || 'https://api.hostingmanager.in/api/schools/all', {
        timeout: parseInt(process.env.API_TIMEOUT || '30000')
      }).then(res => res.data).catch(() => ({ data: [] })),
      fetchUsersFromKeycloak().catch(() => ({ users: [] }))
    ]);

    const totalSchools = schoolsResponse.data?.length || 0;
    const totalUsers = keycloakUsersResponse.users?.length || 0;
    const totalConnections = 0; // Will be implemented with connections API
    const pendingApprovals = 0; // Will be implemented with approvals API

    const baseStats = {
      totalUsers,
      totalSchools,
      activeConnections: totalConnections,
      pendingApprovals
    };

    // Get role-specific data
    let roleSpecificData = {};
    let roleSpecificStats = {};

    switch (role) {
      case 'platform_admin':
        roleSpecificStats = await getPlatformAdminStats();
        roleSpecificData = await getPlatformAdminData(userId);
        break;
      case 'school_admin':
        roleSpecificStats = await getSchoolAdminStats(schoolId);
        roleSpecificData = await getSchoolAdminData(schoolId);
        break;
      case 'teacher':
        roleSpecificStats = await getTeacherStats(userId);
        roleSpecificData = await getTeacherData(userId);
        break;
      case 'student':
        roleSpecificStats = await getStudentStats(userId);
        roleSpecificData = await getStudentData(userId);
        break;
      case 'alumni':
        roleSpecificStats = await getAlumniStats(userId);
        roleSpecificData = await getAlumniData(userId);
        break;
    }

    // Get recent activity
    const recentActivity = await getRecentActivity(userId, role);

    const response = {
      stats: { ...baseStats, ...roleSpecificStats },
      ...roleSpecificData,
      recentActivity,
      alerts: []
    };

    logger.info(`Dashboard data fetched successfully for role: ${role}`);
    res.json(response);
  } catch (error) {
    logger.error('Dashboard data fetch failed:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Platform Admin specific functions
async function getPlatformAdminStats() {
  const [totalStudents, totalAlumni, totalTeachers] = await Promise.all([
    prisma.user.count({ where: { role: 'student', isActive: true } }),
    prisma.user.count({ where: { role: 'alumni', isActive: true } }),
    prisma.user.count({ where: { role: 'teacher', isActive: true } })
  ]);

  return {
    totalStudents,
    totalAlumni,
    totalTeachers
  };
}

async function getPlatformAdminData(userId?: number) {
  // Fetch data from external APIs
  const [schoolsResponse, keycloakUsersResponse] = await Promise.all([
    axios.get(process.env.SCHOOLS_API_URL || 'https://api.hostingmanager.in/api/schools/all', {
      timeout: parseInt(process.env.API_TIMEOUT || '30000')
    }).then(res => res.data).catch(() => ({ data: [] })),
    fetchUsersFromKeycloak().catch(() => ({ users: [] }))
  ]);

  const schools = schoolsResponse.data || [];
  const users = keycloakUsersResponse.users || [];

  // Transform schools data for dashboard
  const schoolList = schools.slice(0, 10).map((school: any) => ({
    id: school.id,
    schoolName: school.school_name,
    stateName: school.state_name || 'Unknown',
    createdAt: new Date().toISOString(), // API doesn't provide creation date
    isActive: school.status === 'Operational'
  }));

  // Transform users data for dashboard  
  const userList = users.slice(0, 10).map((user: any) => ({
    id: user.id,
    firstName: user.firstName || user.given_name || 'Unknown',
    lastName: user.lastName || user.family_name || 'User',
    email: user.email,
    role: 'user', // Will be determined from Keycloak attributes
    createdAt: user.createdTimestamp ? new Date(user.createdTimestamp).toISOString() : new Date().toISOString(),
    school: null // Will be populated from user attributes
  }));

  return {
    pendingRegistrations: [], // Will be implemented with registration API
    pendingSchools: schoolList.filter(school => !school.isActive),
    recentUsers: userList,
    schools: schoolList,
    users: userList
  };
}

// School Admin specific functions
async function getSchoolAdminStats(schoolId?: number) {
  if (!schoolId) return {};

  const [studentsCount, alumniCount, teachersCount] = await Promise.all([
    prisma.user.count({ where: { schoolId, role: 'student', isActive: true } }),
    prisma.user.count({ where: { schoolId, role: 'alumni', isActive: true } }),
    prisma.user.count({ where: { schoolId, role: 'teacher', isActive: true } })
  ]);

  return {
    totalStudents: studentsCount,
    totalAlumni: alumniCount,
    totalTeachers: teachersCount
  };
}

async function getSchoolAdminData(schoolId?: number) {
  if (!schoolId) return {};

  const [school, students, teachers, pendingRegistrations] = await Promise.all([
    prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        schoolName: true,
        stateName: true,
        districtName: true
      }
    }),
    prisma.user.findMany({
      where: { schoolId, role: 'student', isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        graduationYear: true
      },
      take: 10
    }),
    prisma.user.findMany({
      where: { schoolId, role: 'teacher', isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      },
      take: 10
    }),
    prisma.user.findMany({
      where: { schoolId, isActive: false },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true
      },
      take: 10
    })
  ]);

  return {
    school,
    students,
    teachers,
    pendingRegistrations
  };
}

// Teacher specific functions
async function getTeacherStats(userId?: number) {
  if (!userId) return {};

  const [assignedClasses, activeStudents] = await Promise.all([
    prisma.class.count({ where: { classAdminId: userId } }),
    prisma.user.count({ 
      where: { 
        role: 'student', 
        isActive: true,
        userClassGroups: {
          some: {
            class: { classAdminId: userId }
          }
        }
      } 
    })
  ]);

  return {
    assignedClasses,
    activeStudents
  };
}

async function getTeacherData(userId?: number) {
  if (!userId) return {};

  const [classes, students] = await Promise.all([
    prisma.class.findMany({
      where: { classAdminId: userId },
      select: {
        id: true,
        name: true,
        section: true,
        academicYear: true,
        _count: { select: { userClassGroups: true } }
      }
    }),
    prisma.user.findMany({
      where: {
        role: 'student',
        isActive: true,
        userClassGroups: {
          some: {
            class: { classAdminId: userId }
          }
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      },
      take: 20
    })
  ]);

  return { classes, students };
}

// Student specific functions
async function getStudentStats(userId?: number) {
  if (!userId) return {};

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { school: true }
  });

  if (!user?.schoolId) return {};

  const [classmatesCount, teachersCount, enrolledClasses] = await Promise.all([
    prisma.user.count({ 
      where: { 
        schoolId: user.schoolId, 
        role: 'student', 
        isActive: true,
        id: { not: userId }
      } 
    }),
    prisma.user.count({ 
      where: { 
        schoolId: user.schoolId, 
        role: 'teacher', 
        isActive: true 
      } 
    }),
    prisma.userClassGroup.count({ where: { userId } })
  ]);

  return {
    classmatesCount,
    teachersCount,
    enrolledClasses
  };
}

async function getStudentData(userId?: number) {
  if (!userId) return {};

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { school: true }
  });

  if (!user?.schoolId) return {};

  const [classmates, teachers] = await Promise.all([
    prisma.user.findMany({
      where: {
        schoolId: user.schoolId,
        role: 'student',
        isActive: true,
        id: { not: userId }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        graduationYear: true
      },
      take: 10
    }),
    prisma.user.findMany({
      where: {
        schoolId: user.schoolId,
        role: 'teacher',
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      },
      take: 10
    })
  ]);

  return { classmates, teachers, school: user.school };
}

// Alumni specific functions
async function getAlumniStats(userId?: number) {
  if (!userId) return {};

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { school: true }
  });

  if (!user?.schoolId) return {};

  const [fellowAlumniCount, currentStudents, networkConnections] = await Promise.all([
    prisma.user.count({ 
      where: { 
        schoolId: user.schoolId, 
        role: 'alumni', 
        isActive: true,
        id: { not: userId }
      } 
    }),
    prisma.user.count({ 
      where: { 
        schoolId: user.schoolId, 
        role: 'student', 
        isActive: true 
      } 
    }),
    prisma.connection.count({ 
      where: { 
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ],
        status: 'accepted' 
      } 
    })
  ]);

  return {
    fellowAlumniCount,
    currentStudents,
    networkConnections
  };
}

async function getAlumniData(userId?: number) {
  if (!userId) return {};

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { school: true }
  });

  if (!user?.schoolId) return {};

  const [fellowAlumni, students] = await Promise.all([
    prisma.user.findMany({
      where: {
        schoolId: user.schoolId,
        role: 'alumni',
        isActive: true,
        id: { not: userId }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        graduationYear: true,
        profile: {
          select: {
            profession: true,
            company: true
          }
        }
      },
      take: 10
    }),
    prisma.user.findMany({
      where: {
        schoolId: user.schoolId,
        role: 'student',
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        graduationYear: true
      },
      take: 10
    })
  ]);

  return { fellowAlumni, students, school: user.school };
}

// Get recent activity for all roles
async function getRecentActivity(userId?: number, role?: string) {
  if (!userId) return [];

  const activities: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
    user: { name: string; role: string };
  }> = [];

  // Get recent connections
  const connections = await prisma.connection.findMany({
    where: {
      OR: [
        { senderId: userId },
        { receiverId: userId }
      ]
    },
    include: {
      sender: { select: { firstName: true, lastName: true, role: true } },
      receiver: { select: { firstName: true, lastName: true, role: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  connections.forEach(conn => {
    const otherUser = conn.senderId === userId ? conn.receiver : conn.sender;
    activities.push({
      id: `conn_${conn.id}`,
      type: 'connection',
      message: `New connection with ${otherUser.firstName} ${otherUser.lastName}`,
      timestamp: conn.createdAt.toISOString(),
      user: { name: `${otherUser.firstName} ${otherUser.lastName}`, role: otherUser.role }
    });
  });

  // Get recent direct messages
  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: userId },
        { receiverId: userId }
      ]
    },
    include: {
      sender: { select: { firstName: true, lastName: true, role: true } },
      receiver: { select: { firstName: true, lastName: true, role: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  messages.forEach(msg => {
    const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
    activities.push({
      id: `msg_${msg.id}`,
      type: 'message',
      message: `Message from ${otherUser.firstName} ${otherUser.lastName}`,
      timestamp: msg.createdAt.toISOString(),
      user: { name: `${otherUser.firstName} ${otherUser.lastName}`, role: otherUser.role }
    });
  });

  return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);
}

export default router;