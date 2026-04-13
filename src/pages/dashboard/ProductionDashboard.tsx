import { useAuth } from '@/hooks/useAuth';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Users, School, Network, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProductionDashboard() {
  const { user } = useAuth();
  const { stats, isLoading, error, refresh } = useDashboardData();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">Error Loading Dashboard</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={refresh}>Try Again</Button>
      </div>
    );
  }

  const getWelcomeMessage = () => {
    const firstName = user?.firstName || 'User';
    switch (user?.role) {
      case 'platform_admin':
        return `Welcome back, ${firstName}! Manage the entire platform from here.`;
      case 'school_admin':
        return `Welcome, ${firstName}! Oversee your school's community and activities.`;
      case 'teacher':
        return `Hello, ${firstName}! Connect with your students and colleagues.`;
      case 'student':
        return `Hi, ${firstName}! Explore your school community and connect with classmates.`;
      case 'alumni':
        return `Welcome back, ${firstName}! Reconnect with your alma mater and fellow alumni.`;
      default:
        return `Welcome, ${firstName}!`;
    }
  };

  const getMainActions = () => {
    switch (user?.role) {
      case 'platform_admin':
        return [
          { label: 'Manage Schools', href: '/dashboard/schools', icon: School },
          { label: 'User Management', href: '/dashboard/people', icon: Users },
          { label: 'System Analytics', href: '/dashboard/analytics', icon: Network }
        ];
      case 'school_admin':
        return [
          { label: 'Approve Users', href: '/dashboard/people', icon: Users },
          { label: 'Import Data', href: '/dashboard/admin/csv-upload', icon: School },
          { label: 'School Analytics', href: '/dashboard/analytics', icon: Network }
        ];
      case 'teacher':
        return [
          { label: 'My Students', href: '/dashboard/people', icon: Users },
          { label: 'Create Event', href: '/dashboard/events', icon: Clock },
          { label: 'Messages', href: '/dashboard/messages', icon: Network }
        ];
      case 'student':
        return [
          { label: 'My Classmates', href: '/dashboard/people', icon: Users },
          { label: 'Find Alumni', href: '/dashboard/people', icon: School },
          { label: 'Activities', href: '/dashboard/activity', icon: Network }
        ];
      case 'alumni':
        return [
          { label: 'Alumni Network', href: '/dashboard/people', icon: Network },
          { label: 'Events', href: '/dashboard/events', icon: Clock },
          { label: 'Messages', href: '/dashboard/messages', icon: Users }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {getWelcomeMessage()}
        </h1>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{stats.totalUsers || '—'}</p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Schools</p>
              <p className="text-2xl font-bold">{stats.totalSchools || '—'}</p>
            </div>
            <School className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Connections</p>
              <p className="text-2xl font-bold">{stats.activeConnections || '—'}</p>
            </div>
            <Network className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{stats.pendingApprovals || '—'}</p>
            </div>
            <Clock className="h-8 w-8 text-primary" />
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {getMainActions().map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-16 flex items-center justify-start space-x-3"
              onClick={() => navigate(action.href)}
            >
              <action.icon className="h-5 w-5" />
              <span>{action.label}</span>
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}
