
import express from 'express';
import { body, validationResult } from 'express-validator';
import { logger } from '../utils/logger';
import { keycloakAdminClient } from '../services/keycloakAdmin';
import { prisma } from '../lib/prisma';

const router: express.Router = express.Router();

// POST /api/registration/complete - Single-step registration (all data in one call)
router.post('/complete', [
  body('firstName').isString().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').isString().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').matches(/^\+?[\d\s\-\(\)]+$/).isLength({ min: 10, max: 15 }).withMessage('Valid phone number is required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('username').isString().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/\d/).withMessage('Password must contain a number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain a special character'),
  body('role').isIn(['student', 'teacher', 'alumni']).withMessage('Valid role is required'),
  body('termsAccepted').isBoolean().custom((value) => {
    if (!value) throw new Error('Terms and conditions must be accepted');
    return true;
  }),
], async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    firstName, lastName, email, phone, dateOfBirth,
    institutionId, institutionName,
    username, password, role, termsAccepted
  } = req.body;

  if (!termsAccepted) {
    return res.status(400).json({ error: 'Terms and conditions must be accepted', field: 'termsAccepted' });
  }

  // Age validation (5-100 years)
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;

  if (age < 5 || age > 100) {
    return res.status(400).json({ error: 'Age must be between 5 and 100 years', field: 'dateOfBirth' });
  }

  try {
    // Check duplicate email
    const existingEmail = await keycloakAdminClient.getUserByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered', field: 'email' });
    }

    // Check duplicate username
    const existingUsername = await keycloakAdminClient.getUserByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already taken', field: 'username' });
    }

    // Verify institution if ID provided
    if (institutionId) {
      const institution = await prisma.school.findUnique({ where: { id: institutionId } });
      if (!institution) {
        return res.status(400).json({ error: 'Invalid institution selected', field: 'institutionId' });
      }
    }

    // Create user in Keycloak
    const userId = await keycloakAdminClient.createUser({
      username,
      email,
      password,
      firstName,
      lastName,
      school_id: institutionId ? String(institutionId) : undefined,
      user_type: role,
      phone,
      dateOfBirth,
      status: 'pending_approval'
    });

    logger.info(`User registration completed: ${email} with role: ${role}`);

    res.json({
      message: 'Registration completed successfully. Your account is pending approval.',
      user: {
        id: userId,
        email,
        username,
        role,
        status: 'pending_approval',
        school: institutionName,
        requiresApproval: true
      }
    });
  } catch (error) {
    logger.error('Registration completion failed:', error);
    res.status(500).json({
      error: 'Registration failed. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/registration/check-username - Check username availability
router.post('/check-username', [
  body('username').isString().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
], async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username } = req.body;
  try {
    const existingUser = await keycloakAdminClient.getUserByUsername(username);
    res.json({ available: !existingUser, username });
  } catch (error) {
    logger.error('Error checking username:', error);
    res.status(500).json({ error: 'Failed to check username availability' });
  }
});

// GET /api/registration/status - Registration status (simplified — no session needed)
router.get('/status', (_req, res) => {
  res.json({ currentStep: 1, hasSession: false });
});

export default router;
