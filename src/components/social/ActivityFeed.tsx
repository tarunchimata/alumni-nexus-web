
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import InfiniteScroll from 'react-infinite-scroll-component';
import { apiClient } from '@/lib/api';
import { PostCard } from './PostCard';
import { CreatePost } from './CreatePost';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Post {
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
}

export const ActivityFeed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['posts', page],
    queryFn: async (): Promise<Post[]> => {
      const response = await apiClient.get<Post[]>(`/api/posts?page=${page}&limit=10`);
      return response;
    },
    enabled: true,
  });

  const loadMorePosts = async () => {
    try {
      const nextPage = page + 1;
      const response = await apiClient.get<Post[]>(`/api/posts?page=${nextPage}&limit=10`);
      
      if (response.length === 0) {
        setHasMore(false);
      } else {
        setPosts(prev => [...prev, ...response]);
        setPage(nextPage);
      }
    } catch (error) {
      console.error('Failed to load more posts:', error);
    }
  };

  // Initialize posts when data is loaded
  useState(() => {
    if (data && page === 1) {
      setPosts(data);
      if (data.length < 10) {
        setHasMore(false);
      }
    }
  }, [data, page]);

  const handlePostCreated = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
  };

  if (isLoading && posts.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <Skeleton className="h-20 w-full" />
        </Card>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-16 w-full" />
              <div className="flex space-x-4">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CreatePost onPostCreated={handlePostCreated} />
      
      <InfiniteScroll
        dataLength={posts.length}
        next={loadMorePosts}
        hasMore={hasMore}
        loader={
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        }
        endMessage={
          <p className="text-center text-muted-foreground py-8">
            {posts.length === 0 ? 'No posts yet. Be the first to share something!' : 'No more posts to load.'}
          </p>
        }
      >
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onUpdate={refetch} />
          ))}
        </div>
      </InfiniteScroll>
    </div>
  );
};
