// Supabase Edge Function: schools-proxy
// Proxies requests to the external Schools API adding API key and CORS headers
// This avoids browser CORS issues by performing the fetch server-side.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const DEFAULT_BASE = "https://schoolapi.hostingmanager.in/api";

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    // Support both GET with query and POST with JSON body
    let endpoint = url.searchParams.get("endpoint") || "schools";
    let rawParams: Record<string, string | number | boolean | null | undefined> = {};

    if (req.method === "POST") {
      try {
        const body = await req.json();
        endpoint = body?.endpoint || endpoint;
        rawParams = body?.params || {};
      } catch (_) {
        // ignore parse errors
      }
    } else {
      url.searchParams.forEach((v, k) => {
        if (k !== "endpoint") rawParams[k] = v;
      });
    }

    const BASE = Deno.env.get("SCHOOLS_API_BASE") || DEFAULT_BASE;
    const API_KEY = Deno.env.get("SCHOOLS_API_KEY") || "";

    const target = new URL(`${BASE.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`);

    // Append params safely and add cache-buster
    Object.entries(rawParams || {}).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      const val = typeof v === "string" ? v : String(v);
      if (!val || val === "undefined" || val === "null" || val === "[object Object]") return;
      target.searchParams.append(k, val);
    });
    target.searchParams.set("_ts", String(Date.now()));

    console.log(`[schools-proxy] Fetching: ${target.toString()}`);

    const upstream = await fetch(target.toString(), {
      method: "GET",
      headers: {
        "x-api-key": API_KEY,
      },
    });

    const contentType = upstream.headers.get("content-type") || "application/json";

    if (!upstream.ok) {
      const text = await upstream.text();
      console.error(`[schools-proxy] Upstream error ${upstream.status}: ${text.slice(0, 200)}`);
      return new Response(JSON.stringify({ error: `Upstream ${upstream.status} ${upstream.statusText}`, details: text }), {
        status: upstream.status,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    if (contentType.includes("application/json")) {
      const data = await upstream.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const text = await upstream.text();
    return new Response(text, { headers: { ...corsHeaders, "content-type": contentType } });
  } catch (err) {
    console.error("[schools-proxy] Unexpected error", err);
    return new Response(JSON.stringify({ error: "Proxy failure", message: String(err?.message || err) }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
