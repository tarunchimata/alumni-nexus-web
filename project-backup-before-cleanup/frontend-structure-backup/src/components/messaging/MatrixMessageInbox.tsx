import { useState } from 'react';
import { MatrixMessageThread } from './MatrixMessageThread';
import { MatrixNewMessageModal } from './MatrixNewMessageModal';
import { useMatrix } from '@/hooks/useMatrix';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, MessageSquarePlus, Users, MessageCircle, Loader2, Wifi, WifiOff } from 'lucide-react';

export const MatrixMessageInbox = () => {
  const { 
    directRooms, 
    groupRooms, 
    loadingRooms, 
    isConnected, 
    syncState 
  } = useMatrix();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [showNewMessage, setShowNewMessage] = useState(false);

  // Filter rooms based on search term
  const filteredDirectRooms = directRooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroupRooms = groupRooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show message thread if a room is selected
  if (selectedRoom) {
    return (
      <MatrixMessageThread
        roomId={selectedRoom}
        onBack={() => setSelectedRoom(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                Messages
                {isConnected ? (
                  <Wifi className="h-5 w-5 text-green-500" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-500" />
                )}
                {syncState === 'SYNCING' && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </CardTitle>
              <CardDescription>
                {isConnected 
                  ? `Connect with your school community • ${syncState.toLowerCase()}` 
                  : 'Connecting to Matrix chat server...'
                }
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowNewMessage(true)} 
              className="flex items-center gap-2"
              disabled={!isConnected}
            >
              <MessageSquarePlus className="h-4 w-4" />
              New Message
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Tabs defaultValue="direct" className="w-full">
              <TabsList>
                <TabsTrigger value="direct">Direct Messages</TabsTrigger>
                <TabsTrigger value="groups">Groups</TabsTrigger>
              </TabsList>

              <TabsContent value="direct" className="space-y-4">
                {loadingRooms ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredDirectRooms.length > 0 ? (
                  <div className="space-y-2">
                    {filteredDirectRooms.map((room) => (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoom(room.id)}
                        className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={room.avatarUrl} />
                          <AvatarFallback>
                            {room.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {room.name}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {room.lastMessage?.content || 'No messages yet'}
                          </p>
                        </div>
                        {room.unreadCount > 0 && (
                          <Badge variant="default" className="ml-auto">
                            {room.unreadCount}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No direct messages found</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="groups" className="space-y-4">
                {loadingRooms ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredGroupRooms.length > 0 ? (
                  <div className="space-y-2">
                    {filteredGroupRooms.map((room) => (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoom(room.id)}
                        className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                      >
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{room.name}</p>
                            <Badge variant="outline" className="text-xs">
                              {room.memberCount} members
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {room.lastMessage?.content || 'No messages yet'}
                          </p>
                        </div>
                        {room.unreadCount > 0 && (
                          <Badge variant="default" className="ml-auto">
                            {room.unreadCount}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No groups found</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      <MatrixNewMessageModal
        open={showNewMessage}
        onClose={() => setShowNewMessage(false)}
      />
    </div>
  );
};