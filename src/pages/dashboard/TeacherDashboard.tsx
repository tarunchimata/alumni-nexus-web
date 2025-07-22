
import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { Users, BookOpen, MessageCircle, Calendar, FileText, Award, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface TeacherDashboardData {
  school: {
    name: string;
    address: string;
  };
  stats: {
    totalStudents: number;
    assignedClasses: number;
    activeStudents: number;
  };
  students: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: string;
  }>;
  upcomingEvents: Array<any>;
  alerts: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
}

const TeacherDashboard = () => {
  const [dashboardData, setDashboardData] = useState<TeacherDashboardData | null>(null);
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
      
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/dashboards/teacher`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch teacher dashboard data:', error);
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
              <h2 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h2>
              <p className="text-gray-600">Welcome to {dashboardData.school?.name}</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">My Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.stats.totalStudents}</div>
                  <p className="text-xs text-muted-foreground">Total students</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.stats.assignedClasses}</div>
                  <p className="text-xs text-muted-foreground">This semester</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.stats.activeStudents}</div>
                  <p className="text-xs text-muted-foreground">Currently enrolled</p>
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

            {/* Teaching Tools and Student List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Teaching Tools</CardTitle>
                  <CardDescription>Manage your classes and students</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Manage Classes
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Create Assignment
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Award className="w-4 h-4 mr-2" />
                    Grade Students
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Meeting
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Your Students</CardTitle>
                  <CardDescription>Students in your school ({dashboardData.students.length} total)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dashboardData.students.slice(0, 5).map((student) => (
                    <div key={student.id} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{student.firstName} {student.lastName}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                  ))}
                  
                  {dashboardData.alerts.map((alert, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">{new Date(alert.timestamp).toLocaleString()}</p>
                      </div>
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

export default TeacherDashboard;
