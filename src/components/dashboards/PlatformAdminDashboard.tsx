
import { useState, useEffect } from "react";
import { apiClient, endpoints } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, School, Settings, Database, TrendingUp, Shield, AlertTriangle, CheckCircle, Clock, UserPlus } from "lucide-react";
import CSVImport from "@/components/CSVImport";
import SchoolApprovalQueue from "@/components/admin/SchoolApprovalQueue";

interface DashboardData {
  stats: {
    totalUsers: number;
    totalSchools: number;
    pendingApprovals: number;
    systemHealth: string;
  };
  recentActivity: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    userType: string;
    status: string;
    createdAt: string;
  }>;
  pendingSchools: Array<{
    id: string;
    name: string;
    createdAt: string;
    status: string;
  }>;
  alerts: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
}

const PlatformAdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiClient.get<DashboardData>(endpoints.dashboards.platformAdmin);
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch platform admin dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-destructive">{error || 'Failed to load dashboard'}</p>
            <Button onClick={fetchDashboardData} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Platform Administration</h2>
          <p className="text-gray-600">Manage the entire platform and all schools</p>
        </div>

    <div className="space-y-6">
      {/* Real Stats Cards from Database */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="secondary" className="text-xs">All roles</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Schools</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.totalSchools}</div>
            <p className="text-xs text-muted-foreground">{dashboardData.pendingSchools.length} pending approval</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="default" className="text-xs">Active: {dashboardData.stats.totalSchools - dashboardData.pendingSchools.length}</Badge>
              {dashboardData.pendingSchools.length > 0 && (
                <Badge variant="destructive" className="text-xs">Pending: {dashboardData.pendingSchools.length}</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.8%</div>
            <p className="text-xs text-muted-foreground">Database operational</p>
            <div className="flex items-center space-x-2 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-600">{dashboardData.stats.systemHealth === 'healthy' ? 'System operational' : 'System issues'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">Users awaiting approval</p>
            <div className="flex items-center space-x-2 mt-2">
              {dashboardData.stats.pendingApprovals > 0 ? (
                <Badge variant="destructive" className="text-xs">Action required</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">All caught up</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Management</CardTitle>
            <CardDescription>Platform-wide administration tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <School className="w-4 h-4 mr-2" />
              Manage Schools
              <Badge variant="destructive" className="ml-auto">3 pending</Badge>
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="w-4 h-4 mr-2" />
              User Management
              <Badge variant="secondary" className="ml-auto">15 new</Badge>
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <UserPlus className="w-4 h-4 mr-2" />
              Bulk User Import
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Shield className="w-4 h-4 mr-2" />
              Security & Permissions
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Platform Settings
            </Button>
          </CardContent>
        </Card>

        <SchoolApprovalQueue onApprovalAction={fetchDashboardData} />
      </div>

      {/* Recent Activity & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Platform Analytics</CardTitle>
            <CardDescription>Key performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Daily Active Users</span>
              <div className="text-right">
                <div className="text-sm font-medium">1,847</div>
                <div className="text-xs text-green-600">↗ +12%</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Messages Sent</span>
              <div className="text-right">
                <div className="text-sm font-medium">15,432</div>
                <div className="text-xs text-green-600">↗ +8%</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Events Created</span>
              <div className="text-right">
                <div className="text-sm font-medium">89</div>
                <div className="text-xs text-blue-600">↗ +23%</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Alumni Engagement</span>
              <div className="text-right">
                <div className="text-sm font-medium">73%</div>
                <div className="text-xs text-green-600">↗ +5%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bulk Data Import</CardTitle>
            <CardDescription>Upload CSV files to import schools and users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-3">Import Schools</h3>
              <CSVImport type="schools" onSuccess={fetchDashboardData} />
            </div>
            <div>
              <h3 className="text-sm font-medium mb-3">Import Users</h3>
              <CSVImport type="users" onSuccess={fetchDashboardData} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent User Activity</CardTitle>
            <CardDescription>Latest user registrations and activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData.recentActivity.slice(0, 5).map((user, index) => (
              <div key={user.id} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  user.status === 'active' ? 'bg-green-500' : 
                  user.status === 'pending_approval' ? 'bg-yellow-500' : 'bg-gray-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm">
                    {user.firstName} {user.lastName} registered as {user.userType}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(user.createdAt).toLocaleString()}
                  </p>
                </div>
                <Badge 
                  variant={user.status === 'active' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {user.status}
                </Badge>
              </div>
            ))}
            
            {dashboardData.alerts.map((alert, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
      </div>
    </div>
  );
};

export default PlatformAdminDashboard;
