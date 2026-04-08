import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalUsers: number;
  totalSchools: number;
  activeConnections: number;
  pendingApprovals: number;
}

interface DashboardData {
  stats: DashboardStats;
  userSpecificData: {
    recentActivity: any[];
    quickActions: any[];
    notifications: any[];
  };
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useDashboardData = (): DashboardData => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalSchools: 0,
    activeConnections: 0,
    pendingApprovals: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch real counts from Supabase
      const [schoolsRes, requestsRes] = await Promise.all([
        supabase.from('schools').select('id', { count: 'exact', head: true }),
        supabase.from('school_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      setStats({
        totalUsers: 0,
        totalSchools: schoolsRes.count || 0,
        activeConnections: 0,
        pendingApprovals: requestsRes.count || 0,
      });
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const getQuickActions = (role: string) => {
    const baseActions = [
      { label: 'Messages', description: 'Check your messages', href: '/dashboard/messages', icon: 'MessageCircle' },
      { label: 'Profile', description: 'Update your profile', href: '/dashboard/profile', icon: 'Users' },
    ];

    const roleActions: Record<string, any[]> = {
      platform_admin: [
        { label: 'Manage Schools', description: 'Add or manage schools', href: '/dashboard/schools', icon: 'School' },
        { label: 'Analytics', description: 'View platform analytics', href: '/dashboard/analytics', icon: 'BarChart' },
        { label: 'CSV Import', description: 'Bulk import users', href: '/dashboard/admin/csv-upload', icon: 'Upload' },
      ],
      school_admin: [
        { label: 'School Analytics', description: 'View school statistics', href: '/dashboard/school-analytics', icon: 'TrendingUp' },
        { label: 'Import Data', description: 'Bulk import users', href: '/dashboard/admin/csv-upload', icon: 'Upload' },
      ],
      teacher: [
        { label: 'People', description: 'Find people', href: '/dashboard/people', icon: 'Users' },
        { label: 'Events', description: 'View upcoming events', href: '/dashboard/events', icon: 'Calendar' },
      ],
      alumni: [
        { label: 'People', description: 'Connect with alumni', href: '/dashboard/people', icon: 'Network' },
        { label: 'Events', description: 'Alumni events', href: '/dashboard/events', icon: 'Calendar' },
      ],
      student: [
        { label: 'People', description: 'Find classmates', href: '/dashboard/people', icon: 'Users' },
        { label: 'Events', description: 'School events', href: '/dashboard/events', icon: 'Calendar' },
      ],
    };

    return [...baseActions, ...(roleActions[role] || [])];
  };

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  return {
    stats,
    userSpecificData: {
      recentActivity: [],
      quickActions: getQuickActions(user?.role || ''),
      notifications: [],
    },
    isLoading,
    error,
    refresh: fetchDashboardData,
  };
};
