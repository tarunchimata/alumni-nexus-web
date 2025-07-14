
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useMessages } from '@/hooks/useMessages';

interface NewMessageModalProps {
  open: boolean;
  onClose: () => void;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string;
  role: string;
}

export const NewMessageModal = ({ open, onClose }: NewMessageModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState('');
  const { sendDirectMessage } = useMessages();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', searchTerm],
    queryFn: () => apiClient.get(`/api/users?search=${searchTerm}&limit=20`),
    enabled: searchTerm.length > 2,
  });

  const handleSendMessage = () => {
    if (selectedUser && message.trim()) {
      sendDirectMessage(selectedUser.id, message.trim());
      setMessage('');
      setSelectedUser(null);
      setSearchTerm('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!selectedUser ? (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for people..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <ScrollArea className="h-64">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : searchTerm.length > 2 && users.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No users found
                  </div>
                ) : (
                  <div className="space-y-2">
                    {users.map((user: User) => (
                      <div
                        key={user.id}
                        className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedUser(user)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            {user.profilePictureUrl ? (
                              <img
                                src={user.profilePictureUrl}
                                alt={`${user.firstName} ${user.lastName}`}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-medium">
                                {user.firstName[0]}{user.lastName[0]}
                              </span>
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium">
                              {user.firstName} {user.lastName}
                            </h4>
                            <p className="text-sm text-muted-foreground capitalize">
                              {user.role.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {selectedUser.profilePictureUrl ? (
                    <img
                      src={selectedUser.profilePictureUrl}
                      alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium">
                      {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-medium">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h4>
                  <p className="text-sm text-muted-foreground capitalize">
                    {selectedUser.role.replace('_', ' ')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUser(null)}
                  className="ml-auto"
                >
                  Change
                </Button>
              </div>
              
              <div className="space-y-2">
                <Input
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleSendMessage} disabled={!message.trim()}>
                    Send Message
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
