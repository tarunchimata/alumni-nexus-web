import express from 'express';
import { body, validationResult } from 'express-validator';
import { keycloakAdminClient } from '../services/keycloakAdmin';
import { loginUser } from '../services/keycloakAuth';
import { logger } from '../utils/logger';
import pool from '../db/connection';

const router = express.Router();

// POST /api/registration/init - Initialize registration session
router.post('/init', async (req, res) => {
  try {
    const sessionId = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store in Redis or session store (for now, we'll use a simple in-memory store)
    // In production, use Redis or database
    req.session = req.session || {};
    req.session.registrationId = sessionId;
    req.session.registrationData = {};

    res.json({ sessionId, currentStep: 1 });
  } catch (err) {
    logger.error('Registration init failed:', err);
    res.status(500).json({ error: 'Failed to initialize registration' });
  }
});

// POST /api/registration/step1 - Basic Info
router.post(
  '/step1',
  [
    body('firstName').isString().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
    body('lastName').isString().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').isString().isLength({ min: 10 }).withMessage('Valid phone number is required'),
    body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, phone, dateOfBirth } = req.body;

    try {
      // Calculate age
      const age = Math.floor((new Date().getTime() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      
      if (age < 5 || age > 100) {
        return res.status(400).json({ error: 'Age must be between 5 and 100 years' });
      }

      // Check for duplicate email
      const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Check for duplicate phone
      const phoneCheck = await pool.query('SELECT id FROM users WHERE phone_number = $1', [phone]);
      if (phoneCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Phone number already registered' });
      }

      // Store step 1 data
      req.session = req.session || {};
      req.session.registrationData = {
        ...req.session.registrationData,
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth,
        age,
        step1Complete: true
      };

      res.json({ message: 'Step 1 completed', nextStep: 2 });
    } catch (err) {
      logger.error('Registration step 1 failed:', err);
      res.status(500).json({ error: 'Step 1 validation failed' });
    }
  }
);

// POST /api/registration/step2 - School Selection
router.post(
  '/step2',
  [
    body('institutionId').isInt().withMessage('Valid institution ID is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { institutionId } = req.body;

    try {
      // Verify institution exists
      const institutionQuery = await pool.query(
        'SELECT id, institution_name, city, state FROM institutions WHERE id = $1 AND status = $2',
        [institutionId, 'Active']
      );

      if (institutionQuery.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid institution selected' });
      }

      const institution = institutionQuery.rows[0];

      // Store step 2 data
      req.session = req.session || {};
      req.session.registrationData = {
        ...req.session.registrationData,
        institutionId,
        institutionName: institution.institution_name,
        step2Complete: true
      };

      res.json({ message: 'Step 2 completed', nextStep: 3, institution });
    } catch (err) {
      logger.error('Registration step 2 failed:', err);
      res.status(500).json({ error: 'Step 2 validation failed' });
    }
  }
);

// POST /api/registration/step3 - Account Setup
router.post(
  '/step3',
  [
    body('username').isString().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
      // Check username availability in Keycloak (simplified check)
      // In production, you'd check against Keycloak admin API
      const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [username]);
      if (userCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Username already taken' });
      }

      // Store step 3 data
      req.session = req.session || {};
      req.session.registrationData = {
        ...req.session.registrationData,
        username,
        password,
        step3Complete: true
      };

      res.json({ message: 'Step 3 completed', nextStep: 4 });
    } catch (err) {
      logger.error('Registration step 3 failed:', err);
      res.status(500).json({ error: 'Step 3 validation failed' });
    }
  }
);

// POST /api/registration/complete - Final Step & Account Creation
router.post(
  '/complete',
  [
    body('role').isIn(['student', 'teacher', 'alumni']).withMessage('Valid role is required'),
    body('acceptTerms').isBoolean().equals(true).withMessage('Terms must be accepted'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role, acceptTerms } = req.body;

    try {
      req.session = req.session || {};
      const regData = req.session.registrationData;

      if (!regData || !regData.step1Complete || !regData.step2Complete || !regData.step3Complete) {
        return res.status(400).json({ error: 'Previous steps not completed' });
      }

      // Create user in Keycloak
      const keycloakUserId = await keycloakAdminClient.createUser({
        username: regData.username,
        email: regData.email,
        password: regData.password,
        school_id: regData.institutionId.toString(),
        user_type: role,
        firstName: regData.firstName,
        lastName: regData.lastName,
      });

      // Store user in PostgreSQL
      const userQuery = `
        INSERT INTO users (
          keycloak_id, email, first_name, last_name, role,
          school_id, phone_number, date_of_birth, is_active, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING id
      `;

      const userResult = await pool.query(userQuery, [
        keycloakUserId,
        regData.email,
        regData.firstName,
        regData.lastName,
        role,
        regData.institutionId,
        regData.phone,
        regData.dateOfBirth,
        false // User needs approval from school admin
      ]);

      // Clear registration session
      delete req.session.registrationData;

      logger.info(`User registered successfully: ${regData.email} with role: ${role}`);

      res.json({
        message: 'Registration completed successfully. Your account is pending approval from school administration.',
        userId: userResult.rows[0].id,
        status: 'pending_approval'
      });
    } catch (err) {
      logger.error('Registration completion failed:', err);
      res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  }
);

// GET /api/registration/status
router.get('/status', async (req, res) => {
  try {
    req.session = req.session || {};
    const regData = req.session.registrationData;

    if (!regData) {
      return res.json({ currentStep: 1, completed: false });
    }

    let currentStep = 1;
    if (regData.step1Complete) currentStep = 2;
    if (regData.step2Complete) currentStep = 3;
    if (regData.step3Complete) currentStep = 4;

    res.json({
      currentStep,
      completed: false,
      data: {
        firstName: regData.firstName,
        lastName: regData.lastName,
        email: regData.email,
        institutionName: regData.institutionName,
        username: regData.username
      }
    });
  } catch (err) {
    logger.error('Registration status check failed:', err);
    res.status(500).json({ error: 'Status check failed' });
  }
});

export default router;