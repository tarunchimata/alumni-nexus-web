import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from '../utils/logger';

// Stub implementation for socket functionality
// Since the database doesn't have messaging models, this provides basic socket functionality

export class SocketServerStub {
  private io: SocketIOServer;
  private connectedUsers = new Map<string, string>(); // socketId -> userId

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:8080'],
        methods: ['GET', 'POST']
      }
    });

    this.setupEventHandlers();
    logger.info('Socket server stub initialized');
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      logger.info(`Socket connected: ${socket.id}`);

      socket.on('authenticate', (data: { userId: string }) => {
        this.connectedUsers.set(socket.id, data.userId);
        (socket as any).userId = data.userId;
        logger.info(`Socket authenticated: ${socket.id} for user: ${data.userId}`);
      });

      socket.on('disconnect', () => {
        const userId = this.connectedUsers.get(socket.id);
        if (userId) {
          this.connectedUsers.delete(socket.id);
          logger.info(`Socket disconnected: ${socket.id} for user: ${userId}`);
        }
      });

      // Stub message handlers - just log and emit basic responses
      socket.on('direct_message', (data) => {
        logger.info(`Direct message stub:`, data);
        socket.emit('message_sent', { id: Date.now(), status: 'stub' });
      });

      socket.on('group_message', (data) => {
        logger.info(`Group message stub:`, data);
        socket.emit('message_sent', { id: Date.now(), status: 'stub' });
      });

      socket.on('send_notification', (data) => {
        logger.info(`Notification stub:`, data);
        socket.emit('notification_sent', { id: Date.now(), status: 'stub' });
      });
    });
  }

  // Stub methods for broadcasting
  public broadcastToUser(userId: string, event: string, data: any): void {
    // Find user's socket and emit
    for (const [socketId, connectedUserId] of this.connectedUsers.entries()) {
      if (connectedUserId === userId) {
        this.io.to(socketId).emit(event, data);
        break;
      }
    }
  }

  public broadcastToAll(event: string, data: any): void {
    this.io.emit(event, data);
  }

  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }
}

// Export instance for use in main app
export let socketServer: SocketServerStub | null = null;

// Also export the class for instantiation
export { SocketServerStub as SocketServer };
