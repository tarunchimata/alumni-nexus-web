import { ModernDashboardCard } from './ModernDashboardCard';
import OnboardingBanner from './OnboardingBanner';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Link } from 'react-router-dom';
import {
  Users,
  School,
  UserPlus,
  FileText,
  MessageCircle,
  Calendar,
  TrendingUp,
  BarChart,
  Briefcase,
  BookOpen,
  Upload,
  Network,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const iconMap = {
  Users,
  School,
  UserPlus,
  FileText,
  MessageCircle,
  Calendar,
  TrendingUp,
  BarChart,
  Briefcase,
  BookOpen,
  Upload,
  Network
};

export const RoleDashboard = () => {
  const { user } = useAuth();
  const { theme } = useRoleTheme();
  const { stats, userSpecificData, isLoading, error, refresh } = useDashboardData();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">Please log in to access your dashboard.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <h2 className="text-lg font-semibold text-gray-900">Loading Dashboard...</h2>
          <p className="text-gray-600">Fetching your personalized data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-error mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900">Dashboard Error</h2>
          <p className="text-gray-600 max-w-md">{error}</p>
          <Button onClick={refresh} className="mt-4" variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const formatRole = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getRoleSpecificCards = () => {
    switch (user.role) {
      case 'platform_admin':
        return [
          <ModernDashboardCard
            key="schools"
            title="Total Schools"
            value={stats.totalSchools}
            icon={School}
            change={{ value: 5, label: 'vs last month', positive: true }}
            actions={[
              { label: 'Manage Schools', onClick: () => window.open('/dashboard/school-management', '_self') }
            ]}
          />,
          <ModernDashboardCard
            key="users"
            title="Platform Users"
            value={stats.totalUsers}
            icon={Users}
            change={{ value: 12, label: 'vs last month', positive: true }}
            actions={[
              { label: 'User Management', onClick: () => window.open('/dashboard/users', '_self') }
            ]}
          />,
          <ModernDashboardCard
            key="pending"
            title="Pending Approvals"
            value={stats.pendingApprovals}
            icon={AlertCircle}
            badge={{ text: 'Requires Action', variant: 'secondary' }}
            actions={[
              { label: 'Review Requests', onClick: () => window.open('/dashboard/approvals', '_self') }
            ]}
          />
        ];

      case 'school_admin':
        return [
          <ModernDashboardCard
            key="students"
            title="Total Students"
            value={stats.totalUsers}
            icon={Users}
            actions={[
              { label: 'Add Students', onClick: () => window.open('/dashboard/csv-upload', '_self') }
            ]}
          />,
          <ModernDashboardCard
            key="classes"
            title="Active Classes"
            value="24"
            icon={BookOpen}
            actions={[
              { label: 'Manage Classes', onClick: () => window.open('/dashboard/classes', '_self') }
            ]}
          />,
          <ModernDashboardCard
            key="alumni"
            title="Alumni Network"
            value={stats.activeConnections}
            icon={Network}
            actions={[
              { label: 'Alumni Directory', onClick: () => window.open('/dashboard/alumni', '_self') }
            ]}
          />
        ];

      case 'teacher':
        return [
          <ModernDashboardCard
            key="classes"
            title="My Classes"
            value="6"
            icon={BookOpen}
            description="Active this semester"
            actions={[
              { label: 'View Classes', onClick: () => window.open('/dashboard/classes', '_self') }
            ]}
          />,
          <ModernDashboardCard
            key="students"
            title="Students"
            value="156"
            icon={Users}
            description="Across all classes"
            actions={[
              { label: 'Student Progress', onClick: () => window.open('/dashboard/students', '_self') }
            ]}
          />,
          <ModernDashboardCard
            key="messages"
            title="Unread Messages"
            value="12"
            icon={MessageCircle}
            badge={{ text: 'New', variant: 'default' }}
            actions={[
              { label: 'View Messages', onClick: () => window.open('/dashboard/messages', '_self') }
            ]}
          />
        ];

      case 'alumni':
        return [
          <ModernDashboardCard
            key="connections"
            title="My Network"
            value={stats.activeConnections}
            icon={Network}
            description="Connected alumni"
            actions={[
              { label: 'Expand Network', onClick: () => window.open('/dashboard/alumni', '_self') }
            ]}
          />,
          <ModernDashboardCard
            key="events"
            title="Upcoming Events"
            value="3"
            icon={Calendar}
            description="Alumni meetups"
            actions={[
              { label: 'View Events', onClick: () => window.open('/dashboard/events', '_self') }
            ]}
          />,
          <ModernDashboardCard
            key="mentorship"
            title="Mentorship"
            value="2"
            icon={Users}
            description="Students you're mentoring"
            actions={[
              { label: 'Mentorship Hub', onClick: () => window.open('/dashboard/mentorship', '_self') }
            ]}
          />
        ];

      case 'student':
        return [
          <ModernDashboardCard
            key="classes"
            title="Enrolled Classes"
            value="8"
            icon={BookOpen}
            description="This semester"
            actions={[
              { label: 'View Schedule', onClick: () => window.open('/dashboard/classes', '_self') }
            ]}
          />,
          <ModernDashboardCard
            key="classmates"
            title="Classmates"
            value="42"
            icon={Users}
            description="In your network"
            actions={[
              { label: 'Find Friends', onClick: () => window.open('/dashboard/people', '_self') }
            ]}
          />,
          <ModernDashboardCard
            key="activities"
            title="Activities"
            value="5"
            icon={Calendar}
            description="Upcoming events"
            actions={[
              { label: 'View Activities', onClick: () => window.open('/dashboard/events', '_self') }
            ]}
          />
        ];

      default:
        return [];
    }
  };

  return (
    <div className={`min-h-screen ${theme.background} p-6`}>
      <div className="max-w-7xl mx-auto space-y-8">
        <OnboardingBanner />
        {/* Welcome Header */}
        <div className={`rounded-2xl bg-gradient-to-br ${theme.gradient} p-8 text-white shadow-2xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Avatar className="w-20 h-20 ring-4 ring-white/30">
                <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
                <AvatarFallback className="text-2xl font-bold bg-white/20 text-white">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Welcome back, {user.firstName}! 👋
                </h1>
                <p className="text-white/90 text-lg mb-3">
                  Ready to make today productive?
                </p>
                <Badge className="bg-white/20 text-white border-white/30 px-3 py-1">
                  {formatRole(user.role)}
                </Badge>
              </div>
            </div>
            <div className="hidden md:block text-right">
              <p className="text-white/80 text-sm">
                Last login: Today at 9:30 AM
              </p>
              <p className="text-white/80 text-sm">
                School: {user.schoolId || 'Not assigned'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getRoleSpecificCards()}
        </div>

        {/* Quick Actions */}
        <ModernDashboardCard
          title="Quick Actions"
          description="Common tasks for your role"
          className="col-span-full"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {userSpecificData.quickActions.map((action, index) => {
              const IconComponent = iconMap[action.icon as keyof typeof iconMap] || Users;
              return (
                <Link key={index} to={action.href}>
                  <div className="p-4 rounded-lg border hover:border-primary hover:shadow-md transition-all duration-200 group cursor-pointer">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${theme.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <IconComponent className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900">{action.label}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </ModernDashboardCard>

        {/* Recent Activity */}
        {userSpecificData.recentActivity.length > 0 && (
          <ModernDashboardCard
            title="Recent Activity"
            description="Latest updates and notifications"
            actions={[
              { label: 'View All', onClick: () => window.open('/dashboard/activity', '_self') }
            ]}
          >
            <div className="space-y-3">
              {userSpecificData.recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                    <AvatarFallback className="text-xs">
                      {activity.user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </ModernDashboardCard>
        )}
      </div>
    </div>
  );
};