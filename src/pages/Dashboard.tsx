
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

  // Role-based layout configuration
  const getRoleLayoutConfig = () => {
    switch (user.role) {
      case 'platform_admin':
        return {
          showActivityFeed: false, // Platform admins focus on system management
          activityFeedTitle: "Platform Activity",
          dashboardComponent: <PlatformAdminDashboard />,
          layout: "full-width" // Full width for admin controls
        };
      case 'school_admin':
        return {
          showActivityFeed: true,
          activityFeedTitle: "School Community Activity",
          dashboardComponent: <SchoolAdminDashboard />,
          layout: "split" // Split layout for admin oversight + community
        };
      case 'teacher':
        return {
          showActivityFeed: true,
          activityFeedTitle: "Class & School Updates",
          dashboardComponent: <TeacherDashboard />,
          layout: "split"
        };
      case 'student':
        return {
          showActivityFeed: true,
          activityFeedTitle: "Community Activity",
          dashboardComponent: <StudentDashboard />,
          layout: "activity-focused" // Activity feed gets more space
        };
      case 'alumni':
        return {
          showActivityFeed: true,
          activityFeedTitle: "Alumni Network Activity",
          dashboardComponent: <AlumniDashboard />,
          layout: "activity-focused"
        };
      default:
        return {
          showActivityFeed: true,
          activityFeedTitle: "Activity Feed",
          dashboardComponent: null,
          layout: "split"
        };
    }
  };

  const layoutConfig = getRoleLayoutConfig();

  const renderLayout = () => {
    if (layoutConfig.layout === "full-width") {
      return (
        <div className="space-y-6">
          {layoutConfig.dashboardComponent}
        </div>
      );
    }

    if (layoutConfig.layout === "activity-focused") {
      return (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Activity Feed - Takes up more space for social roles */}
          {layoutConfig.showActivityFeed && (
            <div className="xl:col-span-3">
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>{layoutConfig.activityFeedTitle}</CardTitle>
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
          )}
          
          {/* Role-specific Dashboard - Sidebar */}
          <div className="xl:col-span-1">
            <div className="space-y-6">
              {layoutConfig.dashboardComponent}
            </div>
          </div>
        </div>
      );
    }

    // Default split layout
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role-specific Dashboard */}
        <div className="order-2 lg:order-1">
          <div className="space-y-6">
            {layoutConfig.dashboardComponent}
          </div>
        </div>

        {/* Activity Feed */}
        {layoutConfig.showActivityFeed && (
          <div className="order-1 lg:order-2">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>{layoutConfig.activityFeedTitle}</CardTitle>
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
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 lg:py-8">
      {/* Header Section */}
      <div className="mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
              Welcome back, {user.firstName}!
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening in your school community
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {user.role.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </div>

      {/* Dynamic Layout */}
      {renderLayout()}
    </div>
  );
};

export default Dashboard;
