import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import { useMatrix } from '@/hooks/useMatrix';

export const MatrixConnectionStatus = () => {
  const { isConnected, syncState } = useMatrix();

  const getStatusInfo = () => {
    if (!isConnected) {
      return {
        icon: WifiOff,
        color: 'destructive' as const,
        text: 'Disconnected',
        description: 'Matrix chat server is not connected. Some features may be unavailable.'
      };
    }

    switch (syncState) {
      case 'SYNCING':
        return {
          icon: RefreshCw,
          color: 'secondary' as const,
          text: 'Syncing',
          description: 'Synchronizing messages and rooms...'
        };
      case 'PREPARED':
        return {
          icon: Wifi,
          color: 'default' as const,
          text: 'Connected',
          description: 'Matrix chat is ready and connected.'
        };
      default:
        return {
          icon: AlertCircle,
          color: 'secondary' as const,
          text: 'Connecting',
          description: 'Establishing connection to Matrix chat server...'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <StatusIcon className={`w-4 h-4 ${statusInfo.color === 'destructive' ? 'text-red-500' : statusInfo.color === 'default' ? 'text-green-500' : 'text-yellow-500'}`} />
          <span className="text-sm font-medium">Matrix Chat</span>
        </div>
        <Badge variant={statusInfo.color}>
          {statusInfo.text}
        </Badge>
      </div>

      {!isConnected && (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            {statusInfo.description}
            <div className="mt-2 text-xs text-muted-foreground">
              Using development mode - Matrix server integration is being configured.
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};