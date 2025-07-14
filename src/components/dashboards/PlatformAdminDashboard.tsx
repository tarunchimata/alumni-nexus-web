
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, School, Settings, Database, TrendingUp, Shield, AlertTriangle, CheckCircle, Clock, UserPlus } from "lucide-react";

const PlatformAdminDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,340</div>
            <p className="text-xs text-muted-foreground">+180 from last month</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="secondary" className="text-xs">Students: 1,200</Badge>
              <Badge variant="outline" className="text-xs">Alumni: 890</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Schools</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">3 pending approval</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="default" className="text-xs">Active: 12</Badge>
              <Badge variant="destructive" className="text-xs">Pending: 3</Badge>
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
            <p className="text-xs text-muted-foreground">Uptime this month</p>
            <div className="flex items-center space-x-2 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-600">All systems operational</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="destructive" className="text-xs">Urgent: 2</Badge>
              <Badge variant="secondary" className="text-xs">Normal: 6</Badge>
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

        <Card>
          <CardHeader>
            <CardTitle>Approval Queue</CardTitle>
            <CardDescription>Items requiring administrative approval</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <School className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Springfield High School</p>
                  <p className="text-xs text-muted-foreground">New school registration</p>
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
                  <p className="text-sm font-medium">Alumni Bulk Upload</p>
                  <p className="text-xs text-muted-foreground">120 users from Central High</p>
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
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">Content Report</p>
                  <p className="text-xs text-muted-foreground">Inappropriate content flagged</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="destructive">
                  Take Action
                </Button>
                <Button size="sm" variant="outline">
                  Review
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
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
            <CardTitle>Recent System Activity</CardTitle>
            <CardDescription>Latest platform events and alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm">New school registered: "Springfield High"</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm">Bulk user import completed: 120 alumni added</p>
                <p className="text-xs text-muted-foreground">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm">System maintenance scheduled for tonight</p>
                <p className="text-xs text-muted-foreground">6 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm">New feature: Alumni mentorship matching</p>
                <p className="text-xs text-muted-foreground">1 day ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlatformAdminDashboard;
