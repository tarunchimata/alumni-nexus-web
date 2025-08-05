import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

interface DashboardStats {
  totalUsers: number;
  totalSchools: number;
  activeConnections: number;
  pendingApprovals: number;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
    user: {
      name: string;
      avatar?: string;
    };
  }>;
  quickActions: Array<{
    label: string;
    description: string;
    href: string;
    icon: string;
  }>;
}

interface DashboardData {
  stats: DashboardStats;
  userSpecificData: any;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useDashboardData = (): DashboardData => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalSchools: 0,
    activeConnections: 0,
    pendingApprovals: 0,
    recentActivity: [],
    quickActions: []
  });
  const [userSpecificData, setUserSpecificData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch role-specific dashboard data
      const endpoint = getDashboardEndpoint(user.role);
      const response = await apiClient.get(endpoint);

      if (response) {
        const data = response as any;
        setStats({
          totalUsers: data.stats?.totalUsers || 0,
          totalSchools: data.stats?.totalSchools || 0,
          activeConnections: data.stats?.activeConnections || 0,
          pendingApprovals: data.stats?.pendingApprovals || 0,
          recentActivity: data.recentActivity || [],
          quickActions: getQuickActions(user.role)
        });
        setUserSpecificData(data.data);
      }
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError('Failed to load dashboard data');
      
      // Provide fallback data for demo purposes
      setStats({
        totalUsers: 150,
        totalSchools: 12,
        activeConnections: 45,
        pendingApprovals: 8,
        recentActivity: [
          {
            id: '1',
            type: 'new_user',
            message: 'New alumni registration',
            timestamp: '2 minutes ago',
            user: { name: 'Sarah Johnson' }
          },
          {
            id: '2',
            type: 'connection',
            message: 'New connection request',
            timestamp: '1 hour ago',
            user: { name: 'Michael Chen' }
          }
        ],
        quickActions: getQuickActions(user.role)
      });
      toast.error('Using demo data - check your backend connection');
    } finally {
      setIsLoading(false);
    }
  };

  const getDashboardEndpoint = (role: string): string => {
    const endpoints = {
      platform_admin: '/dashboards/platform-admin',
      school_admin: '/dashboards/school-admin',
      teacher: '/dashboards/teacher',
      student: '/dashboards/student',
      alumni: '/dashboards/alumni'
    };
    return endpoints[role as keyof typeof endpoints] || '/dashboards/platform-admin';
  };

  const getQuickActions = (role: string) => {
    const actionsByRole = {
      platform_admin: [
        { label: 'Manage Schools', description: 'Add or edit schools', href: '/dashboard/school-management', icon: 'School' },
        { label: 'User Management', description: 'Manage platform users', href: '/dashboard/users', icon: 'Users' },
        { label: 'Import Data', description: 'CSV bulk import', href: '/dashboard/csv-upload', icon: 'Upload' },
        { label: 'System Analytics', description: 'View platform metrics', href: '/dashboard/analytics', icon: 'BarChart' }
      ],
      school_admin: [
        { label: 'Add Students', description: 'Register new students', href: '/dashboard/csv-upload', icon: 'UserPlus' },
        { label: 'Manage Classes', description: 'Create and manage classes', href: '/dashboard/classes', icon: 'BookOpen' },
        { label: 'View Reports', description: 'School analytics', href: '/dashboard/reports', icon: 'FileText' },
        { label: 'Alumni Network', description: 'Manage alumni connections', href: '/dashboard/alumni', icon: 'Network' }
      ],
      teacher: [
        { label: 'My Classes', description: 'View your classes', href: '/dashboard/classes', icon: 'BookOpen' },
        { label: 'Student Progress', description: 'Track student performance', href: '/dashboard/students', icon: 'TrendingUp' },
        { label: 'Messages', description: 'Communicate with students', href: '/dashboard/messages', icon: 'MessageCircle' },
        { label: 'Schedule', description: 'View your schedule', href: '/dashboard/schedule', icon: 'Calendar' }
      ],
      alumni: [
        { label: 'Find Classmates', description: 'Connect with alumni', href: '/dashboard/alumni', icon: 'Users' },
        { label: 'Network Events', description: 'Upcoming alumni events', href: '/dashboard/events', icon: 'Calendar' },
        { label: 'Mentorship', description: 'Mentor current students', href: '/dashboard/mentorship', icon: 'Users' },
        { label: 'Career Opportunities', description: 'Job board and referrals', href: '/dashboard/careers', icon: 'Briefcase' }
      ],
      student: [
        { label: 'My Classes', description: 'View your enrolled classes', href: '/dashboard/classes', icon: 'BookOpen' },
        { label: 'Connect', description: 'Find classmates and teachers', href: '/dashboard/people', icon: 'Users' },
        { label: 'Messages', description: 'Chat with peers', href: '/dashboard/messages', icon: 'MessageCircle' },
        { label: 'Events', description: 'School events and activities', href: '/dashboard/events', icon: 'Calendar' }
      ]
    };
    return actionsByRole[role as keyof typeof actionsByRole] || actionsByRole.student;
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  return {
    stats,
    userSpecificData,
    isLoading,
    error,
    refresh: fetchDashboardData
  };
};