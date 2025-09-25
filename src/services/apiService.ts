
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
  private async getAuthHeaders(includeContentType = true): Promise<Record<string, string>> {
    const apiKey =
      (import.meta.env.VITE_SCHOOL_API_KEY as string) ||
      (import.meta.env.VITE_API_KEY as string) ||
      (import.meta.env.VITE_SCHOOLS_API_KEY as string);
    
    const headers: Record<string, string> = {};
    if (apiKey) headers['x-api-key'] = apiKey;
    
    // Add Bearer token if available
    try {
      const { authService } = await import('@/lib/auth');
      const token = localStorage.getItem('auth_access_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('[ApiService] Could not load auth service:', error);
    }
    
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  // Global API error handler
  private handleAPIError(error: any): never {
    console.error('[ApiService] API Error:', error);
    
    if (error.response?.status === 401) {
      // Token expired or invalid - logout user
      localStorage.removeItem('auth_access_token');
      localStorage.removeItem('auth_refresh_token');
      localStorage.removeItem('auth_expires_at');
      window.location.href = '/login';
      throw new Error('Authentication required. Please log in again.');
    } else if (error.response?.status === 403) {
      throw new Error('You do not have permission to perform this action.');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.message?.includes('NetworkError') || error.message?.includes('Failed to fetch')) {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error(error.message || 'An unexpected error occurred.');
    }
  }

  private unwrapSchoolsResponse(response: any): { schools: any[], summary?: any } {
    console.log('[ApiService] Unwrapping schools response:', response);
    
    // Handle null/undefined responses
    if (!response) {
      console.warn('[ApiService] Response is null/undefined');
      return { schools: [] };
    }
    
    // Handle {success: true, data: [...], summary: {...}} format
    if (response?.success && response?.data) {
      return {
        schools: Array.isArray(response.data) ? response.data : [],
        summary: response.summary || {}
      };
    }
    
    // Handle direct array response
    if (Array.isArray(response)) {
      return { schools: response };
    }

    // Collect common wrapper patterns - extended list
    const candidates = [
      response?.schools,
      response?.data?.schools,
      response?.data,
      response?.rows,
      response?.records,
      response?.items,
      response?.result,
      response?.results,
      response?.data?.rows,
      response?.data?.items,
      response?.data?.records,
      response?.data?.result,
      response?.data?.results,
      response?.data?.data, // sometimes nested data under data
      response?.payload?.schools,
      response?.payload?.data,
    ];

    for (const arr of candidates) {
      if (Array.isArray(arr)) {
        console.log('[ApiService] Found schools array, length:', arr.length);
        return { schools: arr, summary: response?.summary };
      }
    }

    // Check if response is a single school object
    if (typeof response === 'object' && !Array.isArray(response)) {
      const schoolFields = ['name', 'schoolName', 'school_name', 'institutionName', 'institution_name', 'udiseCode', 'udise_code'];
      const hasSchoolField = schoolFields.some(field => response[field]);
      
      if (hasSchoolField) {
        console.log('[ApiService] Detected single school object, wrapping in array');
        return { schools: [response] };
      }
    }

    console.warn('[ApiService] Could not find schools array in response. Top-level keys:', Object.keys(response || {}));
    return { schools: [] };
  }

  private normalizeSchool(school: any): any {
    const anyS = school as any;
    const idRaw = school.id ?? anyS.institution_id ?? anyS.school_id ?? anyS.id ?? anyS._id ?? anyS.udiseCode ?? anyS.udise_code ?? anyS.udise;
    const nameRaw = school.name ?? school.schoolName ?? anyS.school_name ?? anyS.institution_name;
    const udiseRaw = school.udiseCode ?? anyS.udise_code ?? anyS.udise ?? anyS.udiseCode;
    const districtRaw = school.districtName ?? anyS.district_name ?? anyS.district;
    const stateRaw = school.stateName ?? anyS.state_name ?? anyS.state;
    const typeRaw = school.schoolType ?? anyS.school_type ?? anyS.type;
    const managementRaw = school.management ?? anyS.management_type ?? anyS.management;
    const statusRaw = school.status ?? (anyS.is_active !== undefined ? (anyS.is_active ? 'active' : 'inactive') : anyS.status_text ?? anyS.status);

    const userCount = Number(school.userCount ?? anyS.user_count ?? anyS.users ?? 0) || 0;
    const classCount = Number(school.classCount ?? anyS.class_count ?? anyS.classes ?? 0) || 0;

    return {
      id: this.sanitizeString(idRaw) || this.sanitizeString(udiseRaw),
      name: this.sanitizeString(nameRaw) || 'Unnamed School',
      schoolName: this.sanitizeString(nameRaw) || 'Unnamed School',
      udiseCode: this.sanitizeString(udiseRaw),
      districtName: this.sanitizeString(districtRaw),
      stateName: this.sanitizeString(stateRaw),
      schoolType: this.sanitizeString(typeRaw),
      management: this.sanitizeString(managementRaw),
      status: this.normalizeStatus(statusRaw),
      userCount,
      classCount,
      createdAt: school.createdAt ?? anyS.created_at ?? anyS.date_created ?? new Date().toISOString(),
      updatedAt: school.updatedAt ?? anyS.updated_at ?? anyS.date_updated ?? new Date().toISOString(),
    };
  }

  // Sanitization helpers
  private sanitizeString(value: any): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    return str.replace(/\s+/g, ' ').trim();
  }

  private normalizeStatus(value: any): string {
    const s = this.sanitizeString(value).toLowerCase();
    if (!s) return 'unknown';
    if (['active','approved','enabled','1','true','yes'].includes(s)) return 'active';
    if (['inactive','disabled','0','false','no','deactivated'].includes(s)) return 'inactive';
    if (['pending','awaiting','in review','review'].includes(s)) return 'pending';
    return s;
  }

  private dedupeSchools(list: any[]): any[] {
    const seen = new Set<string>();
    const result: any[] = [];
    for (const s of list) {
      const idKey = this.sanitizeString(s?.udiseCode) || this.sanitizeString(s?.id);
      if (!idKey) continue;
      const key = idKey.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(s);
    }
    return result;
  }

  private async makeProxyRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    console.log(`[ApiService] Making proxy request to: ${url}`);
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('api-proxy', {
        body: {
          url,
          method: options.method || 'GET',
          headers: options.headers || {},
          body: options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : undefined
        }
      });

      if (error) {
        console.error(`[ApiService] Proxy error:`, error);
        throw new Error(`Proxy request failed: ${error.message}`);
      }

      if (!data || !data.ok) {
        console.error(`[ApiService] API returned error:`, data);
        throw new Error(`API Error ${data?.status || 'Unknown'}: ${data?.statusText || 'Unknown error'}`);
      }

      console.log(`[ApiService] Proxy response success:`, data);
      
      // Return the response body, ensuring we don't return null
      const responseBody = data.bodyJson || data.bodyText;
      if (responseBody === null || responseBody === undefined) {
        console.warn(`[ApiService] Response body is null, returning empty object`);
        return {} as T;
      }
      
      return responseBody;
    } catch (error) {
      console.error(`[ApiService] Proxy request failed:`, error);
      throw error;
    }
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
    try {
      const base = buildApiUrl(endpoint);
      const url = new URL(base);
      // Cache-buster to avoid 304/opaque caching issues
      url.searchParams.set('_ts', String(Date.now()));
      const finalUrl = url.toString();
      console.log(`[ApiService] GET ${finalUrl}`);
      
      return await this.makeProxyRequest<T>(finalUrl, {
        method: 'GET',
        headers: await this.getAuthHeaders(false), // No Content-Type for GET requests
      });
    } catch (error) {
      this.handleAPIError(error);
    }
  }

  async getWithParams<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined | null>): Promise<T> {
    try {
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
      
      return await this.makeProxyRequest<T>(finalUrl, {
        method: 'GET',
        headers: await this.getAuthHeaders(false), // No Content-Type for GET requests
      });
    } catch (error) {
      this.handleAPIError(error);
    }
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    try {
      return await this.makeProxyRequest<T>(buildApiUrl(endpoint), {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(data),
      });
    } catch (error) {
      this.handleAPIError(error);
    }
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    try {
      return await this.makeProxyRequest<T>(buildApiUrl(endpoint), {
        method: 'PUT',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(data),
      });
    } catch (error) {
      this.handleAPIError(error);
    }
  }

  async delete<T>(endpoint: string): Promise<T> {
    try {
      return await this.makeProxyRequest<T>(buildApiUrl(endpoint), {
        method: 'DELETE',
        headers: await this.getAuthHeaders(),
      });
    } catch (error) {
      this.handleAPIError(error);
    }
  }

  async uploadFile<T>(endpoint: string, file: File): Promise<T> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const headers = await this.getAuthHeaders(false); // No Content-Type for FormData
      delete headers['Content-Type']; // Let browser set Content-Type for FormData

      const response = await fetch(buildApiUrl(endpoint), {
        method: 'POST',
        headers,
        body: formData,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      this.handleAPIError(error);
    }
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
    district?: string;
    management?: string;
    school_type?: string;
  }) {
    console.log(`[ApiService] getSchools (direct) called with filters:`, filters);
    const result = await this.getWithParams<any>('/schools', filters ?? {});
    const { schools: schoolsArray, summary } = this.unwrapSchoolsResponse(result);
    // Normalize and dedupe
    const normalizedSchools = this.dedupeSchools(
      (schoolsArray || []).map((school) => this.normalizeSchool(school))
    );
    console.log(`[ApiService] getSchools returning ${normalizedSchools.length} normalized schools (deduped)`);
    return { schools: normalizedSchools, summary, pagination: result?.pagination };
  }

  // Statistics endpoints for real data
  async getSchoolsStatistics() {
    console.log('[ApiService] Fetching schools statistics');
    return this.get('/schools/statistics/status');
  }

  async getStateWiseStats() {
    console.log('[ApiService] Fetching state-wise statistics');
    return this.get('/schools/statistics/states');
  }

  async getDistrictWiseStats() {
    console.log('[ApiService] Fetching district-wise statistics');
    return this.get('/schools/statistics/districts');
  }

  async getManagementStats() {
    console.log('[ApiService] Fetching management-wise statistics');
    return this.get('/schools/statistics/management');
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

  // Health Check
  async checkHealth() {
    return this.get('/health');
  }

  // Enhanced Search Methods
  async searchSchools(searchTerm: string, filters?: { 
    state?: string; 
    district?: string; 
    status?: string; 
    limit?: number; 
  }) {
    console.log(`[ApiService] searchSchools called with term:`, searchTerm, 'filters:', filters);
    const params: any = { search: searchTerm };
    if (filters) {
      Object.assign(params, filters);
    }
    const result = await this.getWithParams<any>('/schools', params);
    const { schools: schoolsArray, summary } = this.unwrapSchoolsResponse(result);
    const normalizedSchools = this.dedupeSchools(
      (schoolsArray || []).map((school) => this.normalizeSchool(school))
    );
    console.log(`[ApiService] searchSchools returning ${normalizedSchools.length} normalized schools (deduped)`);
    return { schools: normalizedSchools, summary, pagination: result?.pagination };
  }

  // Filter schools by state
  async getSchoolsByState(state: string, additionalFilters?: any) {
    return this.getSchools({ state, ...additionalFilters });
  }

  // Filter schools by status  
  async getSchoolsByStatus(status: string, additionalFilters?: any) {
    return this.getSchools({ status, ...additionalFilters });
  }

  // Get schools with pagination
  async getSchoolsPaginated(page = 1, limit = 10, filters?: any) {
    const offset = (page - 1) * limit;
    return this.getSchools({ limit: limit.toString(), offset: offset.toString(), ...filters });
  }
}

export const apiService = new ApiService();
export default apiService;