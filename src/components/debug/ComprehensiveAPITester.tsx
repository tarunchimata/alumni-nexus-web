/**
 * Comprehensive API Tester Component
 * Full-featured API testing interface with manual controls
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Copy, RefreshCw, Globe, Server } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/services/apiService';

export const ComprehensiveAPITester: React.FC = () => {
  const defaultBase =
    (import.meta.env.VITE_SCHOOLS_API_URL as string) ||
    (import.meta.env.VITE_API_BASE_URL as string) ||
    (import.meta.env.VITE_API_URL as string) ||
    'https://schoolapi.hostingmanager.in';
  const [baseUrl, setBaseUrl] = useState(defaultBase);
  const [endpoint, setEndpoint] = useState('/api/schools');
  const [method, setMethod] = useState('GET');
  const [apiKey, setApiKey] = useState('');
  const [customHeaders, setCustomHeaders] = useState('{}');
  const [requestBody, setRequestBody] = useState('{}');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showRawResponse, setShowRawResponse] = useState(false);
  const [testMode, setTestMode] = useState<'browser' | 'proxy'>('proxy');

  useEffect(() => {
    // Load API key from environment
    const envApiKey =
      (import.meta.env.VITE_SCHOOL_API_KEY as string) ||
      (import.meta.env.VITE_SCHOOLS_API_KEY as string) ||
      (import.meta.env.VITE_API_KEY as string) ||
      (import.meta.env.VITE_X_API_KEY as string);
    if (envApiKey) {
      setApiKey(envApiKey);
    }
  }, []);

  const generateCurlCommand = () => {
    const headers = {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      ...JSON.parse(customHeaders || '{}')
    };
    
    let curl = `curl -X ${method} "${baseUrl}${endpoint}"`;
    
    Object.entries(headers).forEach(([key, value]) => {
      curl += ` \\\n  -H "${key}: ${value}"`;
    });
    
    if (method !== 'GET' && requestBody && requestBody !== '{}') {
      curl += ` \\\n  -d '${requestBody}'`;
    }
    
    return curl;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const testViaProxy = async () => {
    setLoading(true);
    try {
      const result = await apiService.getSchools({ limit: '10' });
      setResponse(result);
      toast.success('Proxy test successful');
    } catch (error) {
      setResponse({ error: error instanceof Error ? error.message : 'Proxy test failed' });
      toast.error('Proxy test failed');
    }
    setLoading(false);
  };

  const testViaBrowser = async () => {
    setLoading(true);
    try {
      const headers = {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        ...JSON.parse(customHeaders || '{}')
      };

      const options: RequestInit = {
        method,
        headers,
      };

      if (method !== 'GET' && requestBody && requestBody !== '{}') {
        options.body = requestBody;
      }

      const response = await fetch(`${baseUrl}${endpoint}`, options);
      const data = await response.json();
      
      setResponse({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data
      });
      
      if (response.ok) {
        toast.success('Browser test successful');
      } else {
        toast.error(`Browser test failed: ${response.status}`);
      }
    } catch (error) {
      setResponse({ error: error instanceof Error ? error.message : 'Browser test failed' });
      toast.error('Browser test failed - likely CORS issue');
    }
    setLoading(false);
  };

  const quickTests = [
    { name: 'Schools List', endpoint: '/api/schools', method: 'GET' },
    { name: 'Health Check', endpoint: '/api/health', method: 'GET' },
    { name: 'Schools Stats', endpoint: '/api/schools/stats', method: 'GET' },
    { name: 'Schools by State', endpoint: '/api/schools?state=Uttarakhand', method: 'GET' },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="w-5 h-5" />
          API Test Panel
        </CardTitle>
        <CardDescription>
          Comprehensive API testing with browser and proxy support
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Test Buttons */}
        <div className="flex flex-wrap gap-2">
          {quickTests.map((test) => (
            <Button
              key={test.name}
              variant="outline"
              size="sm"
              onClick={() => {
                setEndpoint(test.endpoint);
                setMethod(test.method);
              }}
            >
              {test.name}
            </Button>
          ))}
        </div>

        <Tabs value={testMode} onValueChange={(v) => setTestMode(v as 'browser' | 'proxy')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="proxy" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Via Proxy
            </TabsTrigger>
            <TabsTrigger value="browser" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Direct Browser
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proxy" className="space-y-4">
            <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Proxy Mode:</strong> Uses a backend function to bypass CORS. 
                Recommended for testing external APIs.
              </p>
            </div>
            <Button onClick={testViaProxy} disabled={loading} className="w-full">
              {loading ? 'Testing...' : 'Test via Proxy'}
            </Button>
          </TabsContent>

          <TabsContent value="browser" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="baseUrl">Base URL</Label>
                <Input
                  id="baseUrl"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="http://localhost:3001"
                />
              </div>
              
              <div>
                <Label htmlFor="method">Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="endpoint">Endpoint</Label>
              <Input
                id="endpoint"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="/api/schools"
              />
            </div>

            <div>
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Your x-api-key"
              />
            </div>

            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 p-0">
                  <ChevronDown className="w-4 h-4" />
                  Advanced Options
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="headers">Custom Headers (JSON)</Label>
                  <Textarea
                    id="headers"
                    value={customHeaders}
                    onChange={(e) => setCustomHeaders(e.target.value)}
                    placeholder='{"Authorization": "Bearer token"}'
                    rows={3}
                  />
                </div>

                {method !== 'GET' && (
                  <div>
                    <Label htmlFor="body">Request Body (JSON)</Label>
                    <Textarea
                      id="body"
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      placeholder='{"key": "value"}'
                      rows={4}
                    />
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            <div className="flex gap-2">
              <Button onClick={testViaBrowser} disabled={loading} className="flex-1">
                {loading ? 'Testing...' : 'Test via Browser'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => copyToClipboard(generateCurlCommand())}
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy cURL
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Response Section */}
        {response && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Response</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRawResponse(!showRawResponse)}
              >
                {showRawResponse ? 'Hide' : 'Show'} Raw Response
              </Button>
            </div>

            {response.status && (
              <div className="flex items-center gap-2">
                <Badge variant={response.status < 400 ? 'default' : 'destructive'}>
                  {response.status} {response.statusText}
                </Badge>
              </div>
            )}

            {showRawResponse && (
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-96">
                {JSON.stringify(response, null, 2)}
              </pre>
            )}

            {!showRawResponse && response.data && (
              <div className="space-y-2">
                {response.data.schools && (
                  <div>
                    <p className="font-medium">Schools Found: {response.data.schools.length}</p>
                    <div className="grid gap-2 mt-2 max-h-60 overflow-auto">
                      {response.data.schools.slice(0, 5).map((school: any, idx: number) => (
                        <div key={idx} className="p-2 border rounded text-sm">
                          <div className="font-medium">
                            {school.name || school.schoolName || school.school_name || 'Unnamed School'}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            State: {school.stateName || school.state_name || school.state || '—'} | 
                            District: {school.districtName || school.district_name || school.district || '—'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};