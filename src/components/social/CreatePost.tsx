
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageIcon, Globe, Users, Lock } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface CreatePostProps {
  onPostCreated: (post: any) => void;
  context?: 'global' | 'school' | 'class' | 'alumni';
  placeholder?: string;
}

export const CreatePost = ({ onPostCreated, context = 'global', placeholder = "What's on your mind?" }: CreatePostProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [isExpanded, setIsExpanded] = useState(false);

  const createPostMutation = useMutation({
    mutationFn: async (data: { content: string; visibility: string }) => {
      return apiClient.post('/api/posts', data);
    },
    onSuccess: (newPost) => {
      setContent('');
      setIsExpanded(false);
      onPostCreated(newPost);
      toast({
        title: 'Post created',
        description: 'Your post has been shared successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create post. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = () => {
    if (!content.trim()) return;
    
    createPostMutation.mutate({
      content: content.trim(),
      visibility,
    });
  };

  const visibilityOptions = [
    { value: 'public', label: 'Public', icon: Globe },
    { value: 'school_only', label: 'School Only', icon: Users },
    { value: 'alumni_only', label: 'Alumni Only', icon: Users },
    { value: 'connections_only', label: 'Connections Only', icon: Lock },
  ];

  if (!user) return null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex space-x-3">
          <Avatar>
            <AvatarImage src={user.avatar} />
            <AvatarFallback>
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder={placeholder}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              className="min-h-[60px] resize-none border-none shadow-none text-base"
              maxLength={2000}
            />
            
            {isExpanded && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                      disabled
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Photo
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Select value={visibility} onValueChange={setVisibility}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {visibilityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center space-x-2">
                              <option.icon className="h-4 w-4" />
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {content.length}/2000
                  </span>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setContent('');
                        setIsExpanded(false);
                      }}
                      disabled={createPostMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={!content.trim() || createPostMutation.isPending}
                    >
                      {createPostMutation.isPending ? 'Posting...' : 'Post'}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
