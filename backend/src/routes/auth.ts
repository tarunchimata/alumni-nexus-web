
import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/keycloak';
import { prisma } from '../index';
import { logger } from '../utils/logger';

const router = Router();

// Get user profile
router.get('/profile', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { keycloakId: req.user.id },
      include: { school: true },
    });

    if (!user) {
      // Create user if doesn't exist
      user = await prisma.user.create({
        data: {
          keycloakId: req.user.id,
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          role: req.user.roles.includes('platform_admin') ? 'platform_admin' :
                req.user.roles.includes('school_admin') ? 'school_admin' :
                req.user.roles.includes('teacher') ? 'teacher' :
                req.user.roles.includes('alumni') ? 'alumni' : 'student',
        },
        include: { school: true },
      });
    }

    res.json({
      id: user.id,
      keycloakId: user.keycloakId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      school: user.school,
      profilePictureUrl: user.profilePictureUrl,
    });
  } catch (error) {
    logger.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { firstName, lastName, phoneNumber, dateOfBirth, profilePictureUrl } = req.body;

    const updatedUser = await prisma.user.update({
      where: { keycloakId: req.user.id },
      data: {
        firstName,
        lastName,
        phoneNumber,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        profilePictureUrl,
      },
      include: { school: true },
    });

    res.json(updatedUser);
  } catch (error) {
    logger.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
