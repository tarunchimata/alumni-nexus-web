
// API utilities and configuration
import { getToken, updateToken } from './keycloak';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.myschoolbuddies.com' 
  : 'http://localhost:3001';

export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    // Update token if needed
    try {
      await updateToken(30);
    } catch (error) {
      console.warn('Token update failed:', error);
    }

    const token = getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
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
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();

// API endpoints for different modules
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
  },
  classes: {
    list: '/api/classes',
    create: '/api/classes',
    update: '/api/classes/:id',
    delete: '/api/classes/:id',
    members: '/api/classes/:id/members',
  },
  messages: {
    list: '/api/messages',
    send: '/api/messages',
    conversation: '/api/messages/conversation/:id',
    groups: '/api/messages/groups',
  },
  admin: {
    stats: '/api/admin/stats',
    health: '/api/admin/health',
  },
};
