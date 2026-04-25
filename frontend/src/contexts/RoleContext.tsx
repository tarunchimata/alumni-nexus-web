
import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface RoleContextType {
  hasRole: (role: string | string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  isAdmin: boolean;
  isSchoolAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isAlumni: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

// Role hierarchy and permissions (should match backend)
const ROLE_PERMISSIONS: Record<string, string[]> = {
  platform_admin: ['*'],
  school_admin: ['school:read', 'school:write', 'user:read', 'user:write', 'class:read', 'class:write', 'message:read', 'message:write'],
  teacher: ['class:read', 'class:write', 'message:read', 'message:write', 'student:read'],
  alumni: ['message:read', 'message:write', 'profile:read', 'profile:write'],
  student: ['class:read', 'message:read', 'message:write', 'profile:read', 'profile:write'],
};

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;
    
    const roles = Array.isArray(role) ? role : [role];
    return roles.some(r => user.role === r);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Platform admin has all permissions
    if (user.role === 'platform_admin') return true;
    
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  };

  const hasAnyRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const value: RoleContextType = {
    hasRole,
    hasPermission,
    hasAnyRole,
    isAdmin: user?.role === 'platform_admin',
    isSchoolAdmin: user?.role === 'school_admin',
    isTeacher: user?.role === 'teacher',
    isStudent: user?.role === 'student',
    isAlumni: user?.role === 'alumni',
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
