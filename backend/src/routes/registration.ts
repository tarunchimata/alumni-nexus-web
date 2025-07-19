import express from 'express';
import { body, validationResult } from 'express-validator';
import { logger } from '../utils/logger';
import { keycloakAdminClient } from '../services/keycloakAdmin';
import { prisma } from '../index';
import { 
  initRegistrationSession, 
  validateRegistrationStep, 
  cleanupRegistrationSession,
  RegistrationSession 
} from '../middleware/sessionAuth';

const router = express.Router();

// POST /api/registration/init - Initialize registration session
router.post('/init', initRegistrationSession, (req, res) => {
  res.json({ 
    message: 'Registration session initialized',
    currentStep: req.session.registration?.currentStep || 1
  });
});

// POST /api/registration/basic - Store basic info (Step 1)
router.post('/basic', [
  body('fullName').isString().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').isMobilePhone('any').withMessage('Valid phone number is required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
], initRegistrationSession, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { fullName, email, phone, dateOfBirth } = req.body;
  
  // Age validation (5-100 years)
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  if (age < 5 || age > 100) {
    return res.status(400).json({ 
      error: 'Age must be between 5 and 100 years',
      age 
    });
  }

  // Check for duplicate email and phone
  try {
    const existingUser = await keycloakAdminClient.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
  } catch (error) {
    // User not found is expected
  }

  // Store in session
  if (!req.session.registration) {
    req.session.registration = { currentStep: 1, startTime: new Date() };
  }
  
  req.session.registration.basicInfo = { fullName, email, phone, dateOfBirth };
  req.session.registration.currentStep = 2;
  
  logger.info(`Registration Step 1 completed for email: ${email}`);
  
  res.json({ 
    message: 'Basic info stored successfully',
    currentStep: 2,
    age
  });
});

// POST /api/registration/school - Store school info (Step 2)
router.post('/school', [
  body('institutionId').isInt().withMessage('Valid institution ID is required'),
  body('institutionName').isString().withMessage('Institution name is required'),
], validateRegistrationStep(2), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { institutionId, institutionName } = req.body;
  
  // Verify institution exists
  try {
    const institution = await prisma.institutions.findUnique({
      where: { id: institutionId }
    });
    
    if (!institution) {
      return res.status(400).json({ error: 'Invalid institution selected' });
    }
    
    // Store in session
    req.session.registration!.schoolInfo = { institutionId, institutionName };
    req.session.registration!.currentStep = 3;
    
    logger.info(`Registration Step 2 completed - School: ${institutionName}`);
    
    res.json({ 
      message: 'School info stored successfully',
      currentStep: 3,
      institution: {
        id: institution.id,
        name: institution.institution_name,
        city: institution.city,
        state: institution.state
      }
    });
  } catch (error) {
    logger.error('Error storing school info:', error);
    res.status(500).json({ error: 'Failed to store school information' });
  }
});

// POST /api/registration/account - Store account info (Step 3)
router.post('/account', [
  body('username').isString().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Password confirmation does not match password');
    }
    return true;
  }),
], validateRegistrationStep(3), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;
  
  // Check username availability
  try {
    const existingUser = await keycloakAdminClient.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }
  } catch (error) {
    // User not found is expected
  }
  
  // Store in session (don't store password for security)
  req.session.registration!.accountInfo = { username, password };
  req.session.registration!.currentStep = 4;
  
  logger.info(`Registration Step 3 completed - Username: ${username}`);
  
  res.json({ 
    message: 'Account info stored successfully',
    currentStep: 4,
    username
  });
});

// POST /api/registration/complete - Final registration (Step 4)
router.post('/complete', [
  body('role').isIn(['student', 'teacher', 'alumni']).withMessage('Valid role is required'),
  body('termsAccepted').isBoolean().withMessage('Terms acceptance is required'),
], validateRegistrationStep(4), cleanupRegistrationSession, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { role, termsAccepted } = req.body;
  const session = req.session.registration!;
  
  if (!termsAccepted) {
    return res.status(400).json({ error: 'Terms and conditions must be accepted' });
  }
  
  try {
    // Create user in Keycloak
    const userId = await keycloakAdminClient.createUser({
      username: session.accountInfo!.username,
      email: session.basicInfo!.email,
      password: session.accountInfo!.password,
      firstName: session.basicInfo!.fullName.split(' ')[0],
      lastName: session.basicInfo!.fullName.split(' ').slice(1).join(' '),
      school_id: session.schoolInfo!.institutionId.toString(),
      user_type: role,
      phone: session.basicInfo!.phone,
      dateOfBirth: session.basicInfo!.dateOfBirth,
      status: 'pending_approval'
    });
    
    logger.info(`User registration completed: ${session.basicInfo!.email} with role: ${role}`);
    
    res.json({ 
      message: 'Registration completed successfully',
      user: {
        id: userId,
        email: session.basicInfo!.email,
        username: session.accountInfo!.username,
        role,
        status: 'pending_approval',
        school: session.schoolInfo!.institutionName
      }
    });
  } catch (error) {
    logger.error('Registration completion failed:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// GET /api/registration/status - Check registration status
router.get('/status', (req, res) => {
  const session = req.session.registration;
  
  if (!session) {
    return res.json({ 
      currentStep: 1,
      hasSession: false 
    });
  }
  
  res.json({ 
    currentStep: session.currentStep,
    hasSession: true,
    startTime: session.startTime,
    completedSteps: {
      basicInfo: !!session.basicInfo,
      schoolInfo: !!session.schoolInfo,
      accountInfo: !!session.accountInfo,
      roleInfo: !!session.roleInfo
    }
  });
});

export default router;