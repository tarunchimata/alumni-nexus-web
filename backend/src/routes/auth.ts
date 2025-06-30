
import express from 'express';
import { body, validationResult } from 'express-validator';
import { keycloakAdminClient } from '../services/keycloakAdmin';
import {
  loginUser,
  refreshToken,
  revokeToken,
} from '../services/keycloakAuth';
import { sessionAuth } from '../middleware/sessionAuth';
import { logger } from '../utils/logger';

const router = express.Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('username').isString().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('school_id').isString().withMessage('School ID is required'),
    body('user_type').isIn(['platform_admin', 'school_admin', 'teacher', 'student', 'alumni']).withMessage('Valid user type is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, school_id, user_type } = req.body;

    try {
      const userId = await keycloakAdminClient.createUser({
        username,
        email,
        password,
        school_id,
        user_type,
      });

      // Auto-login after registration
      const tokens = await loginUser(username, password);

      res
        .cookie('access_token', tokens.access_token, {
          httpOnly: true,
          secure: process.env.COOKIE_SECURE === 'true',
          sameSite: 'lax',
          maxAge: 5 * 60 * 1000, // 5 minutes
          domain: process.env.COOKIE_DOMAIN,
        })
        .cookie('refresh_token', tokens.refresh_token, {
          httpOnly: true,
          secure: process.env.COOKIE_SECURE === 'true',
          sameSite: 'lax',
          maxAge: 2 * 60 * 60 * 1000, // 2 hours
          domain: process.env.COOKIE_DOMAIN,
        })
        .json({ 
          message: 'User registered and logged in',
          user: { id: userId, username, email, user_type }
        });

      logger.info(`User registered: ${username}`);
    } catch (err) {
      logger.error('Registration failed:', err);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('username').isString().withMessage('Username is required'),
    body('password').isString().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    try {
      const tokens = await loginUser(username, password);

      res
        .cookie('access_token', tokens.access_token, {
          httpOnly: true,
          secure: process.env.COOKIE_SECURE === 'true',
          sameSite: 'lax',
          maxAge: 5 * 60 * 1000, // 5 minutes
          domain: process.env.COOKIE_DOMAIN,
        })
        .cookie('refresh_token', tokens.refresh_token, {
          httpOnly: true,
          secure: process.env.COOKIE_SECURE === 'true',
          sameSite: 'lax',
          maxAge: 2 * 60 * 60 * 1000, // 2 hours
          domain: process.env.COOKIE_DOMAIN,
        })
        .json({ message: 'Logged in successfully' });

      logger.info(`User logged in: ${username}`);
    } catch (err) {
      logger.error('Login failed:', err);
      res.status(401).json({ error: 'Invalid credentials' });
    }
  }
);

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  try {
    if (req.cookies.refresh_token) {
      await revokeToken(req.cookies.refresh_token);
    }
  } catch (err) {
    logger.error('Logout error:', err);
  }

  res
    .clearCookie('access_token', {
      domain: process.env.COOKIE_DOMAIN,
    })
    .clearCookie('refresh_token', {
      domain: process.env.COOKIE_DOMAIN,
    })
    .json({ message: 'Logged out successfully' });
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const refreshTokenValue = req.cookies.refresh_token;

  if (!refreshTokenValue) {
    return res.status(401).json({ error: 'No refresh token' });
  }

  try {
    const tokens = await refreshToken(refreshTokenValue);

    res
      .cookie('access_token', tokens.access_token, {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === 'true',
        sameSite: 'lax',
        maxAge: 5 * 60 * 1000, // 5 minutes
        domain: process.env.COOKIE_DOMAIN,
      })
      .json({ message: 'Token refreshed successfully' });
  } catch (err) {
    logger.error('Token refresh failed:', err);
    res.status(401).json({ error: 'Token refresh failed' });
  }
});

// GET /api/auth/profile
router.get('/profile', sessionAuth, async (req, res) => {
  try {
    const profile = await keycloakAdminClient.getUserProfile(req.cookies.access_token);
    res.json(profile);
  } catch (err) {
    logger.error('Profile fetch failed:', err);
    res.status(401).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
