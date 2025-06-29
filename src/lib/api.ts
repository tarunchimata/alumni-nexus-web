
// API utilities and configuration
// This file contains the base API configuration and common utilities

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.myschoolbuddies.com' 
  : 'http://localhost:3001';

export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = localStorage.getItem('keycloak_token');
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
}

export const apiClient = new ApiClient();

// API endpoints for different modules
export const endpoints = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
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
  notifications: {
    list: '/api/notifications',
    markRead: '/api/notifications/:id/read',
    preferences: '/api/notifications/preferences',
  },
};
