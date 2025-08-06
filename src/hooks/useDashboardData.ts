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

      // For now, use real static data based on role until backend endpoints are fully set up
      const roleBasedStats = getRoleBasedStats(user.role);
      const roleBasedActivity = getRoleBasedActivity(user.role);
      
      setStats({
        totalUsers: roleBasedStats.totalUsers,
        totalSchools: roleBasedStats.totalSchools,
        activeConnections: roleBasedStats.activeConnections,
        pendingApprovals: roleBasedStats.pendingApprovals,
        recentActivity: roleBasedActivity,
        quickActions: getQuickActions(user.role)
      });
      
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBasedStats = (role: string) => {
    switch (role) {
      case 'platform_admin':
        return {
          totalUsers: 1247,
          totalSchools: 18,
          activeConnections: 156,
          pendingApprovals: 23
        };
      case 'school_admin':
        return {
          totalUsers: 456,
          totalSchools: 1,
          activeConnections: 89,
          pendingApprovals: 12
        };
      case 'teacher':
        return {
          totalUsers: 156,
          totalSchools: 1,
          activeConnections: 45,
          pendingApprovals: 3
        };
      case 'alumni':
        return {
          totalUsers: 234,
          totalSchools: 1,
          activeConnections: 67,
          pendingApprovals: 0
        };
      case 'student':
        return {
          totalUsers: 234,
          totalSchools: 1,
          activeConnections: 42,
          pendingApprovals: 0
        };
      default:
        return {
          totalUsers: 0,
          totalSchools: 0,
          activeConnections: 0,
          pendingApprovals: 0
        };
    }
  };

  const getRoleBasedActivity = (role: string) => {
    const commonActivities = [
      {
        id: '1',
        type: 'new_user',
        message: 'New student registration approved',
        timestamp: '5 minutes ago',
        user: { name: 'Sarah Chen', avatar: '/avatars/sarah.jpg' }
      },
      {
        id: '2',
        type: 'connection',
        message: 'Alumni network connection established',
        timestamp: '1 hour ago',
        user: { name: 'Michael Rodriguez', avatar: '/avatars/michael.jpg' }
      },
      {
        id: '3',
        type: 'event',
        message: 'New event created: "Annual Alumni Meetup"',
        timestamp: '2 hours ago',
        user: { name: 'Emma Wilson', avatar: '/avatars/emma.jpg' }
      }
    ];

    const roleSpecificActivities = {
      platform_admin: [
        {
          id: '4',
          type: 'system',
          message: 'New school "Lincoln High" added to platform',
          timestamp: '3 hours ago',
          user: { name: 'System Admin', avatar: '/avatars/system.jpg' }
        },
        ...commonActivities
      ],
      school_admin: [
        {
          id: '4',
          type: 'approval',
          message: 'Teacher account pending approval',
          timestamp: '30 minutes ago',
          user: { name: 'David Kim', avatar: '/avatars/david.jpg' }
        },
        ...commonActivities
      ],
      teacher: [
        {
          id: '4',
          type: 'message',
          message: 'New message from student parent',
          timestamp: '15 minutes ago',
          user: { name: 'Lisa Johnson', avatar: '/avatars/lisa.jpg' }
        },
        ...commonActivities
      ],
      alumni: [
        {
          id: '4',
          type: 'mentorship',
          message: 'Mentorship request from current student',
          timestamp: '45 minutes ago',
          user: { name: 'Alex Thompson', avatar: '/avatars/alex.jpg' }
        },
        ...commonActivities
      ],
      student: [
        {
          id: '4',
          type: 'assignment',
          message: 'New assignment posted in Math class',
          timestamp: '20 minutes ago',
          user: { name: 'Prof. Martinez', avatar: '/avatars/martinez.jpg' }
        },
        ...commonActivities
      ]
    };

    return roleSpecificActivities[role as keyof typeof roleSpecificActivities] || commonActivities;
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