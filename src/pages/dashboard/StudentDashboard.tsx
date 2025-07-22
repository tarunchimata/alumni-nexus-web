
import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { Users, BookOpen, MessageCircle, Calendar, GraduationCap, Heart, UserPlus, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface StudentDashboardData {
  school: {
    name: string;
    address: string;
  };
  stats: {
    classmatesCount: number;
    teachersCount: number;
    enrolledClasses: number;
  };
  classmates: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;
  teachers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;
  upcomingEvents: Array<any>;
  alerts: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
}

const StudentDashboard = () => {
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
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
      
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/dashboards/student`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch student dashboard data:', error);
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
              <h2 className="text-2xl font-bold text-gray-900">Student Dashboard</h2>
              <p className="text-gray-600">Welcome to {dashboardData.school?.name}</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Classmates</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.stats.classmatesCount}</div>
                  <p className="text-xs text-muted-foreground">In your school</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Teachers</CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.stats.teachersCount}</div>
                  <p className="text-xs text-muted-foreground">Available to contact</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Study Groups</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.stats.enrolledClasses}</div>
                  <p className="text-xs text-muted-foreground">Active groups</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Messages</CardTitle>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">This week</p>
                </CardContent>
              </Card>
            </div>

            {/* Student Actions and Connections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Your most common tasks and activities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message Classmates
                    <Badge variant="secondary" className="ml-auto">{dashboardData.classmates.length} available</Badge>
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Heart className="w-4 h-4 mr-2" />
                    Connect with Alumni
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Contact Teachers
                    <Badge variant="outline" className="ml-auto">{dashboardData.teachers.length} teachers</Badge>
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="w-4 h-4 mr-2" />
                    Upcoming Events
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>School Community</CardTitle>
                  <CardDescription>Connect with your classmates and teachers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dashboardData.classmates.slice(0, 3).map((classmate) => (
                    <div key={classmate.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            {classmate.firstName.charAt(0)}{classmate.lastName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{classmate.firstName} {classmate.lastName}</p>
                          <p className="text-xs text-muted-foreground">Classmate</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <UserPlus className="w-3 h-3 mr-1" />
                        Connect
                      </Button>
                    </div>
                  ))}

                  {dashboardData.teachers.slice(0, 2).map((teacher) => (
                    <div key={teacher.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            {teacher.firstName.charAt(0)}{teacher.lastName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{teacher.firstName} {teacher.lastName}</p>
                          <p className="text-xs text-muted-foreground">Teacher</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        Message
                      </Button>
                    </div>
                  ))}

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

export default StudentDashboard;
