import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Briefcase, Calendar, UserPlus } from "lucide-react";

interface AlumniMember {
  id: string;
  name: string;
  graduationYear: number;
  profession: string;
  company: string;
  location: string;
  avatar?: string;
  isConnected: boolean;
}

const AlumniDirectory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  // Mock data - replace with actual API call
  const [alumni] = useState<AlumniMember[]>([
    {
      id: "1",
      name: "Sarah Johnson",
      graduationYear: 2018,
      profession: "Software Engineer",
      company: "Google",
      location: "San Francisco, CA",
      avatar: "",
      isConnected: false
    },
    {
      id: "2",
      name: "Michael Chen",
      graduationYear: 2016,
      profession: "Product Manager",
      company: "Microsoft",
      location: "Seattle, WA",
      avatar: "",
      isConnected: true
    },
    {
      id: "3",
      name: "Emily Rodriguez",
      graduationYear: 2020,
      profession: "UX Designer",
      company: "Apple",
      location: "Cupertino, CA",
      avatar: "",
      isConnected: false
    },
  ]);

  const graduationYears = [...new Set(alumni.map(a => a.graduationYear))].sort((a, b) => b - a);
  const locations = [...new Set(alumni.map(a => a.location.split(',')[1]?.trim() || a.location))];

  const filteredAlumni = alumni.filter(person => {
    const matchesSearch = person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.profession.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = !selectedYear || person.graduationYear.toString() === selectedYear;
    const matchesLocation = !selectedLocation || person.location.includes(selectedLocation);
    
    return matchesSearch && matchesYear && matchesLocation;
  });

  const handleConnect = (alumniId: string) => {
    // Implement connection logic
    console.log("Connecting to alumni:", alumniId);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Alumni Directory</h1>
        <p className="text-gray-600 mt-2">Connect with graduates from your school</p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, profession, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Graduation Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Years</SelectItem>
                {graduationYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Locations</SelectItem>
                {locations.map(location => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={() => {
                setSearchTerm("");
                setSelectedYear("");
                setSelectedLocation("");
              }}
              variant="outline"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAlumni.map((person) => (
          <Card key={person.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={person.avatar} alt={person.name} />
                  <AvatarFallback>
                    {person.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{person.name}</h3>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <Calendar className="w-4 h-4 mr-1" />
                    Class of {person.graduationYear}
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Briefcase className="w-4 h-4 mr-2" />
                  <span>{person.profession} at {person.company}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{person.location}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                {person.isConnected ? (
                  <Badge variant="secondary">Connected</Badge>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleConnect(person.id)}
                    className="flex items-center"
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Connect
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAlumni.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No alumni found matching your criteria.</p>
          <p className="text-gray-400 mt-2">Try adjusting your search filters.</p>
        </div>
      )}
    </div>
  );
};

export default AlumniDirectory;