
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActivityFeed } from "@/components/social/ActivityFeed";
import PlatformAdminDashboard from "@/components/dashboards/PlatformAdminDashboard";
import SchoolAdminDashboard from "@/components/dashboards/SchoolAdminDashboard";
import TeacherDashboard from "@/components/dashboards/TeacherDashboard";
import StudentDashboard from "@/components/dashboards/StudentDashboard";
import AlumniDashboard from "@/components/dashboards/AlumniDashboard";

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const renderRoleSpecificDashboard = () => {
    switch (user.role) {
      case 'platform_admin':
        return <PlatformAdminDashboard />;
      case 'school_admin':
        return <SchoolAdminDashboard />;
      case 'teacher':
        return <TeacherDashboard />;
      case 'student':
        return <StudentDashboard />;
      case 'alumni':
        return <AlumniDashboard />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {user.firstName}!
            </h1>
            <p className="text-muted-foreground mt-2">
              Here's what's happening in your school community
            </p>
          </div>
          <Badge variant="outline" className="capitalize">
            {user.role.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area - Activity Feed */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Feed</CardTitle>
                <CardDescription>
                  Stay connected with your school community
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="px-6 pb-6">
                  <ActivityFeed />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar - Role-specific Dashboard */}
        <div className="lg:col-span-1">
          {renderRoleSpecificDashboard()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
