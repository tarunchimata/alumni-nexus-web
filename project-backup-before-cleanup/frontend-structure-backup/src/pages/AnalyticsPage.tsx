import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { BarChart3, Users, School, TrendingUp, Calendar, Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useState, useEffect } from 'react';
import { apiService } from '@/services/apiService';

// Sample data for analytics
const sampleUserGrowthData = [
  { month: 'Jan', users: 120, schools: 8 },
  { month: 'Feb', users: 180, schools: 12 },
  { month: 'Mar', users: 240, schools: 15 },
  { month: 'Apr', users: 320, schools: 18 },
  { month: 'May', users: 410, schools: 22 },
  { month: 'Jun', users: 520, schools: 28 },
];

const sampleActivityData = [
  { day: 'Mon', logins: 45, posts: 12 },
  { day: 'Tue', logins: 52, posts: 18 },
  { day: 'Wed', logins: 38, posts: 8 },
  { day: 'Thu', logins: 61, posts: 22 },
  { day: 'Fri', logins: 49, posts: 15 },
  { day: 'Sat', logins: 28, posts: 5 },
  { day: 'Sun', logins: 33, posts: 7 },
];

interface AnalyticsData {
  totalUsers: number;
  totalSchools: number;
  activeUsers: number;
  growthRate: number;
  recentActivity: any[];
  userGrowth: any[];
}

const AnalyticsPage = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use apiService which includes proper Keycloak authentication headers
      const { apiService } = await import('@/services/apiService');
      const response = await apiService.get<any>('/api/analytics');
      
      console.log('[Analytics] API response:', response);
      
      // Map the API response to our expected format
      setAnalyticsData({
        totalUsers: response.totalUsers || 0,
        totalSchools: response.totalSchools || 0,
        activeUsers: response.activeUsers || 0,
        growthRate: response.userGrowthRate || 0,
        recentActivity: response.recentActivityData || [],
        userGrowth: response.userGrowthData || []
      });
      
    } catch (err: any) {
      console.error('[Analytics] API error:', err);
      const errorMessage = err.message || 'Failed to load analytics data';
      setError(errorMessage);
      
      // Show zero data on error
      setAnalyticsData({
        totalUsers: 0,
        totalSchools: 0,
        activeUsers: 0,
        growthRate: 0,
        recentActivity: [],
        userGrowth: []
      });
    } finally {
      setLoading(false);
    }
  };

  const isSchoolAdmin = user?.role === 'school_admin';
  const isPlatformAdmin = user?.role === 'platform_admin';

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchAnalyticsData}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isSchoolAdmin ? 'School Analytics' : 'Platform Analytics'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isSchoolAdmin 
                ? 'Monitor your school performance and user engagement' 
                : 'Comprehensive platform performance metrics and insights'
              }
            </p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{analyticsData?.totalUsers || 0}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                +{analyticsData?.growthRate || 0}% from last month
              </div>
            </CardContent>
          </Card>

          {isPlatformAdmin && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Schools</p>
                    <p className="text-2xl font-bold">{analyticsData?.totalSchools || 0}</p>
                  </div>
                  <School className="w-8 h-8 text-primary" />
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  +12% from last month
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">{analyticsData?.activeUsers || 0}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                +8% from last week
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Growth Rate</p>
                  <p className="text-2xl font-bold">{analyticsData?.growthRate || 0}%</p>
                </div>
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3 inline mr-1" />
                Monthly growth
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>User registration trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData?.userGrowth || sampleUserGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} />
                  {isPlatformAdmin && (
                    <Line type="monotone" dataKey="schools" stroke="hsl(var(--secondary))" strokeWidth={2} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Activity</CardTitle>
              <CardDescription>User engagement and content creation</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData?.recentActivity || sampleActivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="logins" fill="hsl(var(--primary))" />
                  <Bar dataKey="posts" fill="hsl(var(--secondary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Additional Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing {isSchoolAdmin ? 'Classes' : 'Schools'}</CardTitle>
              <CardDescription>Most active {isSchoolAdmin ? 'classes' : 'schools'} this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((rank) => (
                  <div key={rank} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        {rank}
                      </span>
                      <span className="font-medium">
                        {isSchoolAdmin ? `Class ${10 + rank}A` : `School ${rank}`}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {Math.floor(Math.random() * 50) + 20} users
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Milestones</CardTitle>
              <CardDescription>Key achievements and goals reached</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">500+ users milestone reached</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">25% engagement rate achieved</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">New analytics dashboard launched</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm">Mobile app usage increased</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
              <CardDescription>Key insights and recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Great!</strong> User engagement is up 15% this month.
                  </p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> Consider promoting weekend activities to boost Saturday engagement.
                  </p>
                </div>
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <strong>Note:</strong> New user onboarding completion rate is 85%.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;