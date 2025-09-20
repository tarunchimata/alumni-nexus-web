
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
import oauth2Routes from './routes/oauth2';
import schoolRoutes from './routes/schools';
import postRoutes from './routes/posts';
import institutionsRoutes from './routes/institutions';
import registrationRoutes from './routes/registration';
import dashboardRoutes from './routes/dashboards';
import csvRoutes from './routes/csv';
import strictCsvRoutes from './routes/strictCsv';
import dashboardRouter from './routes/dashboard';
import analyticsRoutes from './routes/analytics';
import userRoutes from './routes/users';

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
const PORT = process.env.PORT || 3033;

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
  'http://localhost:3033',
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
app.use(cookieParser() as any);

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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

// Skip CSRF for API endpoints that need to work without CSRF token
const skipCSRF = (req: any, res: any, next: any) => {
  const skipPaths = ['/api/csv', '/api/oauth2', '/api/registration', '/api/health', '/health'];
  if (skipPaths.some(path => req.path.startsWith(path))) {
    return next();
  }
  return csrfProtection(req, res, next);
};

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

// CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    res.json({ csrfToken: req.csrfToken() });
  } catch (error) {
    logger.error('Failed to generate CSRF token:', error);
    res.status(500).json({ error: 'Failed to generate CSRF token' });
  }
});

// Enhanced health check endpoint
app.get('/health', async (req, res) => {
  try {
    logger.info('Health check requested');
    
    // Check database connection
    const dbStatus = await checkDatabaseConnection();
    
    const healthData = {
      status: dbStatus ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'My School Buddies Backend',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus ? 'connected' : 'disconnected',
        url: process.env.DATABASE_URL ? '***configured***' : 'not configured'
      },
      keycloak: {
        url: process.env.KEYCLOAK_URL || 'not configured',
        realm: process.env.KEYCLOAK_REALM || 'not configured',
        configured: !!(process.env.KEYCLOAK_URL && process.env.KEYCLOAK_REALM && process.env.KEYCLOAK_FRONTEND_CLIENT_ID)
      },
      features: {
        multiStepRegistration: true,
        institutionSearch: true,
        roleBasedAuth: true,
        keycloakTheme: true,
        oauth2Integration: true
      }
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.status(dbStatus ? 200 : 503).json(healthData);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'My School Buddies Backend',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Readiness check endpoint
app.get('/ready', async (req, res) => {
  try {
    const dbStatus = await checkDatabaseConnection();
    
    if (dbStatus) {
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        message: 'Service is ready to accept requests'
      });
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        message: 'Service is not ready - database connection failed'
      });
    }
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Database connection check function
async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1 as health_check`;
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
}

// API health endpoint
app.get('/api/health', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({ status: 'ok' });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  logger.info('Test endpoint requested');
  res.setHeader('Content-Type', 'application/json');
  const version = (() => { try { return require('../package.json').version; } catch { return 'unknown'; } })();
  res.json({ 
    status: 'ok',
    version,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Backend version/commit endpoint
app.get('/api/version', (req, res) => {
  const version = (() => { try { return require('../package.json').version; } catch { return 'unknown'; } })();
  const commitSha = process.env.COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT || 'unknown';
  const buildTime = process.env.BUILD_TIME || 'unknown';
  res.json({ version, commitSha, buildTime, node: process.version });
});

// API Routes with proper middleware
app.use('/api/oauth2', oauth2Routes); // OAuth2 routes without CSRF
app.use('/api/schools', skipCSRF, schoolRoutes);
app.use('/api/posts', skipCSRF, postRoutes);
app.use('/api/institutions', searchLimiter, skipCSRF, institutionsRoutes);
app.use('/api/registration', registrationRoutes); // No CSRF for registration
app.use('/api/dashboards', skipCSRF, dashboardRoutes); // Legacy dashboard routes
app.use('/api/dashboard', skipCSRF, dashboardRouter); // Real dashboard data routes
app.use('/api/csv', csvRoutes); // CSV import routes - no CSRF
app.use('/api/csv-strict', skipCSRF, strictCsvRoutes); // Keycloak-first CSV routes - no CSRF
app.use('/api/analytics', skipCSRF, analyticsRoutes); // Analytics routes
app.use('/api/users', skipCSRF, userRoutes); // User management routes

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

    // Verify schools table exists
    const schoolCount = await prisma.school.count();
    logger.info(`Found ${schoolCount} schools in database`);

    const server = app.listen(PORT, () => {
      logger.info(`🚀 My School Buddies Backend v2.0 running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Multi-step registration enabled`);
      logger.info(`Institution search API ready`);
      logger.info('OAuth2 + Keycloak integration active');
      logger.info('Real-time Socket.IO enabled');
    });

    // Initialize Socket.IO
    const socketModule = await import('./socket/socketServer');
    const socketServerInstance = new socketModule.SocketServer(server);
    socketModule.socketServer = socketServerInstance;
    logger.info('Socket.IO server initialized');

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
