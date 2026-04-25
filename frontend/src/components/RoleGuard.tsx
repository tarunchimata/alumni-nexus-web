
import { ReactNode } from 'react';
import { useRole } from '@/contexts/RoleContext';

interface RoleGuardProps {
  children: ReactNode;
  requiredRole?: string | string[];
  requiredPermission?: string;
  fallback?: ReactNode;
  requireAll?: boolean; // If true, user must have ALL roles/permissions
}

const RoleGuard = ({ 
  children, 
  requiredRole, 
  requiredPermission, 
  fallback = null,
  requireAll = false 
}: RoleGuardProps) => {
  const { hasRole, hasPermission } = useRole();

  // Check role requirements
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    if (requireAll) {
      // User must have ALL roles
      if (!roles.every(role => hasRole(role))) {
        return <>{fallback}</>;
      }
    } else {
      // User must have at least ONE role
      if (!hasRole(requiredRole)) {
        return <>{fallback}</>;
      }
    }
  }

  // Check permission requirements
  if (requiredPermission) {
    if (!hasPermission(requiredPermission)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

export default RoleGuard;
