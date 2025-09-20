import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiService } from '@/services/apiService';

export default function SchoolsAPIDebug() {
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [normalizedSchools, setNormalizedSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testAPI = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Test raw API call
      console.log('[Debug] Testing raw API call...');
      const raw = await fetch('https://schoolapi.hostingmanager.in/api/schools?_ts=' + Date.now(), {
        headers: {
          'x-api-key': '029e2e53b24775059b0cca69f23498210c397d4360ecdb68eb3465a0f7d9c7b9'
        }
      });
      
      if (!raw.ok) {
        throw new Error(`API returned ${raw.status}: ${raw.statusText}`);
      }
      
      const rawData = await raw.json();
      setRawResponse(rawData);
      
      // Test through apiService
      console.log('[Debug] Testing through apiService...');
      const normalized = await apiService.getSchools();
      setNormalizedSchools(normalized);
      
    } catch (err: any) {
      console.error('[Debug] API test failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testAPI();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Schools API Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={testAPI} disabled={loading}>
            {loading ? 'Testing...' : 'Test API'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {error}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Raw API Response (First 3 items)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
            {JSON.stringify(rawResponse, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Normalized Schools ({normalizedSchools.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
            {JSON.stringify(normalizedSchools.slice(0, 3), null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}