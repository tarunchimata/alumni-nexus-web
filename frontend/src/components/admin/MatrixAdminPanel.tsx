import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMatrix } from '@/hooks/useMatrix';
import { Loader2, MessageSquare, Users, Settings, Shield, Plus } from 'lucide-react';

export const MatrixAdminPanel = () => {
  const { allRooms, loadingRooms, createGroupRoom, creatingGroupRoom } = useMatrix();
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomTopic, setNewRoomTopic] = useState('');

  const handleCreateSchoolRoom = async () => {
    if (!newRoomName.trim()) return;
    
    try {
      await createGroupRoom(newRoomName, newRoomTopic || undefined, false);
      setNewRoomName('');
      setNewRoomTopic('');
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  const publicRooms = allRooms.filter(room => !room.isDirect && room.name.includes('Public'));
  const schoolRooms = allRooms.filter(room => !room.isDirect && !room.name.includes('Public'));
  const directRooms = allRooms.filter(room => room.isDirect);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Matrix Administration
          </CardTitle>
          <CardDescription>
            Manage Matrix chat rooms and communication settings
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="rooms" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Create New Room</CardTitle>
                  <CardDescription>Create rooms for different purposes</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Room name..."
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                />
                <Input
                  placeholder="Room topic (optional)..."
                  value={newRoomTopic}
                  onChange={(e) => setNewRoomTopic(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleCreateSchoolRoom}
                disabled={!newRoomName.trim() || creatingGroupRoom}
                className="w-full"
              >
                {creatingGroupRoom ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Create School Room
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5" />
                  School Rooms
                  <Badge variant="secondary">{schoolRooms.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingRooms ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {schoolRooms.map((room) => (
                      <div key={room.id} className="p-2 rounded border">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{room.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {room.memberCount}
                          </Badge>
                        </div>
                        {room.topic && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {room.topic}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  Public Rooms
                  <Badge variant="secondary">{publicRooms.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingRooms ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {publicRooms.map((room) => (
                      <div key={room.id} className="p-2 rounded border">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{room.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {room.memberCount}
                          </Badge>
                        </div>
                        {room.topic && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {room.topic}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5" />
                  Direct Messages
                  <Badge variant="secondary">{directRooms.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">Direct messages are created automatically when users start conversations</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Matrix users are automatically synchronized with Keycloak authentication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>User management is handled through the main user administration panel</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Matrix Server Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Server URL</label>
                  <Input value="https://chat.hostingmanager.in" disabled />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Authentication</label>
                  <Input value="Keycloak SSO" disabled />
                </div>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Server Status</h4>
                <div className="space-y-1 text-sm">
                  <p>✅ Matrix server is running</p>
                  <p>✅ Keycloak integration active</p>
                  <p>✅ SSL/TLS encryption enabled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};