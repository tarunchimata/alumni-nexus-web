// Production API Service
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://schoolapi.hostingmanager.in/api';

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

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let body = '';
      try { body = await response.text(); } catch {}
      const snippet = body ? ` - ${body.slice(0, 200)}` : '';
      console.error(`[ApiService] ${response.status} ${response.statusText}${snippet}`);
      throw new Error(`API Error: ${response.status} ${response.statusText}${snippet}`);
    }
    if (response.status === 204) {
      return undefined as unknown as T;
    }
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }
    const text = await response.text();
    console.warn(`[ApiService] Unexpected response (not JSON): ${contentType} - ${text.slice(0, 200)}`);
    throw new Error(`Unexpected response (not JSON): ${contentType} - ${text.slice(0, 200)}`);
  }

  async get<T>(endpoint: string): Promise<T> {
    console.log(`[ApiService] GET ${API_BASE_URL}${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  async getPublic<T>(endpoint: string): Promise<T> {
    console.log(`[ApiService] GET (public) ${API_BASE_URL}${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<T>(response);
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

    return this.handleResponse<T>(response);
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

  // PR2 CSV Jobs API
  async uploadUsersCSV(file: File) {
    return this.uploadFile(`/csv/upload/users`, file);
  }

  async getCsvJobs() {
    return this.get(`/csv/jobs`);
  }

  async getCsvJob(id: number) {
    return this.get(`/csv/jobs/${id}`);
  }

  async approveCsvJob(id: number) {
    return this.post(`/csv/jobs/${id}/approve`, {});
  }

  async activateCsvJob(id: number) {
    return this.post(`/csv/jobs/${id}/activate`, {});
  }

  async getCsvJobLogs(id: number) {
    return this.get(`/csv/jobs/${id}/logs`);
  }

  async exportFailedCsvRows(id: number): Promise<Blob> {
    const token = localStorage.getItem('auth_access_token');
    const resp = await fetch(`${API_BASE_URL}/csv/jobs/${id}/export-failed`, {
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`API Error: ${resp.status} ${resp.statusText} - ${text.slice(0,200)}`);
    }
    return await resp.blob();
  }

  // People/Users methods
  async getUsers(filters?: any) {
    const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : '';
    return this.get(`/users${queryParams}`);
  }

  // Schools CRUD methods
  async getSchools() {
    try {
      return await this.get('/schools');
    } catch (err: any) {
      const msg = (err?.message || '').toString();
      if (msg.includes('401') || msg.includes('403')) {
        console.warn('[ApiService] GET /schools failed with auth, retrying as public');
        return await this.getPublic('/schools');
      }
      throw err;
    }
  }

  async getSchool(id: string | number) {
    return this.get(`/schools/${id}`);
  }

  async createSchool(data: any) {
    return this.post('/schools', data);
  }

  async updateSchool(id: string | number, data: any) {
    return this.put(`/schools/${id}`, data);
  }

  async deleteSchool(id: string | number) {
    return this.delete(`/schools/${id}`);
  }

  async approveSchool(id: string | number) {
    return this.post(`/schools/${id}/approve`, {});
  }

  async validateSchool(id: string | number) {
    return this.post(`/schools/${id}/validate`, {});
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