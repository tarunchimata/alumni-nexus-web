
import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { Users, GraduationCap, BookOpen, UserPlus, Settings, BarChart3, Calendar, CheckCircle, Clock, AlertTriangle, Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface SchoolAdminDashboardData {
  school: {
    id: string;
    name: string;
    address: string;
    status: string;
  };
  stats: {
    totalStudents: number;
    totalAlumni: number;
    totalTeachers: number;
    pendingApprovals: number;
  };
  pendingRegistrations: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    userType: string;
    createdAt: string;
  }>;
  alerts: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
}

const SchoolAdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState<SchoolAdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/dashboards/school-admin`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch school admin dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1">
          <DashboardHeader />
          <main className="p-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1">
          <DashboardHeader />
          <main className="p-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-destructive">{error || 'Failed to load dashboard'}</p>
                <Button onClick={fetchDashboardData} className="mt-4">
                  Try Again
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1">
        <DashboardHeader />
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">School Management</h2>
                <p className="text-gray-600">Managing {dashboardData.school?.name}</p>
              </div>
              <div className="flex space-x-3">
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Upload
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.stats.totalStudents}</div>
                  <p className="text-xs text-muted-foreground">Active students</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Teachers</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.stats.totalTeachers}</div>
                  <p className="text-xs text-muted-foreground">Faculty members</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Alumni</CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.stats.totalAlumni}</div>
                  <p className="text-xs text-muted-foreground">Registered alumni</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.stats.pendingApprovals}</div>
                  <p className="text-xs text-muted-foreground">Awaiting approval</p>
                </CardContent>
              </Card>
            </div>

            {/* School Management Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>School Management</CardTitle>
                  <CardDescription>Manage your school's community and users</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Approve New Users
                    <Badge variant="destructive" className="ml-auto">{dashboardData.stats.pendingApprovals} pending</Badge>
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="w-4 h-4 mr-2" />
                    Bulk Import Users
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Alumni Management
                    <Badge variant="secondary" className="ml-auto">{dashboardData.stats.totalAlumni} total</Badge>
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="w-4 h-4 mr-2" />
                    Manage Events
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    School Analytics
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Approval Queue</CardTitle>
                  <CardDescription>Review and approve new registrations ({dashboardData.pendingRegistrations.length} pending)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dashboardData.pendingRegistrations.length > 0 ? (
                    dashboardData.pendingRegistrations.slice(0, 3).map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {user.userType === 'alumni' ? (
                            <GraduationCap className="w-4 h-4 text-blue-500" />
                          ) : (
                            <Users className="w-4 h-4 text-green-500" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-muted-foreground">{user.userType} registration</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="default">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline">
                            Review
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">No pending approvals</p>
                    </div>
                  )}

                  {dashboardData.alerts.map((alert, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-blue-50">
                      <p className="text-sm font-medium">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">{new Date(alert.timestamp).toLocaleString()}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SchoolAdminDashboard;
