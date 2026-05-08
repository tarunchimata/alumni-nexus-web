
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { verifyKeycloakToken } from '../utils/keycloak-jwt';

interface KeycloakToken {
  sub: string;
  email: string;
  given_name: string;
  family_name: string;
  realm_access: {
    roles: string[];
  };
  resource_access: {
    [key: string]: {
      roles: string[];
    };
  };
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
}

export const keycloakMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // Skip authentication for public endpoints
  const publicEndpoints = ['/auth/health', '/health'];
  if (publicEndpoints.some(endpoint => req.path.includes(endpoint))) {
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    const decoded = await verifyKeycloakToken(token) as KeycloakToken;
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Extract user information from token
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      firstName: decoded.given_name,
      lastName: decoded.family_name,
      roles: decoded.realm_access?.roles || [],
    };

    next();
  } catch (error) {
    logger.error('Token validation error:', error);
    return res.status(401).json({ error: 'Token validation failed' });
  }
};

export const requireRole = (requiredRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasRequiredRole = requiredRoles.some(role => 
      req.user!.roles.includes(role)
    );

    if (!hasRequiredRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};
