import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/apiService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const SchoolsAPIDebug: React.FC = () => {
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [normalizedSchools, setNormalizedSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testAPI = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Testing Schools API...');
      
      // Test direct API call
      const response = await apiService.getSchools();
      console.log('Raw API response:', response);
      setRawResponse(response);
      
      // Extract normalized schools
      if ((response as any)?.schools) {
        setNormalizedSchools((response as any).schools.slice(0, 3)); // First 3 for display
      } else if (Array.isArray(response)) {
        setNormalizedSchools(response.slice(0, 3));
      } else {
        setNormalizedSchools([]);
      }
      
    } catch (err) {
      console.error('API test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testAPI();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Schools API Debug</h1>
        <Button onClick={testAPI} disabled={loading}>
          {loading ? 'Testing...' : 'Test API Again'}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">API Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-red-600 whitespace-pre-wrap">{error}</pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Raw API Response</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
            {JSON.stringify(rawResponse, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Normalized Schools Data (First 3)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
            {JSON.stringify(normalizedSchools, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default SchoolsAPIDebug;