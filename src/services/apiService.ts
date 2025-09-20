// Production API Service
const RAW_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'https://schoolapi.hostingmanager.in';

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, '');
}

function buildApiUrl(endpoint: string): string {
  const baseRaw = trimTrailingSlash(RAW_BASE_URL);
  const ep = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  try {
    const u = new URL(baseRaw);
    const pathHasApi = /\/api(\/|$)/.test(u.pathname);
    const basePath = trimTrailingSlash(u.pathname || '');
    const finalPath = pathHasApi ? ep : (ep.startsWith('/api') ? ep : `/api${ep}`);
    const url = `${u.origin}${basePath}${finalPath}`;
    return url.replace(/([^:]\/)\/+?/g, '$1');
  } catch {
    const pathHasApi = /\/api(\/|$)/.test(baseRaw);
    const finalPath = pathHasApi ? ep : (ep.startsWith('/api') ? ep : `/api${ep}`);
    const url = `${baseRaw}${finalPath}`;
    return url.replace(/([^:]\/)\/+?/g, '$1');
  }
}

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private getAuthHeaders(includeContentType = true): Record<string, string> {
    const apiKey = (import.meta.env.VITE_SCHOOL_API_KEY as string) || (import.meta.env.VITE_API_KEY as string) || (import.meta.env.VITE_SCHOOLS_API_KEY as string) || '029e2e53b24775059b0cca69f23498210c397d4360ecdb68eb3465a0f7d9c7b9';
    const headers: Record<string, string> = {
      'x-api-key': apiKey,
    };
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  private unwrapSchoolsResponse(response: any): any[] {
    console.log('[ApiService] Unwrapping schools response:', response);
    // Handle various API response shapes
    if (Array.isArray(response)) {
      return response;
    }
    // Try common wrapper patterns
    const possibleArrays = [
      response.schools,
      response.data,
      response.rows,
      response.records,
      response.items,
      response.result
    ];
    
    for (const arr of possibleArrays) {
      if (Array.isArray(arr)) {
        console.log('[ApiService] Found schools in wrapper, length:', arr.length);
        return arr;
      }
    }
    
    console.warn('[ApiService] Could not find schools array in response, returning empty array');
    return [];
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
      try {
        return await response.json();
      } catch (e) {
        console.error('[ApiService] JSON parse error', e);
        throw new Error('Invalid JSON in response');
      }
    }
    const text = await response.text();
    console.warn(`[ApiService] Unexpected response (not JSON): ${contentType} - ${text.slice(0, 200)}`);
    throw new Error(`Unexpected response (not JSON): ${contentType} - ${text.slice(0, 200)}`);
  }

  async get<T>(endpoint: string): Promise<T> {
    const url = buildApiUrl(endpoint);
    console.log(`[ApiService] GET ${url}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(false), // No Content-Type for GET requests
    });

    return this.handleResponse<T>(response);
  }

  async getWithParams<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const base = buildApiUrl(endpoint);
    const url = new URL(base);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value);
      });
    }
    console.log(`[ApiService] GET ${url.toString()}`);
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getAuthHeaders(false), // No Content-Type for GET requests
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(buildApiUrl(endpoint), {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(buildApiUrl(endpoint), {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(buildApiUrl(endpoint), {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  async uploadFile<T>(endpoint: string, file: File): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const apiKey = (import.meta.env.VITE_SCHOOL_API_KEY as string) || (import.meta.env.VITE_API_KEY as string) || (import.meta.env.VITE_SCHOOLS_API_KEY as string) || '029e2e53b24775059b0cca69f23498210c397d4360ecdb68eb3465a0f7d9c7b9';
    const response = await fetch(buildApiUrl(endpoint), {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
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
    const apiKey = (import.meta.env.VITE_SCHOOL_API_KEY as string) || (import.meta.env.VITE_API_KEY as string) || (import.meta.env.VITE_SCHOOLS_API_KEY as string) || '029e2e53b24775059b0cca69f23498210c397d4360ecdb68eb3465a0f7d9c7b9';
    const url = buildApiUrl(`/csv/jobs/${id}/export-failed`);
    const resp = await fetch(url, {
      headers: {
        'x-api-key': apiKey,
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
  async getSchools(filters?: { 
    state?: string; 
    search?: string; 
    status?: string; 
    limit?: string; 
    offset?: string; 
  }) {
    console.log(`[ApiService] getSchools called with filters:`, filters);
    let response;
    if (filters && Object.keys(filters).length > 0) {
      response = await this.getWithParams('/schools', filters);
    } else {
      response = await this.get('/schools');
    }
    
    // Use unwrapper to handle various response shapes
    const schoolsArray = this.unwrapSchoolsResponse(response);
    console.log(`[ApiService] getSchools returning ${schoolsArray.length} schools`);
    return schoolsArray;
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