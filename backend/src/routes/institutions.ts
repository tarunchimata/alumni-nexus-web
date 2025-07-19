import express from 'express';
import { body, validationResult } from 'express-validator';
import { logger } from '../utils/logger';
import { prisma } from '../index';

const router = express.Router();

// GET /api/institutions/search?q=query
router.get('/search', async (req, res) => {
  const query = req.query.q as string;
  
  if (!query || query.length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters' });
  }
  
  try {
    const institutions = await prisma.institutions.findMany({
      where: {
        OR: [
          { institution_name: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
          { district: { contains: query, mode: 'insensitive' } },
          { state: { contains: query, mode: 'insensitive' } },
          { udise_code: { contains: query, mode: 'insensitive' } }
        ],
        status: 'Active'
      },
      select: {
        id: true,
        institution_name: true,
        city: true,
        district: true,
        state: true,
        udise_code: true,
        institution_type: true
      },
      take: 20,
      orderBy: [
        { institution_name: 'asc' }
      ]
    });
    
    logger.info(`Institution search completed: ${query} - ${institutions.length} results`);
    
    res.json(institutions);
  } catch (error) {
    logger.error('Institution search failed:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// POST /api/institutions/request - Request new institution addition
router.post('/request', [
  body('institutionName').isString().isLength({ min: 3 }).withMessage('Institution name must be at least 3 characters'),
  body('city').isString().withMessage('City is required'),
  body('state').isString().withMessage('State is required'),
  body('requestedBy').isEmail().withMessage('Valid email is required'),
  body('contactInfo').optional().isString(),
  body('additionalDetails').optional().isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { institutionName, city, state, requestedBy, contactInfo, additionalDetails } = req.body;
  
  try {
    // Check if institution already exists
    const existingInstitution = await prisma.institutions.findFirst({
      where: {
        institution_name: { contains: institutionName, mode: 'insensitive' },
        city: { contains: city, mode: 'insensitive' },
        state: { contains: state, mode: 'insensitive' }
      }
    });
    
    if (existingInstitution) {
      return res.status(400).json({ 
        error: 'Similar institution already exists',
        institution: {
          name: existingInstitution.institution_name,
          city: existingInstitution.city,
          state: existingInstitution.state
        }
      });
    }
    
    // Create institution request
    const institutionRequest = await prisma.institution_requests.create({
      data: {
        institution_name: institutionName,
        city,
        state,
        requested_by: requestedBy,
        contact_info: contactInfo,
        additional_details: additionalDetails,
        status: 'pending'
      }
    });
    
    logger.info(`New institution requested: ${institutionName} by ${requestedBy}`);
    
    // TODO: Send notification to platform admins
    
    res.json({ 
      message: 'Institution request submitted successfully',
      requestId: institutionRequest.id,
      status: 'pending'
    });
  } catch (error) {
    logger.error('Institution request failed:', error);
    res.status(500).json({ error: 'Failed to submit institution request' });
  }
});

// Additional endpoints for platform admins would go here

export default router;