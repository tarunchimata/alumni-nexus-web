// Unified API proxy layer — routes all external API calls directly to your backend.
// No Supabase dependency.

const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string) ||
  (import.meta.env.VITE_API_BASE_URL as string) ||
  'https://api.hostingmanager.in/api';

function resolveUrl(endpoint: string): string {
  const base = API_BASE_URL.replace(/\/+$/, '');
  const ep = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (/\/api$/i.test(base) && /^\/api(\/|$)/i.test(ep)) {
    return base.replace(/\/api$/i, '') + ep;
  }
  return base + ep;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_access_token');
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function proxyRequest<T = any>(
  endpoint: string,
  options: { method?: string; body?: any; headers?: Record<string, string> } = {}
): Promise<T> {
  const url = resolveUrl(endpoint);
  const method = options.method || 'GET';

  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...(method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const status = response.status;
    let msg = response.statusText || 'Request failed';
    try {
      const errBody = await response.json();
      msg = errBody.error || errBody.message || msg;
    } catch {}
    if (status === 502) msg = 'The backend server is currently unavailable.';
    if (status === 504) msg = 'The backend server took too long to respond.';
    if (status === 404) msg = 'The requested endpoint was not found.';
    const err = new Error(msg) as any;
    err.status = status;
    throw err;
  }

  return response.json();
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
