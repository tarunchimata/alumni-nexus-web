import express from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { keycloakMiddleware, requireRole } from '../middleware/keycloak';
import { prisma } from '../index';
import { logger } from '../utils/logger';

const router = express.Router();

// Apply authentication to all user routes
router.use(keycloakMiddleware);

// GET /api/users/:id/profile - Get user profile
router.get('/:id/profile', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.id);
    const requestingUser = req.user;

    if (!requestingUser || (!['platform_admin', 'school_admin'].includes(requestingUser.roles[0]) && requestingUser.id !== userId.toString())) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get user basic data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        school: true,
        profile: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return combined user and profile data
    const profileData = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      dateOfBirth: user.dateOfBirth,
      profilePictureUrl: user.profilePictureUrl,
      role: user.role,
      schoolId: user.schoolId,
      school: user.school,
      // Profile specific data
      bio: user.profile?.bio,
      profession: user.profile?.profession,
      company: user.profile?.company,
      city: user.profile?.city,
      linkedinUrl: user.profile?.linkedinUrl,
      websiteUrl: user.profile?.websiteUrl,
      skills: user.profile?.skills || [],
      achievements: user.profile?.achievements || [],
      isProfilePublic: user.profile?.isProfilePublic ?? true,
      showEmail: user.profile?.showEmail ?? false,
      showPhone: user.profile?.showPhone ?? false
    };

    res.json(profileData);
  } catch (error) {
    logger.error('Failed to get user profile:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// PUT /api/users/:id/profile - Update user profile
router.put('/:id/profile', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.id);
    const requestingUser = req.user;

    if (!requestingUser || (!['platform_admin', 'school_admin'].includes(requestingUser.roles[0]) && requestingUser.id !== userId.toString())) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      dateOfBirth,
      profilePictureUrl,
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

    // Update user basic data
    await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        email: email.toLowerCase(),
        phoneNumber,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        profilePictureUrl
      }
    });

    // Upsert user profile
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        bio,
        profession,
        company,
        city,
        linkedinUrl,
        websiteUrl,
        skills: skills || [],
        achievements: achievements || [],
        isProfilePublic: isProfilePublic ?? true,
        showEmail: showEmail ?? false,
        showPhone: showPhone ?? false
      },
      create: {
        userId,
        bio,
        profession,
        company,
        city,
        linkedinUrl,
        websiteUrl,
        skills: skills || [],
        achievements: achievements || [],
        isProfilePublic: isProfilePublic ?? true,
        showEmail: showEmail ?? false,
        showPhone: showPhone ?? false
      }
    });

    logger.info(`Profile updated for user ${userId}`, { updatedBy: requestingUser.email });
    res.json({ message: 'Profile updated successfully', profile });
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
      whereClause.schoolId = parseInt(requestingUser.schoolId);
    }

    // Add filters
    if (role) {
      whereClause.role = role;
    }

    if (school && requestingUser?.roles.includes('platform_admin')) {
      whereClause.schoolId = parseInt(school as string);
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
        school: {
          select: {
            id: true,
            name: true,
            schoolName: true
          }
        },
        profile: {
          select: {
            profession: true,
            company: true,
            city: true,
            isProfilePublic: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limitNum
    });

    const totalCount = await prisma.user.count({ where: whereClause });

    res.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum)
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
    const userId = parseInt(req.params.id);
    const requestingUser = req.user;

    if (!requestingUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            schoolName: true,
            address: true
          }
        },
        profile: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user can view this profile
    const canViewProfile = (
      requestingUser.id === userId.toString() ||
      ['platform_admin', 'school_admin'].includes(requestingUser.roles[0]) ||
      (user.profile?.isProfilePublic && user.isActive)
    );

    if (!canViewProfile) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Filter sensitive data for non-owners
    if (requestingUser.id !== userId.toString() && !['platform_admin', 'school_admin'].includes(requestingUser.roles[0])) {
      const publicProfile = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.profile?.showEmail ? user.email : undefined,
        phoneNumber: user.profile?.showPhone ? user.phoneNumber : undefined,
        profilePictureUrl: user.profilePictureUrl,
        role: user.role,
        school: user.school,
        bio: user.profile?.bio,
        profession: user.profile?.profession,
        company: user.profile?.company,
        city: user.profile?.city,
        linkedinUrl: user.profile?.linkedinUrl,
        websiteUrl: user.profile?.websiteUrl,
        skills: user.profile?.skills || [],
        achievements: user.profile?.achievements || []
      };
      return res.json(publicProfile);
    }

    res.json(user);
  } catch (error) {
    logger.error('Failed to get user:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;