import { useState, useEffect } from "react";
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

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3033/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

const AlumniDirectory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [alumni, setAlumni] = useState<AlumniMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch alumni data from API
  useEffect(() => {
    const fetchAlumni = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/users?role=alumni`, {
          headers: getAuthHeaders()
        });

        if (response.ok) {
          const data = await response.json();
          // Transform API data to match AlumniMember interface
          const transformedAlumni = (data.users || []).map((user: any) => ({
            id: user.id.toString(),
            name: `${user.firstName} ${user.lastName}`,
            graduationYear: user.graduationYear || new Date().getFullYear(),
            profession: user.profession || 'Alumni',
            company: user.company || 'Not specified',
            location: user.location || 'Location not specified',
            avatar: user.avatar || '',
            isConnected: false // Will be updated from connections API
          }));
          setAlumni(transformedAlumni);
        } else {
          throw new Error('Failed to fetch alumni data');
        }
      } catch (err) {
        console.error('Failed to fetch alumni:', err);
        setError('Failed to load alumni directory');
        setAlumni([]); // Empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchAlumni();
  }, []);

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

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="ml-2 text-muted-foreground">Loading alumni directory...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-500">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-2">
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlumni.length > 0 ? (
            filteredAlumni.map((person) => (
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
        ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No alumni found matching your criteria.</p>
              <p className="text-gray-400 mt-2">Try adjusting your search filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AlumniDirectory;