// Production API Service
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async uploadFile<T>(endpoint: string, file: File): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('auth_access_token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Dashboard API methods
  async getDashboardData(role: string) {
    return this.get(`/dashboard/${role}`);
  }

  // CSV Import methods
  async uploadCSV(file: File, type: 'users' | 'schools') {
    return this.uploadFile(`/csv/upload/${type}`, file);
  }

  async validateCSV(data: any[], type: 'users' | 'schools') {
    return this.post(`/csv/validate/${type}`, { data });
  }

  async importCSV(data: any[], type: 'users' | 'schools') {
    return this.post(`/csv/import/${type}`, { data });
  }

  // People/Users methods
  async getUsers(filters?: any) {
    const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : '';
    return this.get(`/users${queryParams}`);
  }

  async getSchools() {
    return this.get('/schools');
  }

  async connectUser(userId: string) {
    return this.post(`/connections/request`, { userId });
  }

  async getUserProfile(userId: string) {
    return this.get(`/users/${userId}`);
  }
}

export const apiService = new ApiService();
export default apiService;