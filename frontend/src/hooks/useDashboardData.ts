import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'https://api.hostingmanager.in/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

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
      // Try fetching stats from your backend API
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setStats({
            totalUsers: data.data.totalUsers ?? 0,
            totalSchools: data.data.totalSchools ?? 0,
            activeConnections: data.data.activeConnections ?? 0,
            pendingApprovals: data.data.pendingApprovals ?? 0,
            totalPosts: data.data.totalPosts ?? 0,
            totalAlumni: data.data.totalAlumni ?? 0,
            totalTeachers: data.data.totalTeachers ?? 0,
            totalStudents: data.data.totalStudents ?? 0,
          });
        } else {
          setStats(defaultStats);
        }
      } else {
        console.warn('Stats API returned', response.status, '- using defaults');
        setStats(defaultStats);
      }
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      // Don't show error to user - just use defaults
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
