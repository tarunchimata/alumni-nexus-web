import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalUsers: number;
  totalSchools: number;
  activeConnections: number;
  pendingApprovals: number;
  totalPosts: number;
  totalAlumni: number;
  totalTeachers: number;
  totalStudents: number;
}

interface DashboardData {
  stats: DashboardStats;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

const defaultStats: DashboardStats = {
  totalUsers: 0,
  totalSchools: 0,
  activeConnections: 0,
  pendingApprovals: 0,
  totalPosts: 0,
  totalAlumni: 0,
  totalTeachers: 0,
  totalStudents: 0,
};

export const useDashboardData = (): DashboardData => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch real counts from Supabase tables
      const [schoolsResult, requestsResult] = await Promise.all([
        supabase.from('schools').select('id', { count: 'exact', head: true }),
        supabase.from('school_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);

      setStats({
        totalUsers: 0, // No users table yet
        totalSchools: schoolsResult.count ?? 0,
        activeConnections: 0,
        pendingApprovals: requestsResult.count ?? 0,
        totalPosts: 0,
        totalAlumni: 0,
        totalTeachers: 0,
        totalStudents: 0,
      });
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      setStats(defaultStats);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  return {
    stats,
    isLoading,
    error,
    refresh: fetchDashboardData,
  };
};
