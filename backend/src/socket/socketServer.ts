import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { prisma } from '../index';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  userRole?: string;
}

export class SocketServer {
  private io: SocketIOServer;
  private onlineUsers = new Map<number, string>(); // userId -> socketId

  constructor(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ["http://localhost:8080", "https://school.hostingmanager.in"],
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupAuthentication();
    this.setupEventHandlers();
  }

  private setupAuthentication() {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          logger.warn('Socket connection attempted without token');
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
        
        // Get user from database
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { id: true, role: true, isActive: true }
        });

        if (!user || !user.isActive) {
          logger.warn(`Socket auth failed for user ${decoded.id}`);
          return next(new Error('Invalid user'));
        }

        socket.userId = user.id;
        socket.userRole = user.role;
        
        logger.info(`Socket authenticated for user ${user.id} with role ${user.role}`);
        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const userId = socket.userId!;
      
      logger.info(`User ${userId} connected via socket ${socket.id}`);
      
      // Track online user
      this.onlineUsers.set(userId, socket.id);
      
      // Join user-specific room
      socket.join(`user_${userId}`);
      
      // Broadcast user online status
      this.broadcastUserStatus(userId, 'online');

      // Handle direct messages
      socket.on('send_direct_message', async (data) => {
        await this.handleDirectMessage(socket, data);
      });

      // Handle group messages
      socket.on('send_group_message', async (data) => {
        await this.handleGroupMessage(socket, data);
      });

      // Handle room joining
      socket.on('join_room', (roomId: string) => {
        socket.join(roomId);
        logger.info(`User ${userId} joined room ${roomId}`);
      });

      // Handle room leaving
      socket.on('leave_room', (roomId: string) => {
        socket.leave(roomId);
        logger.info(`User ${userId} left room ${roomId}`);
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        socket.to(data.roomId).emit('user_typing', { userId, isTyping: true });
      });

      socket.on('typing_stop', (data) => {
        socket.to(data.roomId).emit('user_typing', { userId, isTyping: false });
      });

      // Handle status updates
      socket.on('status_update', (data) => {
        this.broadcastUserStatus(userId, data.status);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`User ${userId} disconnected`);
        this.onlineUsers.delete(userId);
        this.broadcastUserStatus(userId, 'offline');
      });
    });
  }

  private async handleDirectMessage(socket: AuthenticatedSocket, data: any) {
    try {
      const { receiverId, message, type = 'text' } = data;
      const senderId = socket.userId!;

      logger.info(`Direct message from ${senderId} to ${receiverId}`);

      // Save message to database
      const directMessage = await prisma.directMessage.create({
        data: {
          senderId,
          receiverId: parseInt(receiverId),
          messageText: message,
          messageType: type as any
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePictureUrl: true
            }
          }
        }
      });

      // Send to receiver if online
      const receiverSocketId = this.onlineUsers.get(parseInt(receiverId));
      if (receiverSocketId) {
        this.io.to(receiverSocketId).emit('new_direct_message', {
          ...directMessage,
          sender: directMessage.sender
        });
      }

      // Send confirmation to sender
      socket.emit('message_sent', { messageId: directMessage.id, status: 'sent' });

      // Create notification for receiver
      await this.createNotification(parseInt(receiverId), 'message', 'New message', `New message from ${directMessage.sender.firstName}`, directMessage.id);

    } catch (error) {
      logger.error('Direct message error:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  }

  private async handleGroupMessage(socket: AuthenticatedSocket, data: any) {
    try {
      const { groupId, message, type = 'text' } = data;
      const senderId = socket.userId!;

      logger.info(`Group message from ${senderId} to group ${groupId}`);

      // Save message to database
      const groupMessage = await prisma.groupMessage.create({
        data: {
          groupId: parseInt(groupId),
          senderId,
          messageText: message,
          messageType: type as any
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePictureUrl: true
            }
          }
        }
      });

      // Broadcast to group room
      this.io.to(`group_${groupId}`).emit('new_group_message', {
        ...groupMessage,
        sender: groupMessage.sender
      });

      // Send confirmation to sender
      socket.emit('message_sent', { messageId: groupMessage.id, status: 'sent' });

    } catch (error) {
      logger.error('Group message error:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  }

  private broadcastUserStatus(userId: number, status: string) {
    this.io.emit('user_status_change', { userId, status });
  }

  private async createNotification(userId: number, type: string, title: string, message: string, relatedId?: number) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: type as any,
          title,
          message,
          relatedId,
          relatedType: 'message'
        }
      });

      // Send real-time notification if user is online
      const userSocketId = this.onlineUsers.get(userId);
      if (userSocketId) {
        this.io.to(userSocketId).emit('new_notification', notification);
      }
    } catch (error) {
      logger.error('Notification creation error:', error);
    }
  }

  public getOnlineUsers(): number[] {
    return Array.from(this.onlineUsers.keys());
  }

  public isUserOnline(userId: number): boolean {
    return this.onlineUsers.has(userId);
  }

  public sendNotificationToUser(userId: number, notification: any) {
    const socketId = this.onlineUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('new_notification', notification);
    }
  }
}

export let socketServer: SocketServer;