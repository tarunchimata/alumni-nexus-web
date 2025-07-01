
export interface UserRole {
  name: string;
  permissions: string[];
  hierarchy: number; // Higher number = more permissions
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  schoolId?: string;
  permissions: string[];
}

export const ROLE_HIERARCHY: Record<string, UserRole> = {
  platform_admin: {
    name: 'platform_admin',
    permissions: ['*'], // All permissions
    hierarchy: 100,
  },
  school_admin: {
    name: 'school_admin',
    permissions: [
      'school:read',
      'school:write',
      'user:read',
      'user:write',
      'class:read',
      'class:write',
      'message:read',
      'message:write',
    ],
    hierarchy: 80,
  },
  teacher: {
    name: 'teacher',
    permissions: [
      'class:read',
      'class:write',
      'message:read',
      'message:write',
      'student:read',
    ],
    hierarchy: 60,
  },
  alumni: {
    name: 'alumni',
    permissions: [
      'message:read',
      'message:write',
      'profile:read',
      'profile:write',
    ],
    hierarchy: 40,
  },
  student: {
    name: 'student',
    permissions: [
      'class:read',
      'message:read',
      'message:write',
      'profile:read',
      'profile:write',
    ],
    hierarchy: 20,
  },
};

export const hasPermission = (userRoles: string[], requiredPermission: string): boolean => {
  // Check if user has platform_admin role (all permissions)
  if (userRoles.includes('platform_admin')) {
    return true;
  }

  // Check specific permissions
  for (const roleName of userRoles) {
    const role = ROLE_HIERARCHY[roleName];
    if (role && (role.permissions.includes('*') || role.permissions.includes(requiredPermission))) {
      return true;
    }
  }

  return false;
};

export const hasAnyRole = (userRoles: string[], requiredRoles: string[]): boolean => {
  return requiredRoles.some(role => userRoles.includes(role));
};

export const hasHigherRole = (userRoles: string[], minimumRole: string): boolean => {
  const minimumHierarchy = ROLE_HIERARCHY[minimumRole]?.hierarchy || 0;
  
  return userRoles.some(roleName => {
    const role = ROLE_HIERARCHY[roleName];
    return role && role.hierarchy >= minimumHierarchy;
  });
};
