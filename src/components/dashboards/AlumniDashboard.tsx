
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, MessageCircle, Calendar, Briefcase, Heart, Network, Trophy, Star, UserPlus, MapPin } from "lucide-react";

const AlumniDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78</div>
            <p className="text-xs text-muted-foreground">Alumni connections</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="default" className="text-xs">Same batch: 23</Badge>
              <Badge variant="outline" className="text-xs">New: 5</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mentoring</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Current students</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="default" className="text-xs">Active: 8</Badge>
              <Badge variant="secondary" className="text-xs">Completed: 25</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Attended this year</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="default" className="text-xs">Upcoming: 3</Badge>
              <Badge variant="outline" className="text-xs">Hosting: 1</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">850</div>
            <p className="text-xs text-muted-foreground">Community points</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="default" className="text-xs">Top 15%</Badge>
              <Badge variant="secondary" className="text-xs">+50 this week</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alumni Community Actions */}
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
              <Badge variant="secondary" className="ml-auto">12 suggestions</Badge>
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Heart className="w-4 h-4 mr-2" />
              Mentor Students
              <Badge variant="default" className="ml-auto">8 matches available</Badge>
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Briefcase className="w-4 h-4 mr-2" />
              Share Job Opportunities
              <Badge variant="outline" className="ml-auto">3 posted</Badge>
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Upcoming Events
              <Badge variant="default" className="ml-auto">3 events</Badge>
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Trophy className="w-4 h-4 mr-2" />
              Alumni Achievements
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Networking Opportunities</CardTitle>
            <CardDescription>Connect with fellow alumni and expand your network</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">JD</span>
                </div>
                <div>
                  <p className="text-sm font-medium">John Doe (Class of 2015)</p>
                  <p className="text-xs text-muted-foreground">Software Engineer at Google</p>
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
                  <span className="text-white text-xs font-medium">MS</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Maria Silva (Class of 2012)</p>
                  <p className="text-xs text-muted-foreground">Marketing Director at Nike</p>
                </div>
              </div>
              <Button size="sm" variant="outline">
                <MessageCircle className="w-3 h-3 mr-1" />
                Message
              </Button>
            </div>

            <div className="p-3 border rounded-lg bg-blue-50">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Local Alumni Meetup</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Connect with 15+ alumni in your area this Saturday
              </p>
              <Button size="sm" className="w-full">
                Join Meetup
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Community Updates & Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Community Updates</CardTitle>
            <CardDescription>Latest news from your alumni network</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm">Annual alumni reunion scheduled for next month</p>
                <p className="text-xs text-muted-foreground">3 hours ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm">Tech career fair - volunteer opportunities available</p>
                <p className="text-xs text-muted-foreground">1 day ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm">New scholarship fund launched by Class of 2010</p>
                <p className="text-xs text-muted-foreground">2 days ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm">Alumni startup showcase event announced</p>
                <p className="text-xs text-muted-foreground">3 days ago</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Impact & Achievements</CardTitle>
            <CardDescription>Your contributions to the community</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
              <div className="flex items-center space-x-3">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">Top Mentor Badge</p>
                  <p className="text-xs text-muted-foreground">Helped 25+ students this year</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Heart className="w-6 h-6 text-red-500" />
                <div>
                  <p className="text-sm font-medium">Community Champion</p>
                  <p className="text-xs text-muted-foreground">Active in 5+ groups</p>
                </div>
              </div>
            </div>

            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Mentorship Progress</span>
                <span className="text-xs text-muted-foreground">8/12 active</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '67%' }}></div>
              </div>
            </div>

            <div className="text-center p-4 border rounded-lg bg-blue-50">
              <p className="text-lg font-bold text-blue-600">850</p>
              <p className="text-xs text-muted-foreground">Community Points Earned</p>
              <p className="text-xs text-green-600 mt-1">+50 this week</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AlumniDashboard;
