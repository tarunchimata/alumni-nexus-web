import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;

  connect(token: string): Socket {
    if (this.socket?.connected) return this.socket;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 
      (import.meta.env.PROD 
        ? import.meta.env.VITE_BACKEND_API_URL 
        : 'http://localhost:3033');

    this.socket = io(socketUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected to server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
    });

    // Handle real-time events
    this.setupEventHandlers();

    return this.socket;
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    // Handle incoming messages
    this.socket.on('new_direct_message', (message) => {
      console.log('[Socket] New direct message:', message);
      // Dispatch custom event for components to listen
      window.dispatchEvent(new CustomEvent('new_direct_message', { detail: message }));
    });

    this.socket.on('new_group_message', (message) => {
      console.log('[Socket] New group message:', message);
      window.dispatchEvent(new CustomEvent('new_group_message', { detail: message }));
    });

    // Handle notifications
    this.socket.on('new_notification', (notification) => {
      console.log('[Socket] New notification:', notification);
      window.dispatchEvent(new CustomEvent('new_notification', { detail: notification }));
    });

    // Handle user status changes
    this.socket.on('user_status_change', (data) => {
      console.log('[Socket] User status change:', data);
      window.dispatchEvent(new CustomEvent('user_status_change', { detail: data }));
    });

    // Handle typing indicators
    this.socket.on('user_typing', (data) => {
      window.dispatchEvent(new CustomEvent('user_typing', { detail: data }));
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Message events
  sendDirectMessage(data: { receiverId: number; message: string; type?: string }) {
    if (this.socket) {
      this.socket.emit('send_direct_message', data);
    }
  }

  sendGroupMessage(data: { groupId: number; message: string; type?: string }) {
    if (this.socket) {
      this.socket.emit('send_group_message', data);
    }
  }

  joinRoom(roomId: string) {
    if (this.socket) {
      this.socket.emit('join_room', roomId);
    }
  }

  leaveRoom(roomId: string) {
    if (this.socket) {
      this.socket.emit('leave_room', roomId);
    }
  }

  // Typing indicators
  startTyping(roomId: string) {
    if (this.socket) {
      this.socket.emit('typing_start', { roomId });
    }
  }

  stopTyping(roomId: string) {
    if (this.socket) {
      this.socket.emit('typing_stop', { roomId });
    }
  }

  // Online status
  updateOnlineStatus(status: 'online' | 'away' | 'offline') {
    if (this.socket) {
      this.socket.emit('status_update', { status });
    }
  }
}

export const socketService = new SocketService();