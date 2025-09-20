import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/apiService';
import { transformSchools } from '@/lib/apiTransforms';

export interface SchoolFilters {
  search?: string;
  status?: string;
  management?: string;
  state?: string;
  district?: string;
  page?: number;
  limit?: number;
}

export interface SchoolsResponse {
  schools: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Schools list with pagination
export const useSchoolsQuery = (filters: SchoolFilters = {}) => {
  const queryKey = ['schools', filters];
  
  return useQuery({
    queryKey,
    queryFn: async (): Promise<SchoolsResponse> => {
      console.log('[useSchoolsQuery] Fetching with filters:', filters);
      
      const apiFilters: any = {};
      if (filters.search) apiFilters.search = filters.search;
      if (filters.status && filters.status !== 'all') apiFilters.status = filters.status;
      if (filters.management && filters.management !== 'all') apiFilters.management = filters.management;
      if (filters.state && filters.state !== 'all') apiFilters.state = filters.state;
      if (filters.district && filters.district !== 'all') apiFilters.district = filters.district;
      if (filters.limit) apiFilters.limit = filters.limit.toString();
      if (filters.page) {
        const offset = ((filters.page - 1) * (filters.limit || 20));
        apiFilters.offset = offset.toString();
      }
      
      const response = await apiService.getSchools(apiFilters);
      console.log('[useSchoolsQuery] API response:', response);
      
      // Handle different response formats
      let schools, pagination;
      
      if (Array.isArray(response)) {
        // Direct array response
        schools = transformSchools(response);
        pagination = {
          page: filters.page || 1,
          limit: filters.limit || 20,
          total: response.length, // This is not accurate for total count
          pages: 1
        };
      } else if ((response as any)?.schools || (response as any)?.data) {
        // Wrapped response with pagination
        const schoolsArray = (response as any).schools || (response as any).data;
        schools = transformSchools(schoolsArray);
        pagination = (response as any).pagination || {
          page: filters.page || 1,
          limit: filters.limit || 20,
          total: schoolsArray.length,
          pages: 1
        };
      } else {
        schools = [];
        pagination = {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0
        };
      }
      
      return { schools, pagination };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Schools statistics (counts only)
export const useSchoolsStats = () => {
  return useQuery({
    queryKey: ['schools-stats'],
    queryFn: async () => {
      console.log('[useSchoolsStats] Fetching statistics...');
      
      try {
        // Try to get a large sample for statistics
        const response = await apiService.getSchools({ limit: '10000' });
        const schoolsArray = Array.isArray(response) ? response : 
          (response as any)?.schools || (response as any)?.data || [];
        const schools = transformSchools(schoolsArray);
        
        const stats = {
          total: schools.length,
          active: schools.filter(s => 
            s.status?.toLowerCase() === 'approved' || s.status?.toLowerCase() === 'active'
          ).length,
          pending: schools.filter(s => s.status?.toLowerCase() === 'pending').length,
          rejected: schools.filter(s => s.status?.toLowerCase() === 'rejected').length,
          byState: schools.reduce((acc, school) => {
            const state = school.stateName || 'Unknown';
            acc[state] = (acc[state] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          byManagement: schools.reduce((acc, school) => {
            const mgmt = school.management || 'Unknown';
            acc[mgmt] = (acc[mgmt] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        };
        
        console.log('[useSchoolsStats] Calculated stats:', stats);
        return stats;
      } catch (error) {
        console.error('[useSchoolsStats] Error:', error);
        return {
          total: 0,
          active: 0,
          pending: 0,
          rejected: 0,
          byState: {},
          byManagement: {}
        };
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

// Hook to invalidate queries after mutations
export const useInvalidateSchools = () => {
  const queryClient = useQueryClient();
  
  return {
    invalidateList: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
    },
    invalidateStats: () => {
      queryClient.invalidateQueries({ queryKey: ['schools-stats'] });
    },
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      queryClient.invalidateQueries({ queryKey: ['schools-stats'] });
    }
  };
};