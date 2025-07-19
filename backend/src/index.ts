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

// Log successful import of routes
logger.info('Routes imported successfully', {
  auth: typeof authRoutes,
  oauth2: typeof oauth2Routes,
  schools: typeof schoolRoutes
});

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

logger.info('OAuth2 environment variables validated successfully', {
  keycloakUrl: process.env.KEYCLOAK_URL,
  keycloakRealm: process.env.KEYCLOAK_REALM,
  keycloakClientId: process.env.KEYCLOAK_FRONTEND_CLIENT_ID
});

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
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or is a Lovable preview domain
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

// Session management for registration flow
app.use(session({
  secret: process.env.SESSION_SECRET || 'my-school-buddies-registration-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.COOKIE_SECURE === 'true',
    httpOnly: true,
    maxAge: 30 * 60 * 1000 // 30 minutes for registration flow
  }
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Ensure all API responses are JSON with proper content-type
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// CSRF protection for auth routes (skip for OAuth2 routes)
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
  },
  ignoreMethods: process.env.USE_OAUTH2 === 'true' ? ['GET', 'HEAD', 'OPTIONS', 'POST'] : ['GET', 'HEAD', 'OPTIONS'],
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
    version: '1.0.0',
    roles: ['platform_admin', 'school_admin', 'teacher', 'student', 'alumni'],
    oauth2: {
      keycloakUrl: process.env.KEYCLOAK_URL,
      realm: process.env.KEYCLOAK_REALM,
      clientId: process.env.KEYCLOAK_FRONTEND_CLIENT_ID,
      configured: !!(process.env.KEYCLOAK_URL && process.env.KEYCLOAK_REALM && process.env.KEYCLOAK_FRONTEND_CLIENT_ID)
    }
  });
});

// Test endpoint to verify backend is running and returning JSON
app.get('/api/test', (req, res) => {
  logger.info('Test endpoint requested');
  res.setHeader('Content-Type', 'application/json');
  res.json({ 
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    oauth2Config: {
      enabled: process.env.USE_OAUTH2 === 'true',
      keycloakUrl: process.env.KEYCLOAK_URL,
      realm: process.env.KEYCLOAK_REALM,
      clientId: process.env.KEYCLOAK_FRONTEND_CLIENT_ID
    }
  });
});

// API Routes with middleware
app.use('/api/auth', authLimiter, csrfProtection, authRoutes);
app.use('/api/oauth2', oauth2Routes); // OAuth2 routes without CSRF protection
app.use('/api/schools', schoolRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/institutions', institutionsRoutes);
app.use('/api/registration', authLimiter, registrationRoutes);

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

    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Test endpoint: http://localhost:${PORT}/api/test`);
      logger.info(`OAuth2 token endpoint: http://localhost:${PORT}/api/oauth2/token`);
      logger.info('Role-based authorization enabled');
      logger.info('OAuth2 configuration validated and ready');
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
