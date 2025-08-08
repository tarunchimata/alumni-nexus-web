import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, FileText, Clock, User, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { format } from 'date-fns';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: any;
  userId?: string;
  action: string;
}

interface ImportStats {
  totalAttempts: number;
  successfulImports: number;
  failedImports: number;
  averageImportTime: number;
  lastImportTime?: Date;
}

interface ImportLoggerProps {
  logs: LogEntry[];
  stats: ImportStats;
  onExportLogs?: () => void;
  onClearLogs?: () => void;
}

export const ImportLogger: React.FC<ImportLoggerProps> = ({
  logs,
  stats,
  onExportLogs,
  onClearLogs
}) => {
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'success'>('all');

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.level === filter;
  });

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-warning" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-success" />;
      default:
        return <Info className="w-4 h-4 text-primary" />;
    }
  };

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'success':
        return 'default';
      default:
        return 'outline';
    }
  };

  const successRate = stats.totalAttempts > 0 
    ? ((stats.successfulImports / stats.totalAttempts) * 100).toFixed(1)
    : '0';

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Import Activity Log
          </CardTitle>
          <div className="flex gap-2">
            {onExportLogs && (
              <Button variant="outline" size="sm" onClick={onExportLogs}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
            {onClearLogs && (
              <Button variant="outline" size="sm" onClick={onClearLogs}>
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-foreground">{stats.totalAttempts}</div>
            <div className="text-sm text-muted-foreground">Total Attempts</div>
          </div>
          <div className="text-center p-3 bg-success/10 rounded-lg">
            <div className="text-2xl font-bold text-success">{stats.successfulImports}</div>
            <div className="text-sm text-muted-foreground">Successful</div>
          </div>
          <div className="text-center p-3 bg-destructive/10 rounded-lg">
            <div className="text-2xl font-bold text-destructive">{stats.failedImports}</div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </div>
          <div className="text-center p-3 bg-primary/10 rounded-lg">
            <div className="text-2xl font-bold text-primary">{successRate}%</div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <div className="font-medium">Avg Import Time</div>
              <div className="text-sm text-muted-foreground">
                {stats.averageImportTime > 0 ? `${stats.averageImportTime.toFixed(1)}s` : 'N/A'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <User className="w-5 h-5 text-primary" />
            <div>
              <div className="font-medium">Last Import</div>
              <div className="text-sm text-muted-foreground">
                {stats.lastImportTime 
                  ? format(stats.lastImportTime, 'MMM dd, yyyy HH:mm')
                  : 'Never'
                }
              </div>
            </div>
          </div>
        </div>

        {/* Log Filters */}
        <div className="flex gap-2">
          {(['all', 'success', 'warning', 'error'] as const).map((level) => (
            <Button
              key={level}
              variant={filter === level ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(level)}
            >
              {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
              <Badge variant="secondary" className="ml-2">
                {level === 'all' 
                  ? logs.length 
                  : logs.filter(log => log.level === level).length
                }
              </Badge>
            </Button>
          ))}
        </div>

        {/* Log Entries */}
        <ScrollArea className="h-64 w-full border rounded-lg">
          <div className="p-4 space-y-3">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No log entries found
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-background border rounded-lg">
                  {getLevelIcon(log.level)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getLevelBadgeVariant(log.level)} className="text-xs">
                        {log.level.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {log.action}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(log.timestamp, 'HH:mm:ss')}
                      </span>
                      {log.userId && (
                        <Badge variant="secondary" className="text-xs">
                          {log.userId}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground">{log.message}</p>
                    {log.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-primary cursor-pointer hover:underline">
                          View details
                        </summary>
                        <pre className="text-xs text-muted-foreground mt-1 p-2 bg-muted rounded overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ImportLogger;