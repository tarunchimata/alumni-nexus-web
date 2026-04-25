import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, X, Users, GraduationCap, MapPin } from "lucide-react";

interface SuggestedPerson {
  id: string;
  name: string;
  graduationYear?: number;
  profession: string;
  company: string;
  location: string;
  avatar?: string;
  mutualConnections: number;
  reason: string;
}

const PeopleYouMayKnow = () => {
  const [suggestions, setSuggestions] = useState<SuggestedPerson[]>([
    {
      id: "1",
      name: "Alex Thompson",
      graduationYear: 2019,
      profession: "Marketing Manager",
      company: "Adobe",
      location: "San Jose, CA",
      mutualConnections: 3,
      reason: "Same graduation year"
    },
    {
      id: "2",
      name: "Maria Garcia",
      graduationYear: 2020,
      profession: "Data Scientist",
      company: "Tesla",
      location: "Austin, TX",
      mutualConnections: 2,
      reason: "Works in similar field"
    },
    {
      id: "3",
      name: "David Kim",
      graduationYear: 2018,
      profession: "Frontend Developer",
      company: "Netflix",
      location: "Los Angeles, CA",
      mutualConnections: 5,
      reason: "5 mutual connections"
    },
    {
      id: "4",
      name: "Jennifer Lee",
      graduationYear: 2017,
      profession: "Product Designer",
      company: "Airbnb",
      location: "San Francisco, CA",
      mutualConnections: 1,
      reason: "Lives in your area"
    }
  ]);

  const handleConnect = (personId: string) => {
    // Implement connection request logic
    console.log("Sending connection request to:", personId);
    // Remove from suggestions after connecting
    setSuggestions(prev => prev.filter(p => p.id !== personId));
  };

  const handleDismiss = (personId: string) => {
    setSuggestions(prev => prev.filter(p => p.id !== personId));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">People You May Know</h1>
        <p className="text-gray-600 mt-2">Discover new connections based on your network and interests</p>
      </div>

      {suggestions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suggestions.map((person) => (
            <Card key={person.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={person.avatar} alt={person.name} />
                    <AvatarFallback>
                      {person.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(person.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{person.name}</h3>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>{person.profession} at {person.company}</div>
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {person.location}
                    </div>
                    {person.graduationYear && (
                      <div className="flex items-center">
                        <GraduationCap className="w-3 h-3 mr-1" />
                        Class of {person.graduationYear}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Users className="w-4 h-4 mr-1" />
                    {person.mutualConnections} mutual connection{person.mutualConnections !== 1 ? 's' : ''}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {person.reason}
                  </Badge>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleConnect(person.id)}
                    className="flex-1"
                    size="sm"
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Connect
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDismiss(person.id)}
                  >
                    Not Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No new suggestions</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            We'll show you new people to connect with as our community grows. 
            In the meantime, try browsing the alumni directory.
          </p>
        </div>
      )}
    </div>
  );
};

export default PeopleYouMayKnow;