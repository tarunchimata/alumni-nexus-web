import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMatrix } from '@/hooks/useMatrix';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, MessageSquare, Users } from 'lucide-react';
import { apiService } from '@/services/apiService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MatrixNewMessageModalProps {
  open: boolean;
  onClose: () => void;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string;
  role: string;
  email: string;
}

export const MatrixNewMessageModal = ({ open, onClose }: MatrixNewMessageModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupTopic, setGroupTopic] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  
  const { createDirectRoom, createGroupRoom, creatingDirectRoom, creatingGroupRoom } = useMatrix();

  // Search for users
  const { data: users = [], isLoading: searchingUsers } = useQuery({
    queryKey: ['users', searchTerm],
    queryFn: async () => {
      const response = await apiService.getUsers({ search: searchTerm });
      return Array.isArray(response) ? response : [];
    },
    enabled: searchTerm.length >= 3,
  });

  const handleStartDirectMessage = async () => {
    if (!selectedUser) return;

    try {
      const matrixUserId = `@${selectedUser.email.split('@')[0]}:chat.hostingmanager.in`;
      const roomId = await createDirectRoom(matrixUserId);
      onClose();
      // Note: The parent component should handle navigating to the new room
    } catch (error) {
      console.error('Failed to create direct message:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;

    try {
      const roomId = await createGroupRoom(groupName, groupTopic || undefined, isPublic);
      setGroupName('');
      setGroupTopic('');
      setIsPublic(false);
      onClose();
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
          <DialogDescription>
            Start a direct conversation or create a group
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="direct" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="direct" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Direct Message
            </TabsTrigger>
            <TabsTrigger value="group" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Create Group
            </TabsTrigger>
          </TabsList>

          <TabsContent value="direct" className="space-y-4">
            {!selectedUser ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search for a user..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2">
                  {searchingUsers && searchTerm.length >= 3 && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}

                  {searchTerm.length >= 3 && !searchingUsers && users.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      No users found
                    </p>
                  )}

                  {users.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profilePictureUrl} />
                        <AvatarFallback>
                          {user.firstName[0]}{user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {user.role}
                      </Badge>
                    </div>
                  ))}
                </div>

                {searchTerm.length < 3 && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    Type at least 3 characters to search for users
                  </p>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 rounded-lg border">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedUser.profilePictureUrl} />
                    <AvatarFallback>
                      {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedUser.email}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {selectedUser.role}
                  </Badge>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setSelectedUser(null)} className="flex-1">
                    Back
                  </Button>
                  <Button 
                    onClick={handleStartDirectMessage} 
                    disabled={creatingDirectRoom}
                    className="flex-1"
                  >
                    {creatingDirectRoom ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Start Chat'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="group" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="Group name..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>
              
              <div>
                <Input
                  placeholder="Group topic (optional)..."
                  value={groupTopic}
                  onChange={(e) => setGroupTopic(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="public-group"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="public-group" className="text-sm">
                  Make this group public
                </label>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateGroup} 
                  disabled={!groupName.trim() || creatingGroupRoom}
                  className="flex-1"
                >
                  {creatingGroupRoom ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Create Group'
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};