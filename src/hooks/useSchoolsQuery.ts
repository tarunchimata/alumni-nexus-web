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
        // Direct array response - likely incomplete, try to get total count
        schools = transformSchools(response);
        
        // For pagination, we need to make a separate count request if not provided
        try {
          const countResponse = await apiService.getSchools({ ...apiFilters, count: 'true' } as any);
          const totalCount = (countResponse as any)?.total || (countResponse as any)?.count || response.length;
          
          pagination = {
            page: filters.page || 1,
            limit: filters.limit || 20,
            total: totalCount,
            pages: Math.ceil(totalCount / (filters.limit || 20))
          };
        } catch (error) {
          console.warn('[useSchoolsQuery] Could not get total count, using current page size');
          pagination = {
            page: filters.page || 1,
            limit: filters.limit || 20,
            total: response.length,
            pages: 1
          };
        }
      } else if ((response as any)?.schools || (response as any)?.data) {
        // Wrapped response with pagination
        const schoolsArray = (response as any).schools || (response as any).data;
        schools = transformSchools(schoolsArray);
        
        const apiPagination = (response as any).pagination;
        if (apiPagination && apiPagination.total) {
          // Use API pagination if available
          pagination = {
            page: apiPagination.page || filters.page || 1,
            limit: apiPagination.limit || filters.limit || 20,
            total: apiPagination.total,
            pages: apiPagination.pages || Math.ceil(apiPagination.total / (apiPagination.limit || 20))
          };
        } else {
          // Fallback pagination
          pagination = {
            page: filters.page || 1,
            limit: filters.limit || 20,
            total: schoolsArray.length,
            pages: Math.max(1, Math.ceil(schoolsArray.length / (filters.limit || 20)))
          };
        }
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
        // First try to get total count efficiently
        let totalCount = 0;
        try {
          const countResponse = await apiService.getSchools({ count: 'true' } as any);
          totalCount = (countResponse as any)?.total || (countResponse as any)?.count || 0;
        } catch (error) {
          console.warn('[useSchoolsStats] Count endpoint not available, fetching sample');
        }
        
        // Get a sample for status breakdown if total count is available
        const sampleSize = Math.min(totalCount || 1000, 1000);
        const response = await apiService.getSchools({ limit: sampleSize.toString() });
        const schoolsArray = Array.isArray(response) ? response : 
          (response as any)?.schools || (response as any)?.data || [];
        const schools = transformSchools(schoolsArray);
        
        // Calculate statistics
        const sampleTotal = schools.length;
        const activeCount = schools.filter(s => 
          s.status?.toLowerCase() === 'approved' || s.status?.toLowerCase() === 'active'
        ).length;
        const pendingCount = schools.filter(s => s.status?.toLowerCase() === 'pending').length;
        const rejectedCount = schools.filter(s => s.status?.toLowerCase() === 'rejected').length;
        
        // Scale up the counts if we have a total count and sample is smaller
        const scaleFactor = totalCount > 0 && sampleTotal > 0 ? totalCount / sampleTotal : 1;
        
        const stats = {
          total: totalCount || sampleTotal,
          active: Math.round(activeCount * scaleFactor),
          pending: Math.round(pendingCount * scaleFactor),
          rejected: Math.round(rejectedCount * scaleFactor),
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