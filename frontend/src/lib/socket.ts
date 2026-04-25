
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;

  connect(token: string) {
    if (this.socket?.connected) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://api.myschoolbuddies.com' 
        : 'http://localhost:3001');

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

    return this.socket;
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
