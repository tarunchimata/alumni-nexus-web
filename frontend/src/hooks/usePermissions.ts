import { useAuth } from '@/hooks/useAuth';

export const usePermissions = () => {
  const { user } = useAuth();

  const canApproveSchools = () => {
    return user?.role === 'platform_admin' || user?.role === 'school_admin';
  };

  const canCreateSchools = () => {
    return user?.role === 'platform_admin' || user?.role === 'school_admin' || user?.role === 'teacher';
  };

  const canEditSchools = () => {
    return user?.role === 'platform_admin' || user?.role === 'school_admin';
  };

  const canDeleteSchools = () => {
    return user?.role === 'platform_admin';
  };

  const canViewSchools = () => {
    return !!user; // All authenticated users can view
  };

  const isPlatformAdmin = () => {
    return user?.role === 'platform_admin';
  };

  const isSchoolAdmin = () => {
    return user?.role === 'school_admin';
  };

  const isTeacher = () => {
    return user?.role === 'teacher';
  };

  const isStudent = () => {
    return user?.role === 'student';
  };

  const isAlumni = () => {
    return user?.role === 'alumni';
  };

  return {
    canApproveSchools,
    canCreateSchools,
    canEditSchools,
    canDeleteSchools,
    canViewSchools,
    isPlatformAdmin,
    isSchoolAdmin,
    isTeacher,
    isStudent,
    isAlumni,
    userRole: user?.role
  };
};