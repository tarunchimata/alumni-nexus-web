import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface RequestMetrics {
  path: string;
  method: string;
  statusCode: number;
  responseTime: number;
  ip: string;
  userAgent: string;
  userId?: string;
  timestamp: Date;
}

// Request correlation ID middleware
export const correlationId = (req: Request, res: Response, next: NextFunction) => {
  const correlationId = req.headers['x-correlation-id'] as string || 
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  
  next();
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log request start
  logger.info('Request started', {
    correlationId: req.correlationId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id
  });

  // Override res.end to capture response
  const originalEnd = res.end;
  (res as any).end = function(chunk?: any, encoding?: any, cb?: any) {
    const responseTime = Date.now() - startTime;
    
    const metrics: RequestMetrics = {
      path: req.path,
      method: req.method,
      statusCode: res.statusCode,
      responseTime,
      ip: req.ip,
      userAgent: req.get('User-Agent') || 'unknown',
      userId: (req as any).user?.id,
      timestamp: new Date()
    };

    // Log response
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    logger[logLevel]('Request completed', {
      correlationId: req.correlationId,
      ...metrics
    });

    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Error logging middleware
export const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Request error', {
    correlationId: req.correlationId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: (req as any).user?.id,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  });

  next(error);
};

// Health check endpoint
export const healthCheck = (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  };

  res.json(health);
};

// Metrics collection middleware
export const metricsCollector = (req: Request, res: Response, next: NextFunction) => {
  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1e6; // Convert to milliseconds

    // Collect metrics (could be sent to Prometheus, etc.)
    const metrics = {
      http_requests_total: 1,
      http_request_duration_ms: duration,
      http_requests_by_status: { [res.statusCode]: 1 },
      http_requests_by_method: { [req.method]: 1 },
      http_requests_by_path: { [req.route?.path || req.path]: 1 }
    };

    // In a real implementation, you'd send these to a metrics collector
    if (duration > 1000) { // Log slow requests
      logger.warn('Slow request detected', {
        correlationId: req.correlationId,
        method: req.method,
        path: req.path,
        duration,
        statusCode: res.statusCode
      });
    }
  });

  next();
};

// Declare module to extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}