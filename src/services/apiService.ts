
// Production API Service
const RAW_BASE_URL =
  (import.meta.env.VITE_SCHOOLS_API_URL as string) ||
  (import.meta.env.VITE_API_BASE_URL as string) ||
  (import.meta.env.VITE_API_URL as string) ||
  'https://schoolapi.hostingmanager.in/api';

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
    const apiKey =
      (import.meta.env.VITE_SCHOOL_API_KEY as string) ||
      (import.meta.env.VITE_API_KEY as string) ||
      (import.meta.env.VITE_SCHOOLS_API_KEY as string);
    const headers: Record<string, string> = {};
    if (apiKey) headers['x-api-key'] = apiKey;
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

  private normalizeSchool(school: any): any {
    // Transform various API field formats to consistent camelCase format
    const anyS = school as any;
    return {
      id: school.id ?? anyS.institution_id ?? anyS.school_id ?? school.udiseCode,
      name: school.name ?? school.schoolName ?? anyS.school_name ?? anyS.institution_name ?? 'Unnamed School',
      schoolName: school.schoolName ?? school.name ?? anyS.school_name ?? anyS.institution_name ?? 'Unnamed School',
      udiseCode: school.udiseCode ?? anyS.udise_code ?? anyS.udise ?? '',
      districtName: school.districtName ?? anyS.district_name ?? anyS.district ?? '',
      stateName: school.stateName ?? anyS.state_name ?? anyS.state ?? '',
      schoolType: school.schoolType ?? anyS.school_type ?? anyS.type ?? '',
      management: school.management ?? anyS.management_type ?? anyS.management ?? '',
      status: school.status ?? (anyS.is_active !== undefined ? (anyS.is_active ? 'active' : 'inactive') : anyS.status_text) ?? 'unknown',
      userCount: school.userCount ?? anyS.user_count ?? anyS.users ?? 0,
      classCount: school.classCount ?? anyS.class_count ?? anyS.classes ?? 0,
      createdAt: school.createdAt ?? anyS.created_at ?? anyS.date_created ?? new Date().toISOString(),
      updatedAt: school.updatedAt ?? anyS.updated_at ?? anyS.date_updated ?? new Date().toISOString(),
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
    const base = buildApiUrl(endpoint);
    const url = new URL(base);
    // Cache-buster to avoid 304/opaque caching issues
    url.searchParams.set('_ts', String(Date.now()));
    const finalUrl = url.toString();
    console.log(`[ApiService] GET ${finalUrl}`);
    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: this.getAuthHeaders(false), // No Content-Type for GET requests
      cache: 'no-store',
      mode: 'cors',
    });

    return this.handleResponse<T>(response);
  }

  async getWithParams<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined | null>): Promise<T> {
    const base = buildApiUrl(endpoint);
    const url = new URL(base);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        const val = typeof value === 'string' ? value : String(value);
        if (val && val !== 'undefined' && val !== 'null' && val !== '[object Object]') {
          url.searchParams.append(key, val);
        }
      });
    }
    // Cache-buster
    url.searchParams.set('_ts', String(Date.now()));
    const finalUrl = url.toString();
    console.log(`[ApiService] GET ${finalUrl}`);
    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: this.getAuthHeaders(false), // No Content-Type for GET requests
      cache: 'no-store',
      mode: 'cors',
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

    const apiKey =
      (import.meta.env.VITE_SCHOOL_API_KEY as string) ||
      (import.meta.env.VITE_API_KEY as string) ||
      (import.meta.env.VITE_SCHOOLS_API_KEY as string);

    const headers: Record<string, string> = {};
    if (apiKey) headers['x-api-key'] = apiKey;

    const response = await fetch(buildApiUrl(endpoint), {
      method: 'POST',
      headers,
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
    const apiKey =
      (import.meta.env.VITE_SCHOOL_API_KEY as string) ||
      (import.meta.env.VITE_API_KEY as string) ||
      (import.meta.env.VITE_SCHOOLS_API_KEY as string);
    const url = buildApiUrl(`/csv/jobs/${id}/export-failed`);
    const headers: Record<string, string> = {};
    if (apiKey) headers['x-api-key'] = apiKey;
    const resp = await fetch(url, {
      headers,
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
    console.log(`[ApiService] getSchools (direct) called with filters:`, filters);
    const result = await this.getWithParams<any>('/schools', filters ?? {});
    const schoolsArray = this.unwrapSchoolsResponse(result);
    // Normalize each school object to consistent field names
    const normalizedSchools = schoolsArray.map(school => this.normalizeSchool(school));
    console.log(`[ApiService] getSchools returning ${normalizedSchools.length} normalized schools`);
    return normalizedSchools;
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