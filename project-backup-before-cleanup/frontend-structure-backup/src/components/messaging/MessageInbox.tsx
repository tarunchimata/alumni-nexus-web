
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Users, MessageCircle } from 'lucide-react';
import { useMessages } from '@/hooks/useMessages';
import { MessageThread } from './MessageThread';
import { NewMessageModal } from './NewMessageModal';

export const MessageInbox = () => {
  const { conversations, groups, loadingConversations, loadingGroups } = useMessages();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [showNewMessage, setShowNewMessage] = useState(false);

  const filteredConversations = conversations.filter(conv =>
    `${conv.user.firstName} ${conv.user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedConversation) {
    return (
      <MessageThread
        type="direct"
        id={selectedConversation}
        onBack={() => setSelectedConversation(null)}
      />
    );
  }

  if (selectedGroup) {
    return (
      <MessageThread
        type="group"
        id={selectedGroup}
        onBack={() => setSelectedGroup(null)}
      />
    );
  }

  return (
    <div className="flex h-full">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Messages
            </CardTitle>
            <Button onClick={() => setShowNewMessage(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Message
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="direct" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="direct">Direct Messages</TabsTrigger>
              <TabsTrigger value="groups">Groups</TabsTrigger>
            </TabsList>
            
            <TabsContent value="direct" className="mt-4">
              <ScrollArea className="h-[500px]">
                {loadingConversations ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No conversations found
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredConversations.map((conversation) => (
                      <div
                        key={conversation.userId}
                        className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedConversation(conversation.userId)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            {conversation.user.profilePictureUrl ? (
                              <img
                                src={conversation.user.profilePictureUrl}
                                alt={`${conversation.user.firstName} ${conversation.user.lastName}`}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-medium">
                                {conversation.user.firstName[0]}{conversation.user.lastName[0]}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium truncate">
                                {conversation.user.firstName} {conversation.user.lastName}
                              </h3>
                              {conversation.unreadCount > 0 && (
                                <Badge variant="secondary" className="ml-2">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.lastMessage.messageText}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(conversation.lastMessage.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="groups" className="mt-4">
              <ScrollArea className="h-[500px]">
                {loadingGroups ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : filteredGroups.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No groups found
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredGroups.map((group) => (
                      <div
                        key={group.id}
                        className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedGroup(group.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium truncate">{group.name}</h3>
                              {group.unreadCount > 0 && (
                                <Badge variant="secondary" className="ml-2">
                                  {group.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {group.memberCount} members
                            </p>
                            {group.lastMessage && (
                              <p className="text-sm text-muted-foreground truncate">
                                {group.lastMessage.sender.firstName}: {group.lastMessage.messageText}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <NewMessageModal
        open={showNewMessage}
        onClose={() => setShowNewMessage(false)}
      />
    </div>
  );
};
