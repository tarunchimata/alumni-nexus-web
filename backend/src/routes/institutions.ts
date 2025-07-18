import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';
import pool from '../db/connection';

const router = express.Router();

// GET /api/institutions/search?q={query}
router.get(
  '/search',
  [
    query('q').isString().isLength({ min: 1 }).withMessage('Search query is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { q } = req.query;
    const searchTerm = `%${q}%`;

    try {
      const query = `
        SELECT 
          id,
          institution_name,
          city,
          state,
          udise_code,
          institution_category,
          management_type
        FROM institutions 
        WHERE 
          status = 'Active' AND (
            LOWER(institution_name) LIKE LOWER($1) OR
            LOWER(city) LIKE LOWER($1) OR
            LOWER(udise_code) LIKE LOWER($1)
          )
        ORDER BY 
          CASE 
            WHEN LOWER(institution_name) LIKE LOWER($2) THEN 1
            WHEN LOWER(institution_name) LIKE LOWER($1) THEN 2
            ELSE 3
          END,
          institution_name
        LIMIT 20
      `;

      const exactSearchTerm = `${q}%`;
      const result = await pool.query(query, [searchTerm, exactSearchTerm]);

      res.json(result.rows);
    } catch (err) {
      logger.error('Institution search failed:', err);
      res.status(500).json({ error: 'Search failed' });
    }
  }
);

// POST /api/institutions/request
router.post(
  '/request',
  [
    body('institution_name').isString().isLength({ min: 2 }).withMessage('Institution name is required'),
    body('city').isString().isLength({ min: 2 }).withMessage('City is required'),
    body('state').isString().isLength({ min: 2 }).withMessage('State is required'),
    body('requester_email').isEmail().withMessage('Valid email is required'),
    body('requester_name').isString().isLength({ min: 2 }).withMessage('Requester name is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { institution_name, city, state, requester_email, requester_name, udise_code } = req.body;

    try {
      // Check if institution already exists
      const existingQuery = `
        SELECT id FROM institutions 
        WHERE LOWER(institution_name) = LOWER($1) AND LOWER(city) = LOWER($2)
      `;
      const existing = await pool.query(existingQuery, [institution_name, city]);

      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Institution already exists in our database' });
      }

      // Insert request into pending table (we'll create this table)
      const insertQuery = `
        INSERT INTO institution_requests (
          institution_name, city, state, udise_code,
          requester_email, requester_name, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
        RETURNING id
      `;

      const result = await pool.query(insertQuery, [
        institution_name, city, state, udise_code, requester_email, requester_name
      ]);

      logger.info(`Institution request created: ${institution_name} by ${requester_email}`);

      res.json({ 
        message: 'Institution request submitted successfully. We will review and add it to our database.',
        request_id: result.rows[0].id
      });
    } catch (err) {
      logger.error('Institution request failed:', err);
      res.status(500).json({ error: 'Request submission failed' });
    }
  }
);

// GET /api/institutions/requests - For platform admins
router.get('/requests', authenticateToken, async (req: any, res) => {
  try {
    // Check if user is platform admin
    if (!req.user.roles.includes('platform_admin')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const query = `
      SELECT 
        id, institution_name, city, state, udise_code,
        requester_email, requester_name, status, created_at
      FROM institution_requests 
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    logger.error('Failed to fetch institution requests:', err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

export default router;