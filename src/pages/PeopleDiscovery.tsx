import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, GraduationCap, UserPlus, Search } from "lucide-react";

const PeopleDiscovery = () => {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">People Discovery</h1>
        <p className="text-gray-600 mt-2">Find and connect with classmates, alumni, and other members of your school community</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <GraduationCap className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle>Alumni Directory</CardTitle>
            <CardDescription>
              Browse and search through our complete alumni directory. Find classmates by graduation year, location, or profession.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/dashboard/people/alumni">
              <Button className="w-full">
                <Search className="w-4 h-4 mr-2" />
                Browse Alumni
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <UserPlus className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle>People You May Know</CardTitle>
            <CardDescription>
              Discover potential connections based on your school, graduation year, interests, and mutual connections.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/dashboard/people/suggestions">
              <Button className="w-full" variant="outline">
                <Users className="w-4 h-4 mr-2" />
                View Suggestions
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <CardTitle>Your Connections</CardTitle>
            <CardDescription>
              Manage your existing connections, view pending friend requests, and see who you're connected with.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/dashboard/connections">
              <Button className="w-full" variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Manage Connections
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PeopleDiscovery;