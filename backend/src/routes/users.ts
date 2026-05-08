import express, { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { keycloakMiddleware, requireRole } from '../middleware/keycloak';
import { hasAnyRole } from '../types/auth';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

const router: Router = express.Router();

// Apply authentication to all user routes
router.use(keycloakMiddleware);

// GET /api/users/:id/profile - Get user profile
router.get('/:id/profile', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.params.id; // Keep as string
    const requestingUser = req.user;

    if (!requestingUser || (!hasAnyRole(requestingUser.roles, ['platform_admin', 'school_admin']) && requestingUser.id !== userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get user basic data with school relation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        School: true, // Note: Capital S for relation name
        AlumniProfile: true,
        StudentProfile: true,
        TeacherProfile: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get profile data based on role
    let profileData: any = {};
    if (user.role === 'alumni' && user.AlumniProfile) {
      profileData = {
        bio: user.AlumniProfile.currentPosition || '',
        profession: user.AlumniProfile.currentPosition,
        company: user.AlumniProfile.currentCompany,
        linkedinUrl: user.AlumniProfile.linkedInUrl,
        // Add other alumni-specific fields as needed
      };
    } else if (user.role === 'student' && user.StudentProfile) {
      profileData = {
        class: user.StudentProfile.class,
        section: user.StudentProfile.section,
        rollNumber: user.StudentProfile.rollNumber,
        admissionNo: user.StudentProfile.admissionNo,
      };
    } else if (user.role === 'teacher' && user.TeacherProfile) {
      profileData = {
        department: user.TeacherProfile.department,
        designation: user.TeacherProfile.designation,
        employeeId: user.TeacherProfile.employeeId,
      };
    }

    // Return combined user and profile data
    const responseData = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone, // Use phone instead of phoneNumber
      dateOfBirth: user.dateOfBirth,
      role: user.role,
      schoolId: user.schoolId,
      school: user.School, // Use School relation
      // Profile specific data
      ...profileData,
      // Default profile settings (you may want to add these to schema later)
      isProfilePublic: true,
      showEmail: false,
      showPhone: false,
      skills: [],
      achievements: []
    };

    res.json(responseData);
  } catch (error) {
    logger.error('Failed to get user profile:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// PUT /api/users/:id/profile - Update user profile
router.put('/:id/profile', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.params.id; // Keep as string
    const requestingUser = req.user;

    if (!requestingUser || (!hasAnyRole(requestingUser.roles, ['platform_admin', 'school_admin']) && requestingUser.id !== userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const {
      firstName,
      lastName,
      email,
      phone, // Use phone instead of phoneNumber
      dateOfBirth,
      bio,
      profession,
      company,
      city,
      linkedinUrl,
      websiteUrl,
      skills,
      achievements,
      isProfilePublic,
      showEmail,
      showPhone
    } = req.body;

    // Get current user to determine role
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user basic data
    await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        email,
        phone, // Use phone field
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined
      }
    });

    // Update profile data based on role
    if (currentUser.role === 'alumni') {
      await prisma.alumniProfile.upsert({
        where: { userId },
        update: {
          currentPosition: profession,
          currentCompany: company,
          linkedInUrl: linkedinUrl,
          graduationYear: new Date().getFullYear()
        },
        create: {
          id: userId,
          graduationYear: new Date().getFullYear(),
          currentPosition: profession || null,
          currentCompany: company || null,
          linkedInUrl: linkedinUrl || null,
          User: {
            connect: { id: userId }
          }
        }
      });
    } else if (currentUser.role === 'student') {
      await prisma.studentProfile.upsert({
        where: { userId },
        update: {},
        create: {
          id: userId,
          class: 'Unknown',
          section: null,
          rollNumber: null,
          admissionNo: null,
          User: {
            connect: { id: userId }
          }
        }
      });
    } else if (currentUser.role === 'teacher') {
      await prisma.teacherProfile.upsert({
        where: { userId },
        update: {},
        create: {
          id: userId,
          employeeId: null,
          department: null,
          designation: null,
          User: {
            connect: { id: userId }
          }
        }
      });
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    logger.error('Failed to update user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// GET /api/users - Get all users (admin only)
router.get('/', requireRole(['platform_admin', 'school_admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const requestingUser = req.user;
    const { page = 1, limit = 50, role, school, search } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const whereClause: any = {};

    // School admin can only see users from their school
    if (requestingUser?.roles.includes('school_admin') && requestingUser.schoolId) {
      whereClause.schoolId = requestingUser.schoolId; // Keep as string
    }

    // Add filters
    if (role) {
      whereClause.role = role;
    }

    if (school && requestingUser?.roles.includes('platform_admin')) {
      whereClause.schoolId = school as string; // Keep as string
    }

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        School: { // Use capital S
          select: {
            id: true,
            name: true
          }
        }
      },
      skip: offset,
      take: limitNum,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.user.count({ where: whereClause });

    // Transform response to match expected format
    const transformedUsers = users.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      schoolId: user.schoolId,
      school: user.School,
      isActive: user.isActive,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    }));

    res.json({
      users: transformedUsers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error('Failed to get users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// GET /api/users/:id - Get specific user
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.params.id; // Keep as string
    const requestingUser = req.user;

    if (!requestingUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        School: { // Use capital S
          select: {
            id: true,
            name: true,
            addressLine1: true,
            city: true,
            state: true
          }
        },
        AlumniProfile: true,
        StudentProfile: true,
        TeacherProfile: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user can view this profile
    const canViewProfile = (
      requestingUser.id === userId ||
      hasAnyRole(requestingUser.roles, ['platform_admin', 'school_admin']) ||
      user.isActive // Simplified - you can add profile visibility logic later
    );

    if (!canViewProfile) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get profile data based on role
    let profileData: any = {};
    if (user.role === 'alumni' && user.AlumniProfile) {
      profileData = {
        bio: user.AlumniProfile.currentPosition || '',
        profession: user.AlumniProfile.currentPosition,
        company: user.AlumniProfile.currentCompany,
        linkedinUrl: user.AlumniProfile.linkedInUrl,
      };
    } else if (user.role === 'student' && user.StudentProfile) {
      profileData = {
        class: user.StudentProfile.class,
        section: user.StudentProfile.section,
        rollNumber: user.StudentProfile.rollNumber,
      };
    } else if (user.role === 'teacher' && user.TeacherProfile) {
      profileData = {
        department: user.TeacherProfile.department,
        designation: user.TeacherProfile.designation,
      };
    }

    // Return user data
    const responseData = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      schoolId: user.schoolId,
      school: user.School,
      isActive: user.isActive,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      ...profileData,
      // Default values for missing fields
      isProfilePublic: true,
      showEmail: false,
      showPhone: false,
      skills: [],
      achievements: []
    };

    res.json(responseData);
  } catch (error) {
    logger.error('Failed to get user:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;