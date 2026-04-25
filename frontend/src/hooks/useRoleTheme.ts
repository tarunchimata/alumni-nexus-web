import { useAuth } from './useAuth';

export const useRoleTheme = () => {
  const { user } = useAuth();

  const getRoleTheme = (role?: string) => {
    const themes = {
      platform_admin: {
        primary: 'platform-admin',
        secondary: 'platform-admin-secondary',
        gradient: 'from-platform-admin to-platform-admin-secondary',
        background: 'bg-gradient-to-br from-platform-admin/5 to-platform-admin-secondary/5',
        card: 'from-platform-admin/10 to-platform-admin-secondary/10',
        button: 'bg-platform-admin hover:bg-platform-admin-secondary',
        badge: 'bg-platform-admin text-white',
        icon: 'text-platform-admin'
      },
      school_admin: {
        primary: 'school-admin',
        secondary: 'school-admin-secondary', 
        gradient: 'from-school-admin to-school-admin-secondary',
        background: 'bg-gradient-to-br from-school-admin/5 to-school-admin-secondary/5',
        card: 'from-school-admin/10 to-school-admin-secondary/10',
        button: 'bg-school-admin hover:bg-school-admin-secondary',
        badge: 'bg-school-admin text-white',
        icon: 'text-school-admin'
      },
      teacher: {
        primary: 'teacher',
        secondary: 'teacher-secondary',
        gradient: 'from-teacher to-teacher-secondary',
        background: 'bg-gradient-to-br from-teacher/5 to-teacher-secondary/5',
        card: 'from-teacher/10 to-teacher-secondary/10',
        button: 'bg-teacher hover:bg-teacher-secondary',
        badge: 'bg-teacher text-white',
        icon: 'text-teacher'
      },
      alumni: {
        primary: 'alumni',
        secondary: 'alumni-secondary',
        gradient: 'from-alumni to-alumni-secondary',
        background: 'bg-gradient-to-br from-alumni/5 to-alumni-secondary/5',
        card: 'from-alumni/10 to-alumni-secondary/10',
        button: 'bg-alumni hover:bg-alumni-secondary',
        badge: 'bg-alumni text-white',
        icon: 'text-alumni'
      },
      student: {
        primary: 'student',
        secondary: 'student-secondary',
        gradient: 'from-student to-student-secondary',
        background: 'bg-gradient-to-br from-student/5 to-student-secondary/5',
        card: 'from-student/10 to-student-secondary/10',
        button: 'bg-student hover:bg-student-secondary',
        badge: 'bg-student text-white',
        icon: 'text-student'
      }
    };

    const defaultTheme = {
      primary: 'primary',
      secondary: 'primary-glow',
      gradient: 'from-primary to-primary-glow',
      background: 'bg-gradient-to-br from-primary/5 to-primary-glow/5',
      card: 'from-primary/10 to-primary-glow/10',
      button: 'bg-primary hover:bg-primary-glow',
      badge: 'bg-primary text-white',
      icon: 'text-primary'
    };

    return themes[role as keyof typeof themes] || defaultTheme;
  };

  const currentTheme = getRoleTheme(user?.role);

  return {
    theme: currentTheme,
    getRoleTheme,
    userRole: user?.role
  };
};