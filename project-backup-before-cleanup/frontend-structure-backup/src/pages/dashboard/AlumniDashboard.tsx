
import { useState, useEffect } from "react";
import { apiClient, endpoints } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { Users, MessageCircle, Calendar, Briefcase, Heart, Network, UserPlus, MapPin, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AlumniDashboardData {
  school: {
    name: string;
    address: string;
  };
  stats: {
    fellowAlumniCount: number;
    currentStudents: number;
    mentoringOpportunities: number;
    networkConnections: number;
  };
  fellowAlumni: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: string;
  }>;
  mentoringOpportunities: Array<any>;
  upcomingEvents: Array<any>;
  alerts: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
}

const AlumniDashboard = () => {
  const [dashboardData, setDashboardData] = useState<AlumniDashboardData | null>(null);
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
      
      const data = await apiClient.get<AlumniDashboardData>(endpoints.dashboards.alumni);
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch alumni dashboard data:', error);
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
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Alumni Dashboard</h2>
              <p className="text-gray-600">Welcome back to {dashboardData.school?.name}</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Alumni Network</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.stats.fellowAlumniCount}</div>
                  <p className="text-xs text-muted-foreground">Fellow alumni</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Students</CardTitle>
                  <Heart className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.stats.currentStudents}</div>
                  <p className="text-xs text-muted-foreground">Available to mentor</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Mentoring</CardTitle>
                  <Network className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.stats.mentoringOpportunities}</div>
                  <p className="text-xs text-muted-foreground">Opportunities available</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Network Size</CardTitle>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.stats.networkConnections}</div>
                  <p className="text-xs text-muted-foreground">Connections</p>
                </CardContent>
              </Card>
            </div>

            {/* Alumni Actions and Networking */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Alumni Network</CardTitle>
                  <CardDescription>Connect and give back to your school community</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Network className="w-4 h-4 mr-2" />
                    Find Alumni
                    <Badge variant="secondary" className="ml-auto">{dashboardData.stats.fellowAlumniCount} available</Badge>
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Heart className="w-4 h-4 mr-2" />
                    Mentor Students
                    <Badge variant="default" className="ml-auto">{dashboardData.stats.mentoringOpportunities} matches</Badge>
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Share Job Opportunities
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="w-4 h-4 mr-2" />
                    Upcoming Events
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Alumni Connections</CardTitle>
                  <CardDescription>Connect with fellow alumni from your school</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dashboardData.fellowAlumni.slice(0, 3).map((alumni) => (
                    <div key={alumni.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            {alumni.firstName.charAt(0)}{alumni.lastName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{alumni.firstName} {alumni.lastName}</p>
                          <p className="text-xs text-muted-foreground">Alumni</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <UserPlus className="w-3 h-3 mr-1" />
                        Connect
                      </Button>
                    </div>
                  ))}

                  <div className="p-3 border rounded-lg bg-blue-50">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">Mentoring Opportunity</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {dashboardData.stats.currentStudents} current students could benefit from your experience
                    </p>
                    <Button size="sm" className="w-full">
                      Start Mentoring
                    </Button>
                  </div>

                  {dashboardData.alerts.map((alert, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-green-50">
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

export default AlumniDashboard;
