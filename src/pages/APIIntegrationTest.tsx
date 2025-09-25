/**
 * API Integration Test Page
 * Test page for validating enhanced API integration
 */

import React from 'react';
import { APITestComponent } from '@/components/debug/APITestComponent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const APIIntegrationTest: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Integration Test</h1>
          <p className="text-muted-foreground mt-2">
            Test and validate the enhanced MySchoolBuddies API integration
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Integration Status
              <Badge variant="outline">Enhanced</Badge>
            </CardTitle>
            <CardDescription>
              This page tests the enhanced API integration features including:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium">Authentication</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Bearer token integration</li>
                  <li>• Automatic token refresh</li>
                  <li>• Error handling for auth failures</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">API Features</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Health check endpoint</li>
                  <li>• Enhanced search methods</li>
                  <li>• Real-time data integration</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Error Handling</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Global error handler</li>
                  <li>• Network error recovery</li>
                  <li>• User-friendly messages</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <APITestComponent />
      </div>
    </div>
  );
};

export default APIIntegrationTest;