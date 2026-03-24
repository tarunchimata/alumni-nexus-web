// Minimal backend proxy to test external API connectivity from the server side
// This helps bypass browser CORS and origin firewalls during debugging sessions.
// Only allows forwarding to a safe allowlist of hosts.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, method = "GET", headers = {}, body } = await req.json();
    if (!url || typeof url !== "string") {
      return json({ error: "Missing url" }, 400);
    }

    const target = new URL(url);
    const allowlist = [
      "schoolapi.hostingmanager.in",
      "hostingmanager.in",
    ];

    const allowed = allowlist.some((d) => target.hostname === d || target.hostname.endsWith(`.${d}`));
    if (!allowed) {
      return json({ error: `Host not allowed: ${target.hostname}` }, 400);
    }

    const init: RequestInit = {
      method,
      headers,
    };

    if (body && method !== "GET" && method !== "HEAD") {
      init.body = typeof body === "string" ? body : JSON.stringify(body);
      (init.headers as any) = {
        ...(init.headers || {}),
        "Content-Type": (headers && (headers as any)["Content-Type"]) || "application/json",
      };
    }

    // Add a 25-second timeout via AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    init.signal = controller.signal;

    let upstream: Response;
    try {
      upstream = await fetch(url, init);
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      if (fetchErr.name === "AbortError") {
        return json({ ok: false, status: 504, statusText: "Gateway Timeout", bodyJson: { error: "The backend server took too long to respond. Please try again." } });
      }
      return json({ ok: false, status: 502, statusText: "Bad Gateway", bodyJson: { error: `Could not reach the backend server: ${fetchErr.message}` } });
    }
    clearTimeout(timeoutId);
    const text = await upstream.text();
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch {}

    return json({
      ok: upstream.ok,
      status: upstream.status,
      statusText: upstream.statusText,
      headers: Object.fromEntries(upstream.headers.entries()),
      bodyJson: parsed,
      bodyText: parsed ? undefined : text,
    });
  } catch (e) {
    return json({ error: (e as Error)?.message || String(e) }, 500);
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
