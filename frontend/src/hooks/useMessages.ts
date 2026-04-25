
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageService, DirectMessage, Conversation, GroupMessage, Group } from '@/services/messageService';
import { useSocket } from './useSocket';
import { useToast } from './use-toast';

export const useMessages = () => {
  const { socket } = useSocket();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Direct Messages
  const {
    data: conversations = [],
    isLoading: loadingConversations,
    refetch: refetchConversations,
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: messageService.getConversations,
  });

  const {
    data: groups = [],
    isLoading: loadingGroups,
    refetch: refetchGroups,
  } = useQuery({
    queryKey: ['groups'],
    queryFn: messageService.getGroups,
  });

  const sendDirectMessageMutation = useMutation({
    mutationFn: ({ receiverId, messageText, messageType, attachmentUrl }: {
      receiverId: number;
      messageText: string;
      messageType?: string;
      attachmentUrl?: string;
    }) => messageService.sendDirectMessage(receiverId, messageText, messageType, attachmentUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    },
  });

  const sendGroupMessageMutation = useMutation({
    mutationFn: ({ groupId, messageText, messageType, attachmentUrl }: {
      groupId: number;
      messageText: string;
      messageType?: string;
      attachmentUrl?: string;
    }) => messageService.sendGroupMessage(groupId, messageText, messageType, attachmentUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    },
  });

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleNewDirectMessage = (message: DirectMessage) => {
      queryClient.setQueryData(['conversations'], (old: Conversation[] = []) => {
        const existingConversation = old.find(conv => 
          conv.userId === message.senderId || conv.userId === message.receiverId
        );

        if (existingConversation) {
          return old.map(conv => 
            conv.userId === message.senderId || conv.userId === message.receiverId
              ? { ...conv, lastMessage: message, unreadCount: conv.unreadCount + 1 }
              : conv
          );
        } else {
          // Add new conversation
          return [{
            userId: message.senderId,
            user: message.sender,
            lastMessage: message,
            unreadCount: 1,
          }, ...old];
        }
      });

      // Show toast notification
      toast({
        title: 'New Message',
        description: `${message.sender.firstName} ${message.sender.lastName}: ${message.messageText}`,
      });
    };

    const handleNewGroupMessage = (message: GroupMessage) => {
      queryClient.setQueryData(['groups'], (old: Group[] = []) => {
        return old.map(group => 
          group.id === message.groupId
            ? { ...group, lastMessage: message, unreadCount: group.unreadCount + 1 }
            : group
        );
      });

      toast({
        title: 'New Group Message',
        description: `${message.sender.firstName} in group: ${message.messageText}`,
      });
    };

    socket.on('new_direct_message', handleNewDirectMessage);
    socket.on('new_group_message', handleNewGroupMessage);

    return () => {
      socket.off('new_direct_message', handleNewDirectMessage);
      socket.off('new_group_message', handleNewGroupMessage);
    };
  }, [socket, queryClient, toast]);

  const sendDirectMessage = useCallback((receiverId: number, messageText: string, messageType?: string, attachmentUrl?: string) => {
    sendDirectMessageMutation.mutate({ receiverId, messageText, messageType, attachmentUrl });
  }, [sendDirectMessageMutation]);

  const sendGroupMessage = useCallback((groupId: number, messageText: string, messageType?: string, attachmentUrl?: string) => {
    sendGroupMessageMutation.mutate({ groupId, messageText, messageType, attachmentUrl });
  }, [sendGroupMessageMutation]);

  return {
    conversations,
    groups,
    loadingConversations,
    loadingGroups,
    sendDirectMessage,
    sendGroupMessage,
    refetchConversations,
    refetchGroups,
    sendingDirectMessage: sendDirectMessageMutation.isPending,
    sendingGroupMessage: sendGroupMessageMutation.isPending,
  };
};
