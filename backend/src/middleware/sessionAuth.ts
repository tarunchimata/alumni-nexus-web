import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface RegistrationSession {
  basicInfo?: {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
  };
  schoolInfo?: {
    institutionId: number;
    institutionName: string;
  };
  accountInfo?: {
    username: string;
    password: string;
  };
  roleInfo?: {
    role: string;
    termsAccepted: boolean;
  };
  currentStep: number;
  startTime: Date;
}

declare module 'express-session' {
  interface SessionData {
    registration?: RegistrationSession;
  }
}

export const initRegistrationSession = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.registration) {
    req.session.registration = {
      currentStep: 1,
      startTime: new Date()
    };
    logger.info('Registration session initialized');
  }
  next();
};

export const validateRegistrationStep = (requiredStep: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const session = req.session.registration;
    
    if (!session) {
      return res.status(400).json({ error: 'No registration session found' });
    }
    
    if (session.currentStep < requiredStep) {
      return res.status(400).json({ 
        error: `Must complete step ${requiredStep - 1} first`,
        currentStep: session.currentStep 
      });
    }
    
    next();
  };
};

export const cleanupRegistrationSession = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.registration) {
    delete req.session.registration;
    logger.info('Registration session cleaned up');
  }
  next();
};