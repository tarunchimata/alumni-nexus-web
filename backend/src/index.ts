
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';
import session from 'express-session';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth';
import oauth2Routes from './routes/oauth2';
import schoolRoutes from './routes/schools';
import postRoutes from './routes/posts';
import institutionsRoutes from './routes/institutions';
import registrationRoutes from './routes/registration';

// Load environment variables
dotenv.config();

// Validate required OAuth2 environment variables
const requiredOAuth2Vars = [
  'KEYCLOAK_URL',
  'KEYCLOAK_REALM',
  'KEYCLOAK_FRONTEND_CLIENT_ID'
];

const missingVars = requiredOAuth2Vars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  logger.error(`Missing required OAuth2 environment variables: ${missingVars.join(', ')}`);
  logger.error('Please check your .env file and ensure all OAuth2 variables are configured');
  process.exit(1);
}

logger.info('OAuth2 environment variables validated successfully');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Prisma Client
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8080',
  ...(process.env.CORS_ORIGIN?.split(',') || [])
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || /\.lovable\.app$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Cookie parser
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Enhanced session management for registration flow
app.use(session({
  secret: process.env.SESSION_SECRET || 'my-school-buddies-registration-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.COOKIE_SECURE === 'true',
    httpOnly: true,
    maxAge: 45 * 60 * 1000, // 45 minutes for registration flow
    sameSite: 'lax'
  },
  rolling: true // Reset expiry on each request
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Ensure all API responses are JSON with proper content-type
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// CSRF protection (skip for OAuth2 routes and registration init)
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
});

// Registration-specific rate limiting
const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 registration attempts per 15 minutes
  message: 'Too many registration attempts, please try again later.',
  keyGenerator: (req) => req.ip + ':registration',
});

// Institution search rate limiting
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: 'Too many search requests, please slow down.',
});

// Auth-specific rate limiting
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 attempts per minute
  message: 'Too many authentication attempts, please try again later.',
});

// Health check endpoint
app.get('/health', (req, res) => {
  logger.info('Health check requested');
  res.setHeader('Content-Type', 'application/json');
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '2.0.0',
    features: {
      multiStepRegistration: true,
      institutionSearch: true,
      roleBasedAuth: true,
      keycloakTheme: true
    },
    oauth2: {
      keycloakUrl: process.env.KEYCLOAK_URL,
      realm: process.env.KEYCLOAK_REALM,
      clientId: process.env.KEYCLOAK_FRONTEND_CLIENT_ID,
      configured: !!(process.env.KEYCLOAK_URL && process.env.KEYCLOAK_REALM && process.env.KEYCLOAK_FRONTEND_CLIENT_ID)
    }
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  logger.info('Test endpoint requested');
  res.setHeader('Content-Type', 'application/json');
  res.json({ 
    message: 'My School Buddies Backend v2.0 - Multi-Step Registration Ready',
    timestamp: new Date().toISOString(),
    sessionId: req.sessionID,
    features: ['registration', 'institutions', 'auth', 'oauth2']
  });
});

// API Routes with proper middleware
app.use('/api/auth', authLimiter, csrfProtection, authRoutes);
app.use('/api/oauth2', oauth2Routes); // OAuth2 routes without CSRF
app.use('/api/schools', schoolRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/institutions', searchLimiter, institutionsRoutes);
app.use('/api/registration', registrationLimiter, registrationRoutes); // No CSRF for registration init

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Connected to PostgreSQL database');

    // Verify institutions table exists
    const institutionCount = await prisma.institutions.count();
    logger.info(`Found ${institutionCount} institutions in database`);

    app.listen(PORT, () => {
      logger.info(`🚀 My School Buddies Backend v2.0 running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Multi-step registration enabled`);
      logger.info(`Institution search API ready`);
      logger.info('OAuth2 + Keycloak integration active');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
