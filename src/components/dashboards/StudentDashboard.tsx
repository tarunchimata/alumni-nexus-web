
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, MessageCircle, Calendar, Award, GraduationCap, Heart, Briefcase, Star, UserPlus } from "lucide-react";

const StudentDashboard = () => {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Student Dashboard</h2>
          <p className="text-gray-600">Connect with classmates, alumni, and access resources</p>
        </div>
        <div className="space-y-6">
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classmates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">In your class</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="default" className="text-xs">Active: 42</Badge>
              <Badge variant="outline" className="text-xs">Online: 18</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alumni Mentors</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Active mentorships</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="default" className="text-xs">Career: 2</Badge>
              <Badge variant="outline" className="text-xs">Academic: 1</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Groups</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">Active groups</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="default" className="text-xs">Math: 1</Badge>
              <Badge variant="outline" className="text-xs">Science: 2</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Badges earned</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="default" className="text-xs">Academic: 8</Badge>
              <Badge variant="outline" className="text-xs">Social: 4</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Actions & Networking */}
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
              <Badge variant="secondary" className="ml-auto">5 unread</Badge>
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Heart className="w-4 h-4 mr-2" />
              Connect with Alumni
              <Badge variant="default" className="ml-auto">8 matches</Badge>
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <GraduationCap className="w-4 h-4 mr-2" />
              Join Study Group
              <Badge variant="outline" className="ml-auto">3 available</Badge>
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Upcoming Events
              <Badge variant="default" className="ml-auto">2 this week</Badge>
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Briefcase className="w-4 h-4 mr-2" />
              Career Resources
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alumni Connections</CardTitle>
            <CardDescription>Connect with alumni for mentorship and guidance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">AS</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Alex Smith (Class of 2019)</p>
                  <p className="text-xs text-muted-foreground">Software Engineer | Career Mentor</p>
                </div>
              </div>
              <Button size="sm" variant="outline">
                <UserPlus className="w-3 h-3 mr-1" />
                Connect
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">EP</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Emily Parker (Class of 2017)</p>
                  <p className="text-xs text-muted-foreground">Doctor | Academic Mentor</p>
                </div>
              </div>
              <Button size="sm" variant="outline">
                <MessageCircle className="w-3 h-3 mr-1" />
                Message
              </Button>
            </div>

            <div className="p-3 border rounded-lg bg-green-50">
              <div className="flex items-center space-x-2 mb-2">
                <Award className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Mentorship Match Available</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                3 alumni are interested in mentoring students in your field
              </p>
              <Button size="sm" className="w-full">
                View Matches
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Updates from your classes, groups, and network</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm">New message in Math Study Group</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm">Career fair event next week - 15 alumni attending</p>
                <p className="text-xs text-muted-foreground">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm">Your mentor Alex shared new career resources</p>
                <p className="text-xs text-muted-foreground">1 day ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm">Science project presentations due tomorrow</p>
                <p className="text-xs text-muted-foreground">1 day ago</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Progress & Achievements</CardTitle>
            <CardDescription>Track your academic and social achievements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50">
              <div className="flex items-center space-x-3">
                <Award className="w-6 h-6 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">Study Streak</p>
                  <p className="text-xs text-muted-foreground">15 days in a row</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
              <div className="flex items-center space-x-3">
                <Users className="w-6 h-6 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Social Connector</p>
                  <p className="text-xs text-muted-foreground">Connected with 20+ classmates</p>
                </div>
              </div>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Profile Completion</span>
                <span className="text-xs text-muted-foreground">85%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Add your interests to get better mentor matches</p>
            </div>

            <div className="text-center p-4 border rounded-lg bg-purple-50">
              <p className="text-lg font-bold text-purple-600">12</p>
              <p className="text-xs text-muted-foreground">Achievement Badges</p>
              <p className="text-xs text-green-600 mt-1">+2 this week</p>
            </div>
          </CardContent>
        </Card>
      </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
