import React from 'react';
import { RoleDashboard } from '@/components/dashboards/RoleDashboard';
import { useWelcome } from '@/hooks/useWelcome';

export const DashboardHome = () => {
  useWelcome(); // This will redirect new users to welcome page
  return <RoleDashboard />;
};

export default DashboardHome;