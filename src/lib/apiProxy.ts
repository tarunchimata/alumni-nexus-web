// Unified API proxy layer — routes all external API calls through the edge function
// to bypass CORS restrictions in the Lovable preview environment.

import { supabase } from '@/integrations/supabase/client';

const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string) ||
  (import.meta.env.VITE_API_BASE_URL as string) ||
  'https://schoolapi.hostingmanager.in/api';

function resolveUrl(endpoint: string): string {
  const base = API_BASE_URL.replace(/\/+$/, '');
  const ep = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  // Avoid /api/api duplication
  if (/\/api$/i.test(base) && /^\/api(\/|$)/i.test(ep)) {
    return base.replace(/\/api$/i, '') + ep;
  }
  return base + ep;
}

export async function proxyRequest<T = any>(
  endpoint: string,
  options: { method?: string; body?: any; headers?: Record<string, string> } = {}
): Promise<T> {
  const url = resolveUrl(endpoint);
  const method = options.method || 'GET';

  const { data, error } = await supabase.functions.invoke('api-proxy', {
    body: {
      url,
      method,
      headers: options.headers || (method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
      body: options.body,
    },
  });

  if (error) {
    throw new Error(`Proxy error: ${error.message}`);
  }

  if (!data?.ok) {
    const msg = data?.bodyJson?.error || data?.bodyJson?.message || data?.statusText || 'Request failed';
    const err = new Error(msg) as any;
    err.status = data?.status;
    err.response = data?.bodyJson;
    throw err;
  }

  return data.bodyJson ?? data.bodyText;
}

export async function proxyGet<T = any>(endpoint: string, params?: Record<string, string>): Promise<T> {
  let url = endpoint;
  if (params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
    const str = qs.toString();
    if (str) url += (url.includes('?') ? '&' : '?') + str;
  }
  return proxyRequest<T>(url, { method: 'GET' });
}

export async function proxyPost<T = any>(endpoint: string, body: any): Promise<T> {
  return proxyRequest<T>(endpoint, { method: 'POST', body });
}
