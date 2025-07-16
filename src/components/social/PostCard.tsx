
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share, MoreHorizontal, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { CommentSection } from './CommentSection';

interface PostCardProps {
  post: {
    id: number;
    content: string;
    postType: string;
    attachmentUrl?: string;
    visibility: string;
    createdAt: string;
    author: {
      id: number;
      firstName: string;
      lastName: string;
      profilePictureUrl?: string;
      role: string;
    };
    reactions: Array<{
      id: number;
      reaction: string;
      user: {
        id: number;
        firstName: string;
        lastName: string;
      };
    }>;
    comments: Array<{
      id: number;
      content: string;
      createdAt: string;
      user: {
        id: number;
        firstName: string;
        lastName: string;
        profilePictureUrl?: string;
      };
    }>;
    _count: {
      reactions: number;
      comments: number;
    };
  };
  onUpdate: () => void;
}

export const PostCard = ({ post, onUpdate }: PostCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [userReaction, setUserReaction] = useState(
    post.reactions.find(r => r.user.id === parseInt(user?.id || '0'))?.reaction
  );

  const reactionMutation = useMutation({
    mutationFn: async (reaction: string) => {
      return apiClient.post(`/api/posts/${post.id}/reactions`, { reaction });
    },
    onSuccess: (result: any) => {
      if (result.action === 'removed') {
        setUserReaction(undefined);
      } else {
        setUserReaction(result.reaction);
      }
      onUpdate();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: 'Failed to update reaction. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async () => {
      return apiClient.delete(`/api/posts/${post.id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Post deleted',
        description: 'Your post has been deleted successfully.',
      });
      onUpdate();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: 'Failed to delete post. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleReaction = (reaction: string) => {
    reactionMutation.mutate(reaction);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      deletePostMutation.mutate();
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'platform_admin': return 'bg-red-100 text-red-800';
      case 'school_admin': return 'bg-blue-100 text-blue-800';
      case 'teacher': return 'bg-green-100 text-green-800';
      case 'alumni': return 'bg-purple-100 text-purple-800';
      case 'student': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        {/* Post Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={post.author.profilePictureUrl} />
              <AvatarFallback>
                {post.author.firstName.charAt(0)}{post.author.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold">
                  {post.author.firstName} {post.author.lastName}
                </h4>
                <Badge variant="secondary" className={getRoleColor(post.author.role)}>
                  {post.author.role.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          
          {user && post.author.id === parseInt(user.id) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-destructive"
                  disabled={deletePostMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-sm whitespace-pre-wrap">{post.content}</p>
          {post.attachmentUrl && (
            <div className="mt-3">
              <img 
                src={post.attachmentUrl} 
                alt="Post attachment" 
                className="rounded-lg max-w-full h-auto"
              />
            </div>
          )}
        </div>

        {/* Reaction Summary */}
        {post._count.reactions > 0 && (
          <div className="flex items-center space-x-2 mb-3 text-sm text-muted-foreground">
            <Heart className="h-4 w-4" />
            <span>{post._count.reactions} {post._count.reactions === 1 ? 'reaction' : 'reactions'}</span>
            {post._count.comments > 0 && (
              <>
                <span>•</span>
                <span>{post._count.comments} {post._count.comments === 1 ? 'comment' : 'comments'}</span>
              </>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction('like')}
              className={userReaction === 'like' ? 'text-red-600 hover:text-red-700' : ''}
              disabled={reactionMutation.isPending}
            >
              <Heart className={`h-4 w-4 mr-1 ${userReaction === 'like' ? 'fill-current' : ''}`} />
              Like
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Comment
            </Button>
            <Button variant="ghost" size="sm" disabled>
              <Share className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t">
            <CommentSection postId={post.id} comments={post.comments} onUpdate={onUpdate} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
