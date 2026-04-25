import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
  };
}

interface CommentSectionProps {
  postId: number;
  comments: Comment[];
  onUpdate: () => void;
}

export const CommentSection = ({ postId, comments, onUpdate }: CommentSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState('');

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiClient.post(`/api/posts/${postId}/comments`, { content });
    },
    onSuccess: () => {
      setNewComment('');
      onUpdate();
      toast({
        title: 'Comment added',
        description: 'Your comment has been posted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: 'Failed to add comment. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing Comments */}
      {comments.map((comment) => (
        <div key={comment.id} className="flex space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.user.profilePictureUrl} />
            <AvatarFallback className="text-xs">
              {comment.user.firstName.charAt(0)}{comment.user.lastName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <h5 className="font-medium text-sm">
                  {comment.user.firstName} {comment.user.lastName}
                </h5>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
            </div>
          </div>
        </div>
      ))}

      {/* Add New Comment */}
      {user && (
        <div className="flex space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="text-xs">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[60px] resize-none"
              maxLength={1000}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                Press Ctrl+Enter to post
              </span>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!newComment.trim() || addCommentMutation.isPending}
              >
                <Send className="h-3 w-3 mr-1" />
                {addCommentMutation.isPending ? 'Posting...' : 'Comment'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
