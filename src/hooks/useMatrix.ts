import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { matrixService, MatrixRoom, MatrixMessage } from '@/services/matrixService';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export const useMatrix = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [syncState, setSyncState] = useState<string>('STOPPED');
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize Matrix client
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      if (isAuthenticated && !matrixService.isConnected()) {
        const success = await matrixService.initialize();
        if (mounted) {
          setIsConnected(success);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  // Setup event listeners
  useEffect(() => {
    if (!isConnected) return;

    const handleNewMessage = ({ message, room }: { message: MatrixMessage; room: MatrixRoom }) => {
      // Update rooms cache
      queryClient.setQueryData(['matrix-rooms'], (old: MatrixRoom[] = []) => {
        return old.map(r => r.id === room.id ? { ...r, lastMessage: message, unreadCount: r.unreadCount + 1 } : r);
      });

      // Update messages cache
      queryClient.setQueryData(['matrix-messages', room.id], (old: MatrixMessage[] = []) => {
        return [...old, message];
      });

      // Show notification
      toast({
        title: 'New Message',
        description: `${message.sender.displayName}: ${message.content}`,
      });
    };

    const handleRoomUpdated = (room: MatrixRoom) => {
      queryClient.setQueryData(['matrix-rooms'], (old: MatrixRoom[] = []) => {
        return old.map(r => r.id === room.id ? room : r);
      });
    };

    const handleSyncStateChanged = (state: string) => {
      setSyncState(state);
      if (state === 'SYNCING') {
        queryClient.invalidateQueries({ queryKey: ['matrix-rooms'] });
      }
    };

    matrixService.on('newMessage', handleNewMessage);
    matrixService.on('roomUpdated', handleRoomUpdated);
    matrixService.on('syncStateChanged', handleSyncStateChanged);

    return () => {
      matrixService.off('newMessage', handleNewMessage);
      matrixService.off('roomUpdated', handleRoomUpdated);
      matrixService.off('syncStateChanged', handleSyncStateChanged);
    };
  }, [isConnected, queryClient, toast]);

  // Rooms queries
  const {
    data: allRooms = [],
    isLoading: loadingRooms,
    refetch: refetchRooms,
  } = useQuery({
    queryKey: ['matrix-rooms'],
    queryFn: matrixService.getRooms,
    enabled: isConnected,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const directRooms = allRooms.filter(room => room.isDirect);
  const groupRooms = allRooms.filter(room => !room.isDirect);

  // Messages query
  const getMessages = (roomId: string) => {
    return useQuery({
      queryKey: ['matrix-messages', roomId],
      queryFn: () => matrixService.getMessages(roomId),
      enabled: isConnected && !!roomId,
    });
  };

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ roomId, content }: { roomId: string; content: string }) => 
      matrixService.sendMessage(roomId, content),
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ['matrix-messages', roomId] });
      queryClient.invalidateQueries({ queryKey: ['matrix-rooms'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    },
  });

  // Create direct room mutation
  const createDirectRoomMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) => 
      matrixService.createDirectRoom(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrix-rooms'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create direct message',
        variant: 'destructive',
      });
    },
  });

  // Create group room mutation
  const createGroupRoomMutation = useMutation({
    mutationFn: ({ name, topic, isPublic }: { name: string; topic?: string; isPublic?: boolean }) => 
      matrixService.createGroupRoom(name, topic, isPublic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrix-rooms'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create group',
        variant: 'destructive',
      });
    },
  });

  // Send image mutation
  const sendImageMutation = useMutation({
    mutationFn: ({ roomId, file }: { roomId: string; file: File }) => 
      matrixService.sendImageMessage(roomId, file),
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ['matrix-messages', roomId] });
      queryClient.invalidateQueries({ queryKey: ['matrix-rooms'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to send image',
        variant: 'destructive',
      });
    },
  });

  const sendMessage = useCallback((roomId: string, content: string) => {
    sendMessageMutation.mutate({ roomId, content });
  }, [sendMessageMutation]);

  const createDirectRoom = useCallback((userId: string) => {
    return createDirectRoomMutation.mutateAsync({ userId });
  }, [createDirectRoomMutation]);

  const createGroupRoom = useCallback((name: string, topic?: string, isPublic?: boolean) => {
    return createGroupRoomMutation.mutateAsync({ name, topic, isPublic });
  }, [createGroupRoomMutation]);

  const sendImage = useCallback((roomId: string, file: File) => {
    sendImageMutation.mutate({ roomId, file });
  }, [sendImageMutation]);

  return {
    // Connection state
    isConnected,
    syncState,
    
    // Rooms
    allRooms,
    directRooms,
    groupRooms,
    loadingRooms,
    refetchRooms,
    
    // Messages
    getMessages,
    
    // Actions
    sendMessage,
    sendImage,
    createDirectRoom,
    createGroupRoom,
    
    // Loading states
    sendingMessage: sendMessageMutation.isPending,
    sendingImage: sendImageMutation.isPending,
    creatingDirectRoom: createDirectRoomMutation.isPending,
    creatingGroupRoom: createGroupRoomMutation.isPending,
  };
};