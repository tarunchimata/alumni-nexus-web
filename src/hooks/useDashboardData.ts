import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { apiService } from '@/services/apiService';

interface DashboardStats {
  totalUsers: number;
  totalSchools: number;
  activeConnections: number;
  pendingApprovals: number;
  totalStudents?: number;
  totalAlumni?: number;
  totalTeachers?: number;
  classmatesCount?: number;
  teachersCount?: number;
  fellowAlumniCount?: number;
  currentStudents?: number;
  mentoringOpportunities?: number;
  networkConnections?: number;
  assignedClasses?: number;
  activeStudents?: number;
  enrolledClasses?: number;
}

interface DashboardData {
  stats: DashboardStats;
  userSpecificData: {
    recentActivity: any[];
    quickActions: any[];
    notifications: any[];
    school?: any;
    students?: any[];
    classmates?: any[];
    teachers?: any[];
    fellowAlumni?: any[];
    pendingRegistrations?: any[];
    pendingSchools?: any[];
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
  const [userSpecificData, setUserSpecificData] = useState<DashboardData['userSpecificData']>({
    recentActivity: [],
    quickActions: [],
    notifications: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!user?.role) {
        throw new Error('User role not available');
      }

      console.log('Fetching dashboard data for role:', user.role);
      
      // Make real API call to backend dashboard endpoint
      const data = await apiService.getDashboardData(user.role);
      
      console.log('Dashboard API response:', data);
      
      // Extract stats from API response
      const stats = (data as any).stats || {
        totalUsers: 0,
        totalSchools: 0,
        activeConnections: 0,
        pendingApprovals: 0
      };

      setStats(stats);
      setUserSpecificData({
        recentActivity: (data as any).recentActivity || [],
        quickActions: getQuickActions(user.role),
        notifications: (data as any).alerts || [],
        school: (data as any).school,
        students: (data as any).students,
        classmates: (data as any).classmates,
        teachers: (data as any).teachers,
        fellowAlumni: (data as any).fellowAlumni,
        pendingRegistrations: (data as any).pendingRegistrations,
        pendingSchools: (data as any).pendingSchools
      });
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      
      // Fallback to role-based static data only on network errors
      if (err instanceof Error && (err.message.includes('fetch') || err.message.includes('network'))) {
        console.log('Using fallback static data due to network error');
        const roleStats = getRoleBasedStats(user?.role || '');
        setStats(roleStats);
        setUserSpecificData({
          recentActivity: getRoleBasedActivity(user?.role || ''),
          quickActions: getQuickActions(user?.role || ''),
          notifications: [{
            id: '1',
            message: 'Using offline data. Please check your connection.',
            timestamp: new Date().toISOString(),
            type: 'warning'
          }]
        });
      }
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
    const baseActivity = [
      {
        id: '1',
        type: 'connection',
        message: 'New connection request received',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        user: { name: 'John Doe', role: 'alumni' }
      },
      {
        id: '2',
        type: 'message',
        message: 'New message in Alumni Network',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        user: { name: 'Jane Smith', role: 'teacher' }
      }
    ];

    const roleSpecificActivity = {
      platform_admin: [
        {
          id: '3',
          type: 'system',
          message: 'New school registration pending approval',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          user: { name: 'Springfield High', role: 'school' }
        }
      ],
      school_admin: [
        {
          id: '3',
          type: 'approval',
          message: 'Teacher registration awaiting approval',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          user: { name: 'Mike Wilson', role: 'teacher' }
        }
      ],
      teacher: [
        {
          id: '3',
          type: 'student',
          message: 'New student joined your class',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          user: { name: 'Sarah Johnson', role: 'student' }
        }
      ]
    };

    return [...baseActivity, ...(roleSpecificActivity[role as keyof typeof roleSpecificActivity] || [])];
  };

  const getQuickActions = (role: string) => {
    const baseActions = [
      {
        label: 'Messages',
        description: 'Check your messages',
        href: '/dashboard/messages',
        icon: 'MessageSquare'
      },
      {
        label: 'Profile',
        description: 'Update your profile',
        href: '/dashboard/profile',
        icon: 'User'
      }
    ];

    const roleSpecificActions = {
      platform_admin: [
        {
          label: 'Manage Schools',
          description: 'Add or manage schools',
          href: '/dashboard/schools',
          icon: 'Building2'
        },
        {
          label: 'System Analytics',
          description: 'View platform analytics',
          href: '/dashboard/analytics',
          icon: 'BarChart'
        },
        {
          label: 'User Management',
          description: 'Manage platform users',
          href: '/dashboard/users',
          icon: 'Users'
        }
      ],
      school_admin: [
        {
          label: 'Approve Users',
          description: 'Review pending registrations',
          href: '/dashboard/approvals',
          icon: 'UserCheck'
        },
        {
          label: 'Import Data',
          description: 'Bulk import users',
          href: '/dashboard/import',
          icon: 'Upload'
        },
        {
          label: 'School Analytics',
          description: 'View school statistics',
          href: '/dashboard/analytics',
          icon: 'TrendingUp'
        }
      ],
      teacher: [
        {
          label: 'My Students',
          description: 'View your students',
          href: '/dashboard/students',
          icon: 'GraduationCap'
        },
        {
          label: 'Create Event',
          description: 'Organize school events',
          href: '/dashboard/events/create',
          icon: 'Calendar'
        }
      ],
      alumni: [
        {
          label: 'Alumni Network',
          description: 'Connect with alumni',
          href: '/dashboard/alumni',
          icon: 'Network'
        },
        {
          label: 'Mentoring',
          description: 'Mentor current students',
          href: '/dashboard/mentoring',
          icon: 'BookOpen'
        }
      ],
      student: [
        {
          label: 'My Classmates',
          description: 'Connect with classmates',
          href: '/dashboard/classmates',
          icon: 'Users'
        },
        {
          label: 'Find Alumni',
          description: 'Connect with alumni',
          href: '/dashboard/alumni',
          icon: 'Search'
        }
      ]
    };

    return [...baseActions, ...(roleSpecificActions[role as keyof typeof roleSpecificActions] || [])];
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