import express, { Request, Response, Router } from 'express';
import { param } from 'express-validator';
import { logger } from '../utils/logger';
import { performDryRun, validateKeycloakConnectivity } from '../services/dryRunService';
import { handleValidationErrors } from '../middleware/security';

const router: Router = express.Router();

// POST /api/dry-run/:jobId - Perform dry run analysis
router.post('/:jobId', [
  param('jobId').isInt({ min: 1 }).withMessage('Valid job ID is required'),
  handleValidationErrors
], async (req: Request & { user?: { id?: string } }, res: Response) => {
  const jobId = parseInt(req.params.jobId);
  
  try {
    logger.info(`[DryRun API] Starting dry run for job ${jobId}`, {
      requestedBy: req.user?.id,
      ip: req.ip
    });

    const result = await performDryRun({
      filename: req.body.filename || `dryrun-${jobId}`,
      content: Array.isArray(req.body.content) ? req.body.content : []
    });
    
    res.json({
      success: true,
      data: result,
      message: 'Dry run completed successfully'
    });
  } catch (error: any) {
    logger.error(`[DryRun API] Failed for job ${jobId}:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Dry run failed'
    });
  }
});

// GET /api/dry-run/connectivity - Check Keycloak connectivity
router.get('/connectivity', async (req: Request, res: Response) => {
  try {
    const isConnected = await validateKeycloakConnectivity();
    
    res.json({
      success: true,
      data: {
        keycloakConnected: isConnected,
        timestamp: new Date().toISOString()
      },
      message: isConnected ? 'Keycloak is accessible' : 'Keycloak is not accessible'
    });
  } catch (error: any) {
    logger.error('[DryRun API] Connectivity check failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Connectivity check failed'
    });
  }
});

export default router;