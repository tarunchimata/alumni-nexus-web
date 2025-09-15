import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Server, AlertTriangle, Settings, ExternalLink } from 'lucide-react';

const MatrixAdminFallback = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Matrix Administration</h1>
          <p className="text-muted-foreground">Manage Matrix messaging server configuration</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Server className="h-4 w-4" />
          Development Mode
        </Badge>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Matrix server integration is not yet configured. Please set up your Matrix homeserver connection.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Server Configuration
            </CardTitle>
            <CardDescription>
              Configure your Matrix homeserver connection settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Required Configuration:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Matrix homeserver URL</li>
                <li>• Admin access token</li>
                <li>• Federation settings</li>
                <li>• Room creation policies</li>
              </ul>
            </div>
            <Button variant="outline" className="w-full">
              <ExternalLink className="mr-2 h-4 w-4" />
              Matrix Documentation
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Connection Status
            </CardTitle>
            <CardDescription>
              Current Matrix server connection status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Homeserver</span>
              <Badge variant="destructive">Disconnected</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Federation</span>
              <Badge variant="destructive">Unavailable</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Admin API</span>
              <Badge variant="destructive">Not Configured</Badge>
            </div>
            <Button variant="default" className="w-full" disabled>
              Test Connection
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Steps to configure Matrix messaging integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium">Set up Matrix Homeserver</p>
                  <p className="text-sm text-muted-foreground">Install and configure a Matrix homeserver (Synapse recommended)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium">Configure Environment</p>
                  <p className="text-sm text-muted-foreground">Add Matrix server URL and admin credentials to environment variables</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-muted text-muted-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Test Connection</p>
                  <p className="text-sm text-muted-foreground">Verify connectivity and admin API access</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MatrixAdminFallback;