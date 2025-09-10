
import { MatrixMessageInbox } from '@/components/messaging/MatrixMessageInbox';

const Messages = () => {
  return (
    <div className="container mx-auto py-6 h-[calc(100vh-theme(spacing.16))]">
      <MatrixMessageInbox />
    </div>
  );
};

export default Messages;
