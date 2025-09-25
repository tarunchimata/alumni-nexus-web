/**
 * API Test Component
 * For testing and debugging the enhanced API integration
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSchoolSearch } from '@/hooks/useSchoolSearch';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { toast } from 'sonner';

export const APITestComponent: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { health, loading: healthLoading, checkHealth, isHealthy } = useHealthCheck({ 
    autoStart: false,
    onHealthChange: (status) => {
      if (status.status === 'error') {
        toast.error('Health check failed: ' + status.message);
      } else {
        toast.success('System is healthy');
      }
    }
  });

  const {
    results,
    loading: searchLoading,
    error: searchError,
    search,
    totalResults,
    hasResults
  } = useSchoolSearch();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      search(searchTerm);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Health Check Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Health Check
              {health && (
                <Badge variant={isHealthy ? 'default' : 'destructive'}>
                  {health.status}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Test API connectivity and system health
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={checkHealth} 
              disabled={healthLoading}
              className="w-full"
            >
              {healthLoading ? 'Checking...' : 'Check Health'}
            </Button>
            
            {health && (
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Status:</strong> {health.status}
                </div>
                <div>
                  <strong>Timestamp:</strong> {new Date(health.timestamp).toLocaleString()}
                </div>
                {health.message && (
                  <div>
                    <strong>Message:</strong> {health.message}
                  </div>
                )}
                {health.services && (
                  <div>
                    <strong>Services:</strong>
                    <ul className="ml-4 mt-1">
                      {Object.entries(health.services).map(([service, status]) => (
                        <li key={service} className="flex justify-between">
                          <span>{service}:</span>
                          <Badge variant={status === 'ok' ? 'default' : 'destructive'} className="text-xs">
                            {status}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search Test Section */}
        <Card>
          <CardHeader>
            <CardTitle>School Search Test</CardTitle>
            <CardDescription>
              Test enhanced search functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Search schools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={searchLoading}>
                {searchLoading ? 'Searching...' : 'Search'}
              </Button>
            </form>

            {searchError && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                Error: {searchError}
              </div>
            )}

            {hasResults && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    Found {totalResults} schools
                  </span>
                  <Badge variant="outline">
                    Showing {results.length}
                  </Badge>
                </div>
                
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {results.slice(0, 5).map((school, index) => (
                    <div key={school.id || index} className="p-3 border rounded-md text-sm">
                      <div className="font-medium">{school.name}</div>
                      <div className="text-muted-foreground">
                        {school.stateName}, {school.districtName}
                      </div>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {school.status}
                        </Badge>
                        {school.schoolType && (
                          <Badge variant="secondary" className="text-xs">
                            {school.schoolType}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {results.length > 5 && (
                    <div className="text-center text-sm text-muted-foreground py-2">
                      ... and {results.length - 5} more schools
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};