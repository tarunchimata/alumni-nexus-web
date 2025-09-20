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
  const [baseUrl, setBaseUrl] = useState(
    (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.VITE_API_BASE_URL || "https://schoolapi.hostingmanager.in/api"
  );
  const [endpoint, setEndpoint] = useState("/schools");
  const [method, setMethod] = useState<"GET" | "POST" | "PUT" | "DELETE">("GET");
  const [apiKey, setApiKey] = useState((import.meta as any).env?.VITE_API_KEY || "");
  const [authHeader, setAuthHeader] = useState("x-api-key");
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

function safeParse(v: string) {
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}
