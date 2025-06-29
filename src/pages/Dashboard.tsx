
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  School, 
  MessageCircle, 
  GraduationCap, 
  Settings, 
  Bell, 
  Search,
  Calendar,
  TrendingUp,
  UserPlus,
  Mail
} from "lucide-react";
import { Input } from "@/components/ui/input";

const Dashboard = () => {
  const [userRole] = useState("student"); // This will come from Keycloak context
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data - will be replaced with real API calls
  const mockData = {
    student: {
      stats: {
        classmates: 45,
        teachers: 12,
        messages: 234,
        groups: 8
      },
      recentActivity: [
        { type: "message", content: "New message in Class 12-A group", time: "2 hours ago" },
        { type: "announcement", content: "Math test scheduled for Friday", time: "1 day ago" },
        { type: "join", content: "Sarah joined your chemistry study group", time: "2 days ago" }
      ]
    },
    teacher: {
      stats: {
        students: 150,
        classes: 6,
        messages: 89,
        assignments: 12
      }
    },
    alumni: {
      stats: {
        connections: 78,
        juniors: 234,
        events: 5,
        messages: 156
      }
    },
    school_admin: {
      stats: {
        students: 1250,
        teachers: 85,
        classes: 45,
        messages: 2340
      }
    }
  };

  const currentStats = mockData[userRole as keyof typeof mockData]?.stats || mockData.student.stats;

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {userRole === 'student' ? 'Classmates' : userRole === 'teacher' ? 'Students' : 'Connections'}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.values(currentStats)[0]}</div>
            <p className="text-xs text-muted-foreground">
              +5 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {userRole === 'student' ? 'Teachers' : userRole === 'teacher' ? 'Classes' : userRole === 'alumni' ? 'Juniors' : 'Teachers'}
            </CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.values(currentStats)[1]}</div>
            <p className="text-xs text-muted-foreground">
              Active this semester
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.values(currentStats)[2]}</div>
            <p className="text-xs text-muted-foreground">
              +12% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {userRole === 'student' ? 'Groups' : userRole === 'teacher' ? 'Assignments' : 'Events'}
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.values(currentStats)[3]}</div>
            <p className="text-xs text-muted-foreground">
              2 new this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest updates and notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockData.student.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm">{activity.content}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <MessageCircle className="w-4 h-4 mr-2" />
              Send Message
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <UserPlus className="w-4 h-4 mr-2" />
              Find Classmates
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              View Schedule
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Account Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  My School Buddies
                </span>
              </div>
              
              <Badge variant="secondary" className="capitalize">
                {userRole.replace('_', ' ')}
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input 
                  placeholder="Search..." 
                  className="pl-10 w-64"
                />
              </div>
              
              <Button variant="ghost" size="sm">
                <Bell className="w-5 h-5" />
              </Button>
              
              <Button variant="ghost" size="sm">
                <Settings className="w-5 h-5" />
              </Button>

              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">JD</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'messages', label: 'Messages', icon: MessageCircle },
              { id: 'groups', label: 'Groups', icon: Users },
              { id: 'people', label: 'People', icon: School }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, John! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening in your school community today.
          </p>
        </div>

        {activeTab === 'overview' && renderOverview()}
        
        {activeTab === 'messages' && (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Messages Coming Soon</h3>
            <p className="text-gray-600">Real-time messaging with your classmates and teachers</p>
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Groups Coming Soon</h3>
            <p className="text-gray-600">Join and manage your class groups and study circles</p>
          </div>
        )}

        {activeTab === 'people' && (
          <div className="text-center py-12">
            <School className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">People Directory Coming Soon</h3>
            <p className="text-gray-600">Find and connect with students, teachers, and alumni</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
