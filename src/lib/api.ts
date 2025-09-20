// API utilities and configuration


const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || (import.meta.env.VITE_API_URL as string) || '/api';

console.log('[API Client] Using API base URL:', API_BASE_URL || '/api');

export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const apiKey =
      (import.meta.env.VITE_API_KEY as string) ||
      (import.meta.env.VITE_SCHOOL_API_KEY as string) ||
      (import.meta.env.VITE_SCHOOLS_API_KEY as string);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) headers['x-api-key'] = apiKey;
    return headers;
  }

  async get<T>(endpoint: string): Promise<T> {
    // Prevent duplicate /api prefixes
    const cleanEndpoint = endpoint.startsWith('/api/') ? endpoint.substring(4) : endpoint;
    const url = `${this.baseURL}${cleanEndpoint.startsWith('/') ? cleanEndpoint : '/' + cleanEndpoint}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getWithParams<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async uploadFile<T>(endpoint: string, file: File): Promise<T> {
    const apiKey =
      (import.meta.env.VITE_API_KEY as string) ||
      (import.meta.env.VITE_SCHOOL_API_KEY as string) ||
      (import.meta.env.VITE_SCHOOLS_API_KEY as string);
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (apiKey) headers['x-api-key'] = apiKey;

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();

export const endpoints = {
  auth: {
    profile: '/api/auth/profile',
  },
  schools: {
    list: '/api/schools',
    create: '/api/schools',
    update: '/api/schools/:id',
    delete: '/api/schools/:id',
    bulk: '/api/schools/bulk',
  },
  users: {
    list: '/api/users',
    create: '/api/users',
    update: '/api/users/:id',
    delete: '/api/users/:id',
    bulk: '/api/users/bulk',
    search: '/api/users/search',
  },
  classes: {
    list: '/api/classes',
    create: '/api/classes',
    update: '/api/classes/:id',
    delete: '/api/classes/:id',
    members: '/api/classes/:id/members',
  },
  messages: {
    conversations: '/api/messages/conversations',
    direct: '/api/messages/direct',
    groups: '/api/messages/groups',
    upload: '/api/messages/upload',
  },
  posts: {
    list: '/api/posts',
    create: '/api/posts',
    update: '/api/posts/:id',
    delete: '/api/posts/:id',
    reactions: '/api/posts/:id/reactions',
    comments: '/api/posts/:id/comments',
  },
  groups: {
    list: '/api/groups',
    create: '/api/groups',
    join: '/api/groups/:id/join',
    leave: '/api/groups/:id/leave',
    messages: '/api/groups/:id/messages',
  },
  notifications: {
    list: '/api/notifications',
    markRead: '/api/notifications/:id/read',
    markAllRead: '/api/notifications/read-all',
  },
  connections: {
    list: '/api/connections',
    send: '/api/connections/send',
    accept: '/api/connections/:id/accept',
    reject: '/api/connections/:id/reject',
    suggestions: '/api/connections/suggestions',
  },
  admin: {
    stats: '/api/admin/stats',
    health: '/api/admin/health',
  },
  analytics: {
    data: '/analytics',
    platform: '/analytics/platform',
    school: '/analytics/school',
  },
  dashboards: {
    platformAdmin: '/api/dashboards/platform-admin',
    schoolAdmin: '/api/dashboards/school-admin',
    teacher: '/api/dashboards/teacher',
    student: '/api/dashboards/student',
    alumni: '/api/dashboards/alumni',
  },
};
