import { useState, useEffect, useRef } from 'react';
import { useMatrix } from '@/hooks/useMatrix';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Send, Image, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface MatrixMessageThreadProps {
  roomId: string;
  onBack: () => void;
}

export const MatrixMessageThread = ({ roomId, onBack }: MatrixMessageThreadProps) => {
  const [newMessage, setNewMessage] = useState('');
  const { getMessages, sendMessage, sendingMessage, allRooms } = useMatrix();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = getMessages(roomId);
  const room = allRooms.find(r => r.id === roomId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && roomId) {
      sendMessage(roomId, newMessage.trim());
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center space-y-0 pb-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={room?.avatarUrl} />
            <AvatarFallback>
              {room?.name.substring(0, 2).toUpperCase() || 'R'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{room?.name || 'Room'}</h3>
            <p className="text-sm text-muted-foreground">
              {room?.memberCount} member{room?.memberCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4">
        <div className="flex-1 overflow-y-auto space-y-4 max-h-96">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.senderId === user?.id;
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {!isOwnMessage && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={message.sender.avatarUrl} />
                        <AvatarFallback>
                          {message.sender.displayName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`rounded-lg px-3 py-2 ${isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      {!isOwnMessage && (
                        <p className="text-xs font-medium mb-1">{message.sender.displayName}</p>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {format(new Date(message.timestamp), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={handleKeyPress}
            disabled={sendingMessage}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!newMessage.trim() || sendingMessage}
            size="icon"
          >
            {sendingMessage ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};