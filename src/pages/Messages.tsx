
import { MessageInbox } from '@/components/messaging/MessageInbox';
import { useSocket } from '@/hooks/useSocket';
import { useEffect } from 'react';

const Messages = () => {
  const { socket } = useSocket();

  useEffect(() => {
    // Join user's personal room for receiving messages
    if (socket) {
      socket.emit('join_personal_room');
    }
  }, [socket]);

  return (
    <div className="container mx-auto py-6 h-[calc(100vh-theme(spacing.16))]">
      <MessageInbox />
    </div>
  );
};

export default Messages;
