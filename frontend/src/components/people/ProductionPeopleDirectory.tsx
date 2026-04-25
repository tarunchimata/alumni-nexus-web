import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Users, 
  MessageCircle, 
  UserPlus, 
  Filter,
  GraduationCap,
  BookOpen,
  Building,
  Star
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import { toast } from 'sonner';
import { apiService } from '@/services/apiService';
import { transformUsers, type User as TransformedUser, type ApiUser } from '@/lib/apiTransforms';

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  school?: string;
  department?: string;
  graduationYear?: number;
  connections?: number;
  isConnected: boolean;
  isPendingConnection: boolean;
}

export const ProductionPeopleDirectory = () => {
  const { user } = useAuth();
  const { theme } = useRoleTheme();
  
  const [people, setPeople] = useState<Person[]>([]);
  const [filteredPeople, setFilteredPeople] = useState<Person[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('discover');

  useEffect(() => {
    fetchPeople();
  }, []);

  useEffect(() => {
    filterPeople();
  }, [people, searchQuery, roleFilter, statusFilter, activeTab]);

  const fetchPeople = async () => {
    setIsLoading(true);
    try {
      console.log('[PeopleDirectory] Fetching users from Keycloak with authentication...');
      
      // Use apiService which includes proper Keycloak authentication headers
      const apiResponse = await apiService.get<ApiUser[]>('/api/users');
      
      if (Array.isArray(apiResponse)) {
        console.log('[PeopleDirectory] Keycloak users received:', apiResponse.length);
        
        // Transform snake_case API response to camelCase frontend format
        const transformedUsers = transformUsers(apiResponse);
        
        // Convert to Person format for the component
        const realPeople: Person[] = transformedUsers.map((user) => ({
          id: user.id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          avatar: '',
          status: 'offline' as const,
          school: user.schoolName || '',
          department: '',
          graduationYear: undefined,
          connections: 0,
          isConnected: false,
          isPendingConnection: false
        }));
        
        setPeople(realPeople);
        console.log('[PeopleDirectory] Successfully loaded', realPeople.length, 'users from Keycloak');
      } else {
        throw new Error('Expected array response from users API');
      }
    } catch (error) {
      console.error('[PeopleDirectory] Error fetching users from Keycloak:', error);
      toast.error('Failed to load users from Keycloak. Please ensure you are logged in.');
      setPeople([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterPeople = () => {
    let filtered = people;

    // Filter by tab
    if (activeTab === 'connections') {
      filtered = filtered.filter(person => person.isConnected);
    } else if (activeTab === 'requests') {
      filtered = filtered.filter(person => person.isPendingConnection);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(person =>
        person.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(person => person.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(person => person.status === statusFilter);
    }

    setFilteredPeople(filtered);
  };

  const handleConnect = async (personId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setPeople(prev => prev.map(person =>
        person.id === personId
          ? { ...person, isPendingConnection: true }
          : person
      ));
      
      toast.success('Connection request sent!');
    } catch (error) {
      toast.error('Failed to send connection request');
    }
  };

  const handleMessage = (person: Person) => {
    toast.success(`Opening chat with ${person.firstName} ${person.lastName}`);
    // In a real app, this would open the messaging interface
  };

  const formatRole = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'student': return BookOpen;
      case 'teacher': return GraduationCap;
      case 'alumni': return Star;
      case 'school_admin': return Building;
      default: return Users;
    }
  };

  const getRoleColor = (role: string) => {
    const colors = {
      student: 'bg-student/10 text-student border-student/20',
      teacher: 'bg-teacher/10 text-teacher border-teacher/20',
      alumni: 'bg-alumni/10 text-alumni border-alumni/20',
      school_admin: 'bg-school-admin/10 text-school-admin border-school-admin/20',
      platform_admin: 'bg-platform-admin/10 text-platform-admin border-platform-admin/20'
    };
    return colors[role as keyof typeof colors] || 'bg-muted text-muted-foreground border-border';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-success';
      case 'away': return 'bg-warning';
      case 'offline': return 'bg-muted-foreground';
      default: return 'bg-muted-foreground';
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className={`rounded-xl bg-gradient-to-br ${theme.gradient} p-6 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">People Directory</h1>
            <p className="text-white/90">Connect with your school community</p>
          </div>
          <Users className="w-12 h-12 text-white/80" />
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search people by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="teacher">Teachers</SelectItem>
                <SelectItem value="alumni">Alumni</SelectItem>
                <SelectItem value="school_admin">School Admins</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="away">Away</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="discover">Discover People</TabsTrigger>
          <TabsTrigger value="connections">My Connections</TabsTrigger>
          <TabsTrigger value="requests">Pending Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-muted rounded-full"></div>
                      <div className="space-y-2">
                        <div className="w-32 h-4 bg-muted rounded"></div>
                        <div className="w-24 h-3 bg-muted rounded"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPeople.map((person) => {
                const RoleIcon = getRoleIcon(person.role);
                return (
                  <Card key={person.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={person.avatar} alt={person.firstName} />
                              <AvatarFallback className="bg-muted text-muted-foreground">
                                {person.firstName[0]}{person.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(person.status)} rounded-full border-2 border-white`}></div>
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {person.firstName} {person.lastName}
                            </h3>
                            <p className="text-sm text-muted-foreground">{person.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <Badge className={getRoleColor(person.role)}>
                          <RoleIcon className="w-3 h-3 mr-1" />
                          {formatRole(person.role)}
                        </Badge>
                        
                        {person.graduationYear && (
                          <div className="text-sm text-muted-foreground">
                            Class of {person.graduationYear}
                          </div>
                        )}
                        
                        {person.department && (
                          <div className="text-sm text-muted-foreground">
                            {person.department} Department
                          </div>
                        )}
                        
                        <div className="text-sm text-muted-foreground">
                          {person.connections} connections
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        {person.isConnected ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMessage(person)}
                            className="flex-1"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Message
                          </Button>
                        ) : person.isPendingConnection ? (
                          <Button variant="outline" size="sm" disabled className="flex-1">
                            Request Sent
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleConnect(person.id)}
                            className="flex-1"
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Connect
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="connections" className="space-y-4">
          <div className="text-center py-8">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Your Connections</h3>
            <p className="text-muted-foreground">People you're connected with will appear here</p>
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <div className="text-center py-8">
            <UserPlus className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Pending Requests</h3>
            <p className="text-muted-foreground">Connection requests you've sent will appear here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};