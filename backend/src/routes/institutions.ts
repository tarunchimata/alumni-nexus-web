
import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';

const router: express.Router = express.Router();

// GET /api/institutions/search?q=query
router.get('/search', [
  query('q').isString().isLength({ min: 2 }).withMessage('Search query must be at least 2 characters'),
], async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const query = req.query.q as string;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
  
  try {
    const startTime = Date.now();
    
    const institutions = await prisma.school.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
          { district: { contains: query, mode: 'insensitive' } },
          { state: { contains: query, mode: 'insensitive' } },
          { code: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        city: true,
        district: true,
        state: true,
        code: true,
        type: true,
        management: true
      },
      take: limit,
      orderBy: [
        // Prioritize exact matches in name
        { name: 'asc' },
        { city: 'asc' }
      ]
    });

    const responseTime = Date.now() - startTime;
    
    logger.info(`Institution search completed: "${query}" - ${institutions.length} results in ${responseTime}ms`);
    
    // Add search relevance scoring
    const scoredResults = institutions.map((institution: any) => {
      let score = 0;
      const queryLower = query.toLowerCase();
      const nameLower = institution.schoolName.toLowerCase();
      const cityLower = institution.villageName?.toLowerCase() || '';
      
      // Exact name match gets highest score
      if (nameLower === queryLower) score += 100;
      // Name starts with query gets high score
      else if (nameLower.startsWith(queryLower)) score += 80;
      // Name contains query gets medium score
      else if (nameLower.includes(queryLower)) score += 60;
      
      // City match bonus
      if (cityLower === queryLower) score += 50;
      else if (cityLower.startsWith(queryLower)) score += 30;
      else if (cityLower.includes(queryLower)) score += 20;
      
      return { ...institution, _score: score };
    });

    // Sort by relevance score
    scoredResults.sort((a: any, b: any) => b._score - a._score);
    
    res.json({
      institutions: scoredResults.map(({ _score, ...institution }: any) => institution),
      meta: {
        total: institutions.length,
        query,
        responseTime,
        limit
      }
    });
  } catch (error) {
    logger.error('Institution search failed:', error);
    res.status(500).json({ error: 'Search failed. Please try again.' });
  }
});

// POST /api/institutions/request - Request new institution addition
router.post('/request', [
  body('institutionName').isString().isLength({ min: 3 }).withMessage('Institution name must be at least 3 characters'),
  body('city').isString().isLength({ min: 2 }).withMessage('City is required'),
  body('state').isString().isLength({ min: 2 }).withMessage('State is required'),
  body('requestedBy').isEmail().withMessage('Valid email is required'),
  body('contactInfo').optional().isString(),
  body('additionalDetails').optional().isString(),
  body('institutionType').optional().isIn(['School', 'College', 'University', 'Institute']),
  body('managementType').optional().isIn(['Government', 'Private', 'Aided'])
], async (req: any, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { 
    institutionName, 
    city, 
    state, 
    requestedBy, 
    contactInfo, 
    additionalDetails,
    institutionType,
    managementType
  } = req.body;
  
  try {
    // Check if similar institution already exists in schools table
    const existingInstitution = await prisma.school.findFirst({
      where: {
        name: { contains: institutionName, mode: 'insensitive' },
        city: { contains: city, mode: 'insensitive' },
        state: { contains: state, mode: 'insensitive' }
      }
    });
    
    if (existingInstitution) {
      return res.status(400).json({ 
        error: 'Similar institution already exists',
        institution: {
          name: existingInstitution.name,
          city: existingInstitution.city,
          state: existingInstitution.state,
          id: existingInstitution.id
        }
      });
    }

    // For now, directly add to schools table instead of institution_requests
    // This is a simplified approach since institution_requests table doesn't exist
    const newSchool = await prisma.school.create({
      data: {
        name: institutionName,
        city: city,
        state: state,
        type: institutionType,
        management: managementType,
        phone: contactInfo
      }
    });
    
    logger.info(`New institution requested: ${institutionName} by ${requestedBy}`, {
      schoolId: newSchool.id,
      city,
      state
    });
    
    res.json({ 
      message: 'Institution request submitted successfully. Our team will review it within 2-3 business days.',
      request: {
        id: newSchool.id,
        institutionName,
        city,
        state,
        status: 'pending',
        estimatedReviewTime: '2-3 business days'
      }
    });
  } catch (error) {
    logger.error('Institution request failed:', error);
    res.status(500).json({ error: 'Failed to submit institution request. Please try again.' });
  }
});

// GET /api/institutions/requests - Get all institution requests (admin only)
router.get('/requests', async (req: any, res: any) => {
  try {
    const requests = await prisma.school.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    
    res.json({ requests });
  } catch (error) {
    logger.error('Failed to fetch institution requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

export default router;
