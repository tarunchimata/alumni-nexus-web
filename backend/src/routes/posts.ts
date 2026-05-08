import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Posts API is temporarily disabled while production stabilization continues.
// This endpoint is kept to preserve routing structure, but it currently returns 501.
router.use(authenticateToken);

router.get('/', async (req, res) => {
  logger.warn('Posts API is disabled in production stabilization mode');
  res.status(501).json({ error: 'Posts API is temporarily disabled' });
});

router.post('/', async (req, res) => {
  logger.warn('Posts API is disabled in production stabilization mode');
  res.status(501).json({ error: 'Posts API is temporarily disabled' });
});

export default router;
