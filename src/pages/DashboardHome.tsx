import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import StudentDashboard from '@/components/dashboards/StudentDashboard';
import TeacherDashboard from '@/components/dashboards/TeacherDashboard';
import AlumniDashboard from '@/components/dashboards/AlumniDashboard';
import SchoolAdminDashboard from '@/components/dashboards/SchoolAdminDashboard';
import PlatformAdminDashboard from '@/components/dashboards/PlatformAdminDashboard';

export const DashboardHome = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please log in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  // Route to appropriate dashboard based on user role
  const renderDashboard = () => {
    switch (user.role?.toLowerCase()) {
      case 'student':
        return <StudentDashboard />;
      case 'teacher':
        return <TeacherDashboard />;
      case 'alumni':
        return <AlumniDashboard />;
      case 'school_admin':
      case 'schooladmin':
        return <SchoolAdminDashboard />;
      case 'platform_admin':
      case 'platformadmin':
      case 'admin':
        return <PlatformAdminDashboard />;
      default:
        return (
          <div className="min-h-96 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome, {user.firstName}!</h1>
              <p className="text-gray-600">Role: {user.role}</p>
              <p className="text-gray-500 mt-2">Dashboard not configured for this role yet.</p>
            </div>
          </div>
        );
    }
  };

  return renderDashboard();
};

export default DashboardHome;