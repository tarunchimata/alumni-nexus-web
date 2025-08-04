
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, GraduationCap, BookOpen, UserPlus, Settings, BarChart3, Calendar, MessageSquare, CheckCircle, Clock, AlertCircle } from "lucide-react";

const SchoolAdminDashboard = () => {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">School Administration</h2>
          <p className="text-gray-600">Manage your school's community and data</p>
        </div>
        <div className="space-y-6">
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,250</div>
            <p className="text-xs text-muted-foreground">+45 this semester</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="default" className="text-xs">Active: 1,200</Badge>
              <Badge variant="secondary" className="text-xs">Pending: 50</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alumni Network</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">890</div>
            <p className="text-xs text-muted-foreground">Registered alumni</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="outline" className="text-xs">Active: 670</Badge>
              <Badge variant="secondary" className="text-xs">Mentors: 120</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85</div>
            <p className="text-xs text-muted-foreground">Full-time faculty</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="default" className="text-xs">Active: 80</Badge>
              <Badge variant="outline" className="text-xs">New: 5</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">Require your approval</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="destructive" className="text-xs">Alumni: 12</Badge>
              <Badge variant="secondary" className="text-xs">Students: 11</Badge>
            </div>
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
              <Badge variant="destructive" className="ml-auto">23 pending</Badge>
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Bulk Import Users
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <GraduationCap className="w-4 h-4 mr-2" />
              Alumni Management
              <Badge variant="secondary" className="ml-auto">890 total</Badge>
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Manage Events
              <Badge variant="default" className="ml-auto">5 upcoming</Badge>
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
            <CardDescription>Review and approve new registrations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <GraduationCap className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Sarah Johnson (Class of 2018)</p>
                  <p className="text-xs text-muted-foreground">Alumni registration</p>
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

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Users className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Mike Chen</p>
                  <p className="text-xs text-muted-foreground">Current student verification</p>
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

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">Batch Import Request</p>
                  <p className="text-xs text-muted-foreground">45 alumni from Class of 2020</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="default">
                  Review Batch
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* School Activity & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>School Community Metrics</CardTitle>
            <CardDescription>Engagement and activity overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Alumni Engagement Rate</span>
              <div className="text-right">
                <div className="text-sm font-medium">73%</div>
                <div className="text-xs text-green-600">↗ +5% this month</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Active Mentorships</span>
              <div className="text-right">
                <div className="text-sm font-medium">42</div>
                <div className="text-xs text-blue-600">↗ +8 new matches</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Event Participation</span>
              <div className="text-right">
                <div className="text-sm font-medium">68%</div>
                <div className="text-xs text-green-600">↗ +12% from last event</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Messages This Week</span>
              <div className="text-right">
                <div className="text-sm font-medium">2,341</div>
                <div className="text-xs text-blue-600">↗ +156</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent School Activity</CardTitle>
            <CardDescription>Latest updates from your school community</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm">25 new alumni registrations approved</p>
                <p className="text-xs text-muted-foreground">1 hour ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm">Annual alumni reunion event created</p>
                <p className="text-xs text-muted-foreground">3 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm">New mentorship program launched</p>
                <p className="text-xs text-muted-foreground">1 day ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm">Teacher Sarah Johnson joined platform</p>
                <p className="text-xs text-muted-foreground">2 days ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolAdminDashboard;
