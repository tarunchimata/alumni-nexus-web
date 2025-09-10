import { createClient, MatrixClient, Room, MatrixEvent, RoomMember } from 'matrix-js-sdk';
import { authService } from '@/lib/auth';

export interface MatrixMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  timestamp: number;
  type: 'text' | 'image' | 'file';
  sender: {
    displayName: string;
    avatarUrl?: string;
  };
}

export interface MatrixRoom {
  id: string;
  name: string;
  topic?: string;
  avatarUrl?: string;
  memberCount: number;
  unreadCount: number;
  lastMessage?: MatrixMessage;
  isDirect: boolean;
  isEncrypted: boolean;
}

class MatrixService {
  private client: MatrixClient | null = null;
  private isInitialized = false;
  private eventHandlers = new Map<string, Function[]>();

  async initialize(): Promise<boolean> {
    try {
      console.log('[Matrix] Initializing Matrix client...');

      // Get Keycloak token for Matrix authentication
      const isAuthenticated = await authService.isAuthenticated();
      if (!isAuthenticated) {
        console.log('[Matrix] User not authenticated with Keycloak');
        return false;
      }

      const userInfo = await authService.getUserInfo();
      if (!userInfo) {
        console.log('[Matrix] Could not get user info');
        return false;
      }

      // Create Matrix client with base URL
      this.client = createClient({
        baseUrl: 'https://chat.hostingmanager.in',
        userId: `@${userInfo.email.split('@')[0]}:chat.hostingmanager.in`,
        deviceId: this.generateDeviceId(),
      });

      // Login to Matrix using Keycloak SSO
      await this.loginWithKeycloak();
      
      // Start client
      await this.client.startClient({ initialSyncLimit: 20 });

      // Setup event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      console.log('[Matrix] Client initialized successfully');
      return true;
    } catch (error) {
      console.error('[Matrix] Initialization failed:', error);
      return false;
    }
  }

  private async loginWithKeycloak(): Promise<void> {
    if (!this.client) throw new Error('Matrix client not created');

    try {
      // Use SSO login with OIDC provider
      const loginUrl = `${this.client.getHomeserverUrl()}/_matrix/client/v3/login/sso/redirect/oidc-keycloak?redirectUrl=${encodeURIComponent(window.location.origin)}`;
      
      // For now, we'll use a simplified approach
      // In production, this would redirect to Matrix SSO endpoint
      const userInfo = await authService.getUserInfo();
      if (!userInfo) throw new Error('No user info available');

      // Generate a temporary password for Matrix login
      const matrixPassword = await this.generateMatrixPassword(userInfo.id);
      
      await this.client.loginWithPassword(
        `@${userInfo.email.split('@')[0]}:chat.hostingmanager.in`,
        matrixPassword
      );
    } catch (error) {
      console.error('[Matrix] Login failed:', error);
      throw error;
    }
  }

  private async generateMatrixPassword(userId: string): Promise<string> {
    // In production, this would be handled by Matrix server integration
    // For now, use a deterministic password based on user ID
    const encoder = new TextEncoder();
    const data = encoder.encode(`matrix_${userId}_${Date.now()}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
  }

  private generateDeviceId(): string {
    return `MYSCHOOLBUDDIES_${Math.random().toString(36).substring(2, 15)}`;
  }

  private setupEventListeners(): void {
    if (!this.client) return;

    // Room timeline events (new messages)
    this.client.on('Room.timeline' as any, (event: MatrixEvent, room: Room) => {
      if (event.getType() === 'm.room.message') {
        const message = this.convertEventToMessage(event, room);
        this.emit('newMessage', { message, room: this.convertRoomToMatrixRoom(room) });
      }
    });

    // Room state changes
    this.client.on('Room.name' as any, (room: Room) => {
      this.emit('roomUpdated', this.convertRoomToMatrixRoom(room));
    });

    // Sync state updates
    this.client.on('sync' as any, (state: string) => {
      this.emit('syncStateChanged', state);
    });
  }

  // Room Management
  async getRooms(): Promise<MatrixRoom[]> {
    if (!this.client) return [];

    const rooms = this.client.getVisibleRooms();
    return rooms.map(room => this.convertRoomToMatrixRoom(room));
  }

  async getDirectRooms(): Promise<MatrixRoom[]> {
    const rooms = await this.getRooms();
    return rooms.filter(room => room.isDirect);
  }

  async getGroupRooms(): Promise<MatrixRoom[]> {
    const rooms = await this.getRooms();
    return rooms.filter(room => !room.isDirect);
  }

  async createDirectRoom(userId: string): Promise<string> {
    if (!this.client) throw new Error('Matrix client not initialized');

    const response = await this.client.createRoom({
      is_direct: true,
      invite: [userId],
      preset: 'trusted_private_chat' as any,
    });

    return response.room_id;
  }

  async createGroupRoom(name: string, topic?: string, isPublic = false): Promise<string> {
    if (!this.client) throw new Error('Matrix client not initialized');

    const response = await this.client.createRoom({
      name,
      topic,
      preset: (isPublic ? 'public_chat' : 'private_chat') as any,
      visibility: (isPublic ? 'public' : 'private') as any,
    });

    return response.room_id;
  }

  // Messaging
  async sendMessage(roomId: string, content: string): Promise<void> {
    if (!this.client) throw new Error('Matrix client not initialized');

    await this.client.sendTextMessage(roomId, content);
  }

  async sendImageMessage(roomId: string, file: File): Promise<void> {
    if (!this.client) throw new Error('Matrix client not initialized');

    const response = await this.client.uploadContent(file);
    await this.client.sendMessage(roomId, {
      msgtype: 'm.image' as any,
      body: file.name,
      url: response.content_uri,
    });
  }

  async getMessages(roomId: string, limit = 50): Promise<MatrixMessage[]> {
    if (!this.client) return [];

    const room = this.client.getRoom(roomId);
    if (!room) return [];

    const timeline = room.getLiveTimeline();
    const events = timeline.getEvents().slice(-limit);

    return events
      .filter(event => event.getType() === 'm.room.message')
      .map(event => this.convertEventToMessage(event, room));
  }

  // Utility methods
  private convertEventToMessage(event: MatrixEvent, room: Room): MatrixMessage {
    const sender = room.getMember(event.getSender()!);
    const content = event.getContent();

    return {
      id: event.getId()!,
      roomId: room.roomId,
      senderId: event.getSender()!,
      content: content.body || '',
      timestamp: event.getTs(),
      type: content.msgtype === 'm.image' ? 'image' : 'text',
      sender: {
        displayName: sender?.name || event.getSender()!,
        avatarUrl: sender?.getAvatarUrl(this.client?.getHomeserverUrl() || '', 32, 32, 'scale', false) || undefined,
      },
    };
  }

  private convertRoomToMatrixRoom(room: Room): MatrixRoom {
    const timeline = room.getLiveTimeline();
    const lastEvent = timeline.getEvents().slice(-1)[0];
    
    return {
      id: room.roomId,
      name: room.name || 'Unnamed Room',
      topic: room.currentState.getStateEvents('m.room.topic', '')?.getContent()?.topic,
      avatarUrl: room.getAvatarUrl(this.client?.getHomeserverUrl() || '', 64, 64, 'scale', false) || undefined,
      memberCount: room.getJoinedMemberCount(),
      unreadCount: room.getUnreadNotificationCount(),
      lastMessage: lastEvent ? this.convertEventToMessage(lastEvent, room) : undefined,
      isDirect: room.guessDMUserId() !== null,
      isEncrypted: this.client?.isRoomEncrypted(room.roomId) || false,
    };
  }

  // Event system
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  // Cleanup
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.stopClient();
      this.client = null;
      this.isInitialized = false;
    }
  }

  isConnected(): boolean {
    return this.isInitialized && this.client !== null;
  }
}

export const matrixService = new MatrixService();