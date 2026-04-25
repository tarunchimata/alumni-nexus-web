
import { apiClient } from '@/lib/api';

export interface DirectMessage {
  id: number;
  senderId: number;
  receiverId: number;
  messageText: string;
  messageType: 'text' | 'image' | 'file';
  attachmentUrl?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  sender: {
    id: number;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
  };
  receiver: {
    id: number;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
  };
}

export interface Conversation {
  userId: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
  };
  lastMessage: DirectMessage;
  unreadCount: number;
}

export interface GroupMessage {
  id: number;
  groupId: number;
  senderId: number;
  messageText: string;
  messageType: 'text' | 'image' | 'file';
  attachmentUrl?: string;
  createdAt: string;
  sender: {
    id: number;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
  };
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  groupType: string;
  isPublic: boolean;
  memberCount: number;
  unreadCount: number;
  lastMessage?: GroupMessage;
}

export const messageService = {
  // Direct Messages
  async getConversations(): Promise<Conversation[]> {
    return apiClient.get('/api/messages/conversations');
  },

  async getDirectMessages(userId: number, page = 1, limit = 50): Promise<DirectMessage[]> {
    return apiClient.get(`/api/messages/direct/${userId}?page=${page}&limit=${limit}`);
  },

  async sendDirectMessage(receiverId: number, messageText: string, messageType = 'text', attachmentUrl?: string): Promise<DirectMessage> {
    return apiClient.post('/api/messages/direct', {
      receiverId,
      messageText,
      messageType,
      attachmentUrl,
    });
  },

  async markDirectMessageAsRead(messageId: number): Promise<void> {
    return apiClient.put(`/api/messages/direct/${messageId}/read`, {});
  },

  async markConversationAsRead(userId: number): Promise<void> {
    return apiClient.put(`/api/messages/conversations/${userId}/read`, {});
  },

  // Group Messages
  async getGroups(): Promise<Group[]> {
    return apiClient.get('/api/messages/groups');
  },

  async getGroupMessages(groupId: number, page = 1, limit = 50): Promise<GroupMessage[]> {
    return apiClient.get(`/api/messages/groups/${groupId}/messages?page=${page}&limit=${limit}`);
  },

  async sendGroupMessage(groupId: number, messageText: string, messageType = 'text', attachmentUrl?: string): Promise<GroupMessage> {
    return apiClient.post(`/api/messages/groups/${groupId}/messages`, {
      messageText,
      messageType,
      attachmentUrl,
    });
  },

  async joinGroup(groupId: number): Promise<void> {
    return apiClient.post(`/api/groups/${groupId}/join`, {});
  },

  async leaveGroup(groupId: number): Promise<void> {
    return apiClient.delete(`/api/groups/${groupId}/leave`);
  },

  async createGroup(name: string, description: string, groupType: string, isPublic: boolean): Promise<Group> {
    return apiClient.post('/api/groups', {
      name,
      description,
      groupType,
      isPublic,
    });
  },

  // File upload
  async uploadFile(file: File): Promise<{ url: string }> {
    return apiClient.uploadFile('/api/messages/upload', file);
  },
};
