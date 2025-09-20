import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

interface TestResult {
  ok?: boolean;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  bodyJson?: any;
  bodyText?: string;
  durationMs?: number;
  error?: string;
}

export default function APITestLab() {
  const [baseUrl, setBaseUrl] = useState("https://schoolapi.hostingmanager.in/api");
  const [endpoint, setEndpoint] = useState("/schools");
  const [method, setMethod] = useState<"GET" | "POST" | "PUT" | "DELETE">("GET");
  const [apiKey, setApiKey] = useState("029e2e53b24775059b0cca69f23498210c397d4360ecdb68eb3465a0f7d9c7b9");
  const [authHeader, setAuthHeader] = useState("x-api-key");
  const [connectivityTest, setConnectivityTest] = useState<any>(null);
  const [loadingConnectivity, setLoadingConnectivity] = useState(false);
  const [customHeaders, setCustomHeaders] = useState("{}");
  const [body, setBody] = useState("{}");

  const [browserResult, setBrowserResult] = useState<TestResult | null>(null);
  const [proxyResult, setProxyResult] = useState<TestResult | null>(null);
  const [loadingBrowser, setLoadingBrowser] = useState(false);
  const [loadingProxy, setLoadingProxy] = useState(false);

  React.useEffect(() => {
    document.title = "API Test Lab | Connectivity";
  }, []);

  const fullUrl = useMemo(() => {
    const b = baseUrl.replace(/\/+$/, "");
    const e = endpoint.replace(/^\/+/, "");
    return `${b}/${e}`;
  }, [baseUrl, endpoint]);

  const buildHeaders = (): Record<string, string> => {
    let headers: Record<string, string> = {};
    try {
      const parsed = JSON.parse(customHeaders || "{}");
      if (parsed && typeof parsed === "object") headers = parsed;
    } catch {}

    if (authHeader === "x-api-key" && apiKey) headers["x-api-key"] = apiKey;
    if (authHeader === "X-API-KEY" && apiKey) headers["X-API-KEY"] = apiKey;
    if (authHeader === "authorization-bearer" && apiKey)
      headers["Authorization"] = `Bearer ${apiKey}`;

    return headers;
  };

  const testBrowser = async () => {
    setLoadingBrowser(true);
    setBrowserResult(null);
    const headers = buildHeaders();
    const started = performance.now();

    try {
      const init: RequestInit = {
        method,
        headers,
      };
      if (method !== "GET" && method !== "DELETE") {
        try {
          init.body = body ? body : undefined;
          if (typeof init.body !== "string") init.body = JSON.stringify(init.body);
          (init.headers as Record<string, string>)["Content-Type"] =
            (init.headers as Record<string, string>)["Content-Type"] || "application/json";
        } catch {}
      }

      const res = await fetch(fullUrl, init);
      const text = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {}

      setBrowserResult({
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        bodyJson: json,
        bodyText: json ? undefined : text,
        durationMs: Math.round(performance.now() - started),
      });
    } catch (e: any) {
      setBrowserResult({ error: e?.message || String(e) });
    } finally {
      setLoadingBrowser(false);
    }
  };

  const testConnectivity = async () => {
    setLoadingConnectivity(true);
    setConnectivityTest(null);
    
    const tests = {
      dnsResolution: null as any,
      httpConnectivity: null as any,
      httpsConnectivity: null as any,
      apiEndpoint: null as any,
      corsCheck: null as any
    };

    try {
      // Test 1: Basic HTTP connectivity
      console.log('Testing HTTP connectivity...');
      const httpStart = performance.now();
      try {
        const httpResponse = await fetch('http://httpbin.org/get', { 
          method: 'GET',
          signal: AbortSignal.timeout(10000)
        });
        tests.httpConnectivity = {
          success: httpResponse.ok,
          status: httpResponse.status,
          time: Math.round(performance.now() - httpStart)
        };
      } catch (e: any) {
        tests.httpConnectivity = { success: false, error: e.message };
      }

      // Test 2: HTTPS connectivity
      console.log('Testing HTTPS connectivity...');
      const httpsStart = performance.now();
      try {
        const httpsResponse = await fetch('https://httpbin.org/get', { 
          method: 'GET',
          signal: AbortSignal.timeout(10000)
        });
        tests.httpsConnectivity = {
          success: httpsResponse.ok,
          status: httpsResponse.status,
          time: Math.round(performance.now() - httpsStart)
        };
      } catch (e: any) {
        tests.httpsConnectivity = { success: false, error: e.message };
      }

      // Test 3: Direct API endpoint test
      console.log('Testing API endpoint...');
      const apiStart = performance.now();
      try {
        const apiResponse = await fetch(fullUrl, {
          method: 'GET',
          headers: { 'x-api-key': apiKey },
          signal: AbortSignal.timeout(15000)
        });
        
        const responseText = await apiResponse.text();
        let responseJson = null;
        try {
          responseJson = JSON.parse(responseText);
        } catch {}
        
        tests.apiEndpoint = {
          success: apiResponse.ok,
          status: apiResponse.status,
          statusText: apiResponse.statusText,
          time: Math.round(performance.now() - apiStart),
          headers: Object.fromEntries(apiResponse.headers.entries()),
          bodyPreview: responseJson ? JSON.stringify(responseJson).substring(0, 200) + '...' : responseText.substring(0, 200) + '...',
          bodySize: responseText.length
        };
      } catch (e: any) {
        tests.apiEndpoint = { success: false, error: e.message };
      }

      // Test 4: CORS preflight check
      console.log('Testing CORS...');
      try {
        const corsResponse = await fetch(fullUrl, {
          method: 'OPTIONS',
          headers: { 
            'Origin': window.location.origin,
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'x-api-key'
          },
          signal: AbortSignal.timeout(10000)
        });
        tests.corsCheck = {
          success: corsResponse.ok,
          status: corsResponse.status,
          headers: Object.fromEntries(corsResponse.headers.entries())
        };
      } catch (e: any) {
        tests.corsCheck = { success: false, error: e.message };
      }

      setConnectivityTest(tests);
    } catch (e: any) {
      setConnectivityTest({ error: e.message });
    } finally {
      setLoadingConnectivity(false);
    }
  };

  const testProxy = async () => {
    setLoadingProxy(true);
    setProxyResult(null);
    const headers = buildHeaders();
    const started = performance.now();

    try {
      const { data, error } = await supabase.functions.invoke("api-proxy", {
        body: {
          url: fullUrl,
          method,
          headers,
          body: method !== "GET" && method !== "DELETE" ? safeParse(body) : undefined,
        },
      });

      if (error) throw error;
      setProxyResult({ ...data, durationMs: Math.round(performance.now() - started) });
    } catch (e: any) {
      setProxyResult({ error: e?.message || String(e) });
    } finally {
      setLoadingProxy(false);
    }
  };

  const curlCommand = useMemo(() => {
    const headers = buildHeaders();
    const headerFlags = Object.entries(headers)
      .map(([k, v]) => `-H ${JSON.stringify(`${k}: ${v}`)}`)
      .join(" ");
    if (method === "GET" || method === "DELETE") {
      return `curl -X ${method} ${headerFlags} ${JSON.stringify(fullUrl)}`;
    }
    return `curl -X ${method} ${headerFlags} -H "Content-Type: application/json" -d ${JSON.stringify(
      body || "{}"
    )} ${JSON.stringify(fullUrl)}`;
  }, [authHeader, apiKey, baseUrl, endpoint, method, customHeaders, body, fullUrl]);

  return (
    <main className="p-6 max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Test Lab</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm opacity-80">Base URL</label>
              <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://.../api" />
            </div>
            <div className="space-y-2">
              <label className="text-sm opacity-80">Endpoint</label>
              <Input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="/schools" />
            </div>
            <div className="space-y-2">
              <label className="text-sm opacity-80">HTTP Method</label>
              <select
                className="h-10 rounded-md border bg-background px-3"
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm opacity-80">Auth Header</label>
              <select
                className="h-10 rounded-md border bg-background px-3"
                value={authHeader}
                onChange={(e) => setAuthHeader(e.target.value)}
              >
                <option value="x-api-key">x-api-key: &lt;key&gt;</option>
                <option value="X-API-KEY">X-API-KEY: &lt;key&gt;</option>
                <option value="authorization-bearer">Authorization: Bearer &lt;key&gt;</option>
                <option value="none">None</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm opacity-80">API Key</label>
              <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Your API key" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm opacity-80">Custom Headers (JSON)</label>
              <Textarea rows={3} value={customHeaders} onChange={(e) => setCustomHeaders(e.target.value)} />
            </div>
            {method !== "GET" && method !== "DELETE" && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm opacity-80">Request Body (JSON)</label>
                <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button onClick={testConnectivity} disabled={loadingConnectivity} variant="outline">
              {loadingConnectivity ? "Running Diagnostics…" : "🔍 Network Diagnostics"}
            </Button>
            <Button onClick={testBrowser} disabled={loadingBrowser}>
              {loadingBrowser ? "Testing Browser…" : "Test via Browser Fetch"}
            </Button>
            <Button variant="secondary" onClick={testProxy} disabled={loadingProxy}>
              {loadingProxy ? "Testing Proxy…" : "Test via Backend Proxy"}
            </Button>
          </div>

          <div className="pt-2 text-xs opacity-80">
            <div className="font-medium mb-1">cURL</div>
            <pre className="bg-muted rounded p-3 overflow-auto">{curlCommand}</pre>
          </div>
        </CardContent>
      </Card>

      {connectivityTest && (
        <Card>
          <CardHeader>
            <CardTitle>🔍 Network Connectivity Diagnostics</CardTitle>
          </CardHeader>
          <CardContent>
            <ConnectivityView result={connectivityTest} />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Browser Fetch Result</CardTitle>
          </CardHeader>
          <CardContent>
            <ResultView result={browserResult} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backend Proxy Result</CardTitle>
          </CardHeader>
          <CardContent>
            <ResultView result={proxyResult} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function ResultView({ result }: { result: TestResult | null }) {
  if (!result) return <div className="text-sm opacity-70">No result yet.</div>;
  if (result.error) return <div className="text-sm text-red-600">Error: {result.error}</div>;
  return (
    <div className="space-y-2 text-sm">
      <div>
        <span className="font-medium">Status:</span> {result.status} {result.statusText} {" "}
        {typeof result.durationMs === "number" && <span className="opacity-70">({result.durationMs} ms)</span>}
      </div>
      {result.headers && (
        <div>
          <div className="font-medium">Headers</div>
          <pre className="bg-muted rounded p-3 overflow-auto max-h-64">{JSON.stringify(result.headers, null, 2)}</pre>
        </div>
      )}
      <div>
        <div className="font-medium">Body</div>
        <pre className="bg-muted rounded p-3 overflow-auto max-h-96">
          {JSON.stringify(result.bodyJson ?? result.bodyText ?? null, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function ConnectivityView({ result }: { result: any }) {
  if (result.error) return <div className="text-sm text-red-600">Error: {result.error}</div>;
  
  return (
    <div className="space-y-4 text-sm">
      {Object.entries(result).map(([testName, testResult]: [string, any]) => (
        <div key={testName} className="border rounded p-3">
          <div className="font-medium mb-2 flex items-center gap-2">
            {testResult.success ? '✅' : '❌'} {testName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            {testResult.time && <span className="text-xs opacity-70">({testResult.time}ms)</span>}
          </div>
          
          {testResult.error && (
            <div className="text-red-600 text-xs mb-2">Error: {testResult.error}</div>
          )}
          
          {testResult.status && (
            <div className="text-xs opacity-70">Status: {testResult.status} {testResult.statusText}</div>
          )}
          
          {testResult.bodyPreview && (
            <div className="text-xs opacity-70 mt-1">
              Preview: {testResult.bodyPreview} ({testResult.bodySize} bytes)
            </div>
          )}
          
          {testResult.headers && Object.keys(testResult.headers).length > 0 && (
            <details className="mt-2">
              <summary className="text-xs cursor-pointer opacity-70">Headers</summary>
              <pre className="text-xs bg-muted rounded p-2 mt-1 overflow-auto max-h-32">
                {JSON.stringify(testResult.headers, null, 2)}
              </pre>
            </details>
          )}
        </div>
      ))}
    </div>
  );
}

function safeParse(v: string) {
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}
