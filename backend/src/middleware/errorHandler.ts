
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Ensure all error responses are JSON
  res.setHeader('Content-Type', 'application/json');
  
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
  });

  // Prisma errors
  if (error.code === 'P2002') {
    return res.status(409).json({
      error: 'Duplicate entry',
      message: 'A record with this information already exists',
    });
  }

  if (error.code === 'P2025') {
    return res.status(404).json({
      error: 'Record not found',
      message: 'The requested record was not found',
    });
  }

  // Validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      message: error.message,
    });
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;

  res.status(statusCode).json({
    error: 'Server error',
    message,
  });
};
