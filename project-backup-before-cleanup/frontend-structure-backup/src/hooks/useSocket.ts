
import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { socketService } from '@/lib/socket';
import { Socket } from 'socket.io-client';

export const useSocket = () => {
  const { token, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (isAuthenticated && token) {
      socketRef.current = socketService.connect(token);
      
      return () => {
        socketService.disconnect();
      };
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        socketService.updateOnlineStatus('away');
      } else {
        socketService.updateOnlineStatus('online');
      }
    };

    const handleBeforeUnload = () => {
      socketService.updateOnlineStatus('offline');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected: socketService.isSocketConnected(),
    sendDirectMessage: socketService.sendDirectMessage.bind(socketService),
    sendGroupMessage: socketService.sendGroupMessage.bind(socketService),
    joinRoom: socketService.joinRoom.bind(socketService),
    leaveRoom: socketService.leaveRoom.bind(socketService),
    startTyping: socketService.startTyping.bind(socketService),
    stopTyping: socketService.stopTyping.bind(socketService),
  };
};
