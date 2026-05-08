
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { keycloakAdminClient } from '../services/keycloakAdmin';
import { verifyKeycloakToken } from '../utils/keycloak-jwt';
import { AuthenticatedUser, hasPermission, hasAnyRole, hasHigherRole, ROLE_HIERARCHY } from '../types/auth';

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const useOAuth2 = process.env.USE_OAUTH2 === 'true';
    let accessToken: string | undefined;
    let decoded: any;

    if (useOAuth2) {
      // OAuth2 Bearer token authentication
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7);
      }

      if (!accessToken) {
        return res.status(401).json({ error: 'No access token provided' });
      }

      // Verify JWT token with Keycloak
      try {
        decoded = await verifyKeycloakToken(accessToken);
      } catch (error) {
        logger.error('Keycloak token verification failed:', error);
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
    } else {
      // Fallback to cookie-based authentication
      accessToken = req.cookies.access_token;

      if (!accessToken) {
        return res.status(401).json({ error: 'No access token provided' });
      }

      // Verify token with Keycloak (even for cookie-based auth)
      try {
        decoded = await verifyKeycloakToken(accessToken);
      } catch (error) {
        logger.error('Keycloak token verification failed:', error);
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
    }

    // Extract roles and permissions
    const roles = decoded.realm_access?.roles || [];
    const permissions = roles.flatMap((roleName: string) => {
      const role = ROLE_HIERARCHY[roleName];
      return role ? role.permissions : [];
    });

    // Set authenticated user
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      firstName: decoded.given_name,
      lastName: decoded.family_name,
      roles,
      permissions,
      schoolId: decoded.school_id,
    };

    next();
  } catch (error) {
    logger.error('Token authentication failed:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

export const requireRole = (requiredRoles: string | string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    if (!hasAnyRole(req.user.roles, roles)) {
      logger.warn(`Access denied for user ${req.user.id}. Required roles: ${roles.join(', ')}, User roles: ${req.user.roles.join(', ')}`);
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.roles 
      });
    }

    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!hasPermission(req.user.roles, permission)) {
      logger.warn(`Access denied for user ${req.user.id}. Required permission: ${permission}, User roles: ${req.user.roles.join(', ')}`);
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission,
        current: req.user.roles 
      });
    }

    next();
  };
};

export const requireMinimumRole = (minimumRole: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!hasHigherRole(req.user.roles, minimumRole)) {
      logger.warn(`Access denied for user ${req.user.id}. Minimum role: ${minimumRole}, User roles: ${req.user.roles.join(', ')}`);
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        minimumRole,
        current: req.user.roles 
      });
    }

    next();
  };
};

// Middleware to check if user can access school-specific resources
export const requireSchoolAccess = (schoolIdParam: string = 'schoolId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const requestedSchoolId = req.params[schoolIdParam];
    
    // Platform admins can access any school
    if (req.user.roles.includes('platform_admin')) {
      return next();
    }

    // School admins and teachers can only access their own school
    if (!req.user.schoolId || req.user.schoolId !== requestedSchoolId) {
      return res.status(403).json({ 
        error: 'Access denied to this school',
        userSchool: req.user.schoolId,
        requestedSchool: requestedSchoolId
      });
    }

    next();
  };
};
