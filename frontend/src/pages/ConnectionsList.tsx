import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { MessageCircle, UserMinus, Check, X, Search, Users, Clock } from "lucide-react";

interface Connection {
  id: string;
  name: string;
  profession: string;
  company: string;
  avatar?: string;
  lastActive: string;
  isOnline: boolean;
}

interface ConnectionRequest {
  id: string;
  name: string;
  profession: string;
  company: string;
  avatar?: string;
  requestDate: string;
  mutualConnections: number;
}

const ConnectionsList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const [connections, setConnections] = useState<Connection[]>([
    {
      id: "1",
      name: "Sarah Johnson",
      profession: "Software Engineer",
      company: "Google",
      lastActive: "2 hours ago",
      isOnline: true
    },
    {
      id: "2",
      name: "Michael Chen",
      profession: "Product Manager",
      company: "Microsoft",
      lastActive: "1 day ago",
      isOnline: false
    },
    {
      id: "3",
      name: "Emily Rodriguez",
      profession: "UX Designer",
      company: "Apple",
      lastActive: "3 hours ago",
      isOnline: true
    }
  ]);

  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([
    {
      id: "4",
      name: "Alex Thompson",
      profession: "Marketing Manager",
      company: "Adobe",
      requestDate: "2 days ago",
      mutualConnections: 3
    },
    {
      id: "5",
      name: "Maria Garcia",
      profession: "Data Scientist",
      company: "Tesla",
      requestDate: "1 week ago",
      mutualConnections: 2
    }
  ]);

  const filteredConnections = connections.filter(connection =>
    connection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    connection.profession.toLowerCase().includes(searchTerm.toLowerCase()) ||
    connection.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDisconnect = (connectionId: string) => {
    setConnections(prev => prev.filter(c => c.id !== connectionId));
  };

  const handleMessage = (connectionId: string) => {
    // Implement messaging logic
    console.log("Opening message with:", connectionId);
  };

  const handleAcceptRequest = (requestId: string) => {
    const request = connectionRequests.find(r => r.id === requestId);
    if (request) {
      setConnections(prev => [...prev, {
        id: request.id,
        name: request.name,
        profession: request.profession,
        company: request.company,
        lastActive: "Just now",
        isOnline: true
      }]);
      setConnectionRequests(prev => prev.filter(r => r.id !== requestId));
    }
  };

  const handleRejectRequest = (requestId: string) => {
    setConnectionRequests(prev => prev.filter(r => r.id !== requestId));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Connections</h1>
        <p className="text-gray-600 mt-2">Manage your professional network and connection requests</p>
      </div>

      <Tabs defaultValue="connections" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="connections" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>My Connections ({connections.length})</span>
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Requests ({connectionRequests.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-6">
          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search connections..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Connections List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredConnections.map((connection) => (
              <Card key={connection.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="relative">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={connection.avatar} alt={connection.name} />
                        <AvatarFallback>
                          {connection.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {connection.isOnline && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{connection.name}</h3>
                      <p className="text-sm text-gray-600">{connection.profession}</p>
                      <p className="text-sm text-gray-500">{connection.company}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-500">Last active: {connection.lastActive}</p>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleMessage(connection.id)}
                      className="flex-1"
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Message
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(connection.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredConnections.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No connections found.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          {connectionRequests.length > 0 ? (
            <div className="space-y-4">
              {connectionRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={request.avatar} alt={request.name} />
                          <AvatarFallback>
                            {request.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{request.name}</h3>
                          <p className="text-sm text-gray-600">{request.profession} at {request.company}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {request.mutualConnections} mutual connections
                            </Badge>
                            <span className="text-xs text-gray-500">{request.requestDate}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(request.id)}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectRequest(request.id)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending requests</h3>
                <p className="text-gray-500">You're all caught up! New connection requests will appear here.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConnectionsList;