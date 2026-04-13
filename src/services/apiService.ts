
// Production API Service
const RAW_BASE_URL =
  (import.meta.env.VITE_SCHOOLS_API_URL as string) ||
  (import.meta.env.VITE_API_BASE_URL as string) ||
  (import.meta.env.VITE_API_URL as string) ||
  'https://api.hostingmanager.in';

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, '');
}

function buildApiUrl(endpoint: string): string {
  const baseRaw = trimTrailingSlash(RAW_BASE_URL);
  let ep = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // If base already ends with /api and endpoint starts with /api, drop one to avoid /api/api
  const baseHasApi = /\/api$/i.test(baseRaw);
  const epStartsWithApi = /^\/api(\/|$)/i.test(ep);
  const base = baseHasApi && epStartsWithApi ? baseRaw.replace(/\/api$/i, '') : baseRaw;

  const url = `${base}${ep}`;
  const cleanUrl = url.replace(/([^:]\/)\/+/g, '$1'); // Remove duplicate slashes
  console.log(`[buildApiUrl] BaseRaw: "${baseRaw}", NormalizedBase: "${base}", Endpoint: "${ep}", Final: "${cleanUrl}"`);
  return cleanUrl;
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
    
    console.log(`[ApiService] API Key available: ${apiKey ? 'Yes' : 'No'}`);
    
    const headers: Record<string, string> = {};
    // Since user confirmed API works without key, let's not send it for now
    // if (apiKey) headers['x-api-key'] = apiKey;
    
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
    console.log('[ApiService] Raw API response:', JSON.stringify(response, null, 2));
    console.log('[ApiService] Response type:', typeof response);
    console.log('[ApiService] Is Array:', Array.isArray(response));
    
    // Handle null/undefined responses
    if (!response) {
      console.warn('[ApiService] Response is null/undefined');
      return { schools: [] };
    }
    
    // Handle direct array response first
    if (Array.isArray(response)) {
      console.log('[ApiService] Direct array response, length:', response.length);
      return { schools: response };
    }

    // Handle {success: true, data: {...}} format - FIXED to check for data.schools
    if (response?.success) {
      // Handle success + data as array
      if (Array.isArray(response?.data)) {
        console.log('[ApiService] Success + data array, length:', response.data.length);
        return { 
          schools: response.data, 
          summary: response?.summary || response?.data?.summary 
        };
      }
      // Handle success + data.schools (THIS WAS THE MISSING CASE!)
      if (Array.isArray(response?.data?.schools)) {
        console.log('[ApiService] Success + data.schools array, length:', response.data.schools.length);
        return { 
          schools: response.data.schools, 
          summary: response?.summary || response?.data?.summary || { total: response?.data?.total } 
        };
      }
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
        console.log('[ApiService] Found schools array via candidates, length:', arr.length);
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
    console.log(`[ApiService] Making direct request to: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: options.headers as Record<string, string>,
        body: options.body,
      });

      if (!response.ok) {
        console.error(`[ApiService] API returned error: ${response.status}`);
        throw new Error(`API Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[ApiService] Response success`);
      return data;
    } catch (error) {
      console.error(`[ApiService] Request failed:`, error);
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
    return this.get(`/api/dashboard/${role}`);
  }

  // =========================
  // New High-Performance School Endpoints
  // =========================

  // Get all hierarchical data (states, districts, schools) in one call
  async getHierarchicalData(): Promise<any> {
    return this.get('/api/hierarchical');
  }

  // Get all states with school counts
  async getStates(): Promise<any> {
    return this.get('/api/states');
  }

  // Get comprehensive statistics
  async getComprehensiveStats(): Promise<any> {
    return this.get('/api/comprehensive-stats');
  }

  // Get top states by school count
  async getTopStates(limit: number = 10): Promise<any> {
    return this.getWithParams('/api/top-states', { limit });
  }

  // Get schools by category
  async getSchoolsByCategory(): Promise<any> {
    return this.get('/api/schools-by-category');
  }

  // Get schools by management type
  async getSchoolsByManagement(): Promise<any> {
    return this.get('/api/schools-by-management');
  }

  // Get schools by type
  async getSchoolsByType(): Promise<any> {
    return this.get('/api/schools-by-type');
  }

  // Search states
  async searchStates(query: string): Promise<any> {
    return this.getWithParams('/api/search-states', { q: query });
  }

  // Get state details
  async getStateDetails(stateName: string): Promise<any> {
    return this.get(`/api/state/${encodeURIComponent(stateName)}/details`);
  }

  // Get districts for a specific state
  async getStateDistricts(state: string): Promise<any> {
    return this.get(`/api/states/${encodeURIComponent(state)}/districts`);
  }

  // Get districts with school counts for a specific state
  async getDistrictsWithSchools(state: string): Promise<any> {
    return this.get(`/api/states/${encodeURIComponent(state)}/districts-with-schools`);
  }

  // Get schools for a specific state and district
  async getSchoolsByStateDistrict(state: string, district: string): Promise<any> {
    return this.get(`/api/states/${encodeURIComponent(state)}/districts/${encodeURIComponent(district)}/schools`);
  }

  // CSV Import methods
  async uploadCSV(file: File, type: 'users' | 'schools') {
    return this.uploadFile(`/api/csv/upload/${type}`, file);
  }

  async validateCSV(data: any[], type: 'users' | 'schools') {
    return this.post(`/api/csv/validate/${type}`, { data });
  }

  async importCSV(data: any[], type: 'users' | 'schools') {
    return this.post(`/api/csv/import/${type}`, { data });
  }

  // PR2 CSV Jobs API
  async uploadUsersCSV(file: File) {
    return this.uploadFile(`/api/csv/upload/users`, file);
  }

  async getCsvJobs() {
    return this.get(`/api/csv/jobs`);
  }

  async getCsvJob(id: number) {
    return this.get(`/api/csv/jobs/${id}`);
  }

  async approveCsvJob(id: number) {
    return this.post(`/api/csv/jobs/${id}/approve`, {});
  }

  async activateCsvJob(id: number) {
    return this.post(`/api/csv/jobs/${id}/activate`, {});
  }

  async getCsvJobLogs(id: number) {
    return this.get(`/api/csv/jobs/${id}/logs`);
  }

  async exportFailedCsvRows(id: number): Promise<Blob> {
    const apiKey =
      (import.meta.env.VITE_SCHOOL_API_KEY as string) ||
      (import.meta.env.VITE_API_KEY as string) ||
      (import.meta.env.VITE_SCHOOLS_API_KEY as string);
    const url = buildApiUrl(`/api/csv/jobs/${id}/export-failed`);
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
    return this.get(`/api/users${queryParams}`);
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
    const result = await this.getWithParams<any>('/api/schools', filters ?? {});
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
    return this.get('/api/schools/statistics/status');
  }

  async getStateWiseStats() {
    console.log('[ApiService] Fetching state-wise statistics');
    return this.get('/api/schools/statistics/states');
  }

  async getDistrictWiseStats() {
    console.log('[ApiService] Fetching district-wise statistics');
    return this.get('/api/schools/statistics/districts');
  }

  async getManagementStats() {
    console.log('[ApiService] Fetching management-wise statistics');
    return this.get('/api/schools/statistics/management');
  }

  async getSchool(id: string | number) {
    return this.get(`/api/schools/${id}`);
  }

  async createSchool(data: any) {
    return this.post('/api/schools', data);
  }

  async updateSchool(id: string | number, data: any) {
    return this.put(`/api/schools/${id}`, data);
  }

  async deleteSchool(id: string | number) {
    return this.delete(`/api/schools/${id}`);
  }

  async approveSchool(id: string | number) {
    return this.post(`/api/schools/${id}/approve`, {});
  }

  async validateSchool(id: string | number) {
    return this.post(`/api/schools/${id}/validate`, {});
  }

  async connectUser(userId: string) {
    return this.post(`/api/connections/request`, { userId });
  }

  async getUserProfile(userId: string) {
    return this.get(`/api/users/${userId}`);
  }

  // Health Check
  async checkHealth() {
    return this.get('/api/health');
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
    const result = await this.getWithParams<any>('/api/schools', params);
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