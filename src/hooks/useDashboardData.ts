import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

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
  userSpecificData: {
    recentActivity: any[];
    quickActions: any[];
    notifications: any[];
  };
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3033/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const useDashboardData = (): DashboardData => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalSchools: 0,
    activeConnections: 0,
    pendingApprovals: 0,
    totalPosts: 0,
    totalAlumni: 0,
    totalTeachers: 0,
    totalStudents: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch real dashboard data from backend API
      const response = await fetch(`${API_BASE_URL}/dashboard/${user?.role || 'student'}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Backend returns data directly, not wrapped in success object
      setStats({
        totalUsers: data.stats?.totalUsers || 0,
        totalSchools: data.stats?.totalSchools || 0,
        activeConnections: data.stats?.activeConnections || 0,
        pendingApprovals: data.stats?.pendingApprovals || 0,
        totalPosts: data.stats?.totalPosts || 0,
        totalAlumni: data.stats?.totalAlumni || 0,
        totalTeachers: data.stats?.totalTeachers || 0,
        totalStudents: data.stats?.totalStudents || 0
      });
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      
      // Fallback to zero stats on error
      setStats({
        totalUsers: 0,
        totalSchools: 0,
        activeConnections: 0,
        pendingApprovals: 0,
        totalPosts: 0,
        totalAlumni: 0,
        totalTeachers: 0,
        totalStudents: 0
      });
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
        { label: 'User Management', description: 'Manage platform users', href: '/dashboard/users', icon: 'Users' },
      ],
      school_admin: [
        { label: 'School Analytics', description: 'View school statistics', href: '/dashboard/school-analytics', icon: 'TrendingUp' },
        { label: 'Import Data', description: 'Bulk import users', href: '/dashboard/admin/csv-upload', icon: 'Upload' },
        { label: 'Manage Teachers', description: 'Manage school teachers', href: '/dashboard/teachers', icon: 'Users' },
        { label: 'Manage Students', description: 'Manage school students', href: '/dashboard/students', icon: 'GraduationCap' },
      ],
      teacher: [
        { label: 'My Classes', description: 'View and manage classes', href: '/dashboard/classes', icon: 'BookOpen' },
        { label: 'Students', description: 'View my students', href: '/dashboard/students', icon: 'Users' },
        { label: 'People', description: 'Find people', href: '/dashboard/people', icon: 'Users' },
        { label: 'Events', description: 'View upcoming events', href: '/dashboard/events', icon: 'Calendar' },
      ],
      alumni: [
        { label: 'Alumni Network', description: 'Connect with alumni', href: '/dashboard/people', icon: 'Network' },
        { label: 'Alumni Events', description: 'Alumni events', href: '/dashboard/events', icon: 'Calendar' },
        { label: 'Mentorship', description: 'Mentorship opportunities', href: '/dashboard/mentorship', icon: 'Award' },
        { label: 'Donations', description: 'Support your school', href: '/dashboard/donations', icon: 'Heart' },
      ],
      student: [
        { label: 'My Classes', description: 'View enrolled classes', href: '/dashboard/classes', icon: 'BookOpen' },
        { label: 'Classmates', description: 'Find classmates', href: '/dashboard/people', icon: 'Users' },
        { label: 'Events', description: 'School events', href: '/dashboard/events', icon: 'Calendar' },
        { label: 'Resources', description: 'Learning resources', href: '/dashboard/resources', icon: 'Library' },
      ],
    };

    return [...baseActions, ...(roleActions[role] || [])];
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  return {
    stats,
    userSpecificData: {
      recentActivity: [], // Will be populated by individual components
      quickActions: getQuickActions(user?.role || ''),
      notifications: [], // Will be populated by individual components
    },
    isLoading,
    error,
    refresh: fetchDashboardData,
  };
};
