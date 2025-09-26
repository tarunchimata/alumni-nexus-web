import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/apiService';
import { transformSchools } from '@/lib/apiTransforms';

export interface SchoolFilters {
  search?: string;
  status?: string;
  management?: string;
  state?: string;
  district?: string;
  schoolType?: string;
  establishment?: string;
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
      
      let response: any;
      
      // Use high-performance endpoints based on filter selection
      if (filters.state && filters.state !== 'all' && filters.district && filters.district !== 'all') {
        // Most specific: state + district - use direct endpoint
        console.log(`[useSchoolsQuery] Using state+district endpoint: /api/states/${filters.state}/districts/${filters.district}/schools`);
        response = await apiService.getSchoolsByStateDistrict(filters.state, filters.district);
        
        // Apply client-side filters for responsiveness
        if (response && Array.isArray(response)) {
          let filteredSchools = response;
          
          if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filteredSchools = filteredSchools.filter((school: any) => 
              (school.school_name || school.name || '').toLowerCase().includes(searchTerm) ||
              (school.udise_code || school.udiseCode || '').toLowerCase().includes(searchTerm)
            );
          }
          
          if (filters.status && filters.status !== 'all') {
            filteredSchools = filteredSchools.filter((school: any) => 
              (school.status || '').toLowerCase() === filters.status.toLowerCase()
            );
          }
          
          if (filters.management && filters.management !== 'all') {
            filteredSchools = filteredSchools.filter((school: any) => 
              (school.management || school.management_type || '').toLowerCase() === filters.management.toLowerCase()
            );
          }
          
          if (filters.schoolType && filters.schoolType !== 'all') {
            filteredSchools = filteredSchools.filter((school: any) => 
              (school.school_type || school.schoolType || '').toLowerCase() === filters.schoolType.toLowerCase()
            );
          }
          
          response = filteredSchools;
        }
      } else if (filters.state && filters.state !== 'all') {
        // State only: use hierarchical data and filter client-side for speed
        console.log('[useSchoolsQuery] Using hierarchical data filtered by state:', filters.state);
        const hierarchicalData = await apiService.getHierarchicalData();
        
        if (hierarchicalData?.schools && Array.isArray(hierarchicalData.schools)) {
          let filteredSchools = hierarchicalData.schools.filter((school: any) => 
            (school.state_name || school.stateName || '').toLowerCase() === filters.state.toLowerCase()
          );
          
          // Apply other filters client-side
          if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filteredSchools = filteredSchools.filter((school: any) => 
              (school.school_name || school.name || '').toLowerCase().includes(searchTerm) ||
              (school.udise_code || school.udiseCode || '').toLowerCase().includes(searchTerm)
            );
          }
          
          if (filters.status && filters.status !== 'all') {
            filteredSchools = filteredSchools.filter((school: any) => 
              (school.status || '').toLowerCase() === filters.status.toLowerCase()
            );
          }
          
          if (filters.management && filters.management !== 'all') {
            filteredSchools = filteredSchools.filter((school: any) => 
              (school.management || school.management_type || '').toLowerCase() === filters.management.toLowerCase()
            );
          }
          
          if (filters.schoolType && filters.schoolType !== 'all') {
            filteredSchools = filteredSchools.filter((school: any) => 
              (school.school_type || school.schoolType || '').toLowerCase() === filters.schoolType.toLowerCase()
            );
          }
          
          response = filteredSchools;
        }
      } else {
        // No specific state/district: try /api/schools with fallback to hierarchical
        console.log('[useSchoolsQuery] Using general schools endpoint with filters');
        try {
          const apiFilters: any = {};
          if (filters.search) apiFilters.search = filters.search;
          if (filters.status && filters.status !== 'all') apiFilters.status = filters.status;
          if (filters.management && filters.management !== 'all') apiFilters.management = filters.management;
          if (filters.schoolType && filters.schoolType !== 'all') apiFilters.school_type = filters.schoolType;
          if (filters.establishment && filters.establishment !== 'all') apiFilters.establishment = filters.establishment;
          if (filters.limit) apiFilters.limit = filters.limit.toString();
          if (filters.page) {
            const offset = ((filters.page - 1) * (filters.limit || 50));
            apiFilters.offset = offset.toString();
          }
          
          response = await apiService.getSchools(apiFilters);
        } catch (error) {
          console.warn('[useSchoolsQuery] General schools endpoint failed, falling back to hierarchical data');
          const hierarchicalData = await apiService.getHierarchicalData();
          response = hierarchicalData?.schools || [];
        }
      }
      
      console.log('[useSchoolsQuery] Final API response:', response);
      
      // Handle the response format and transform schools
      let schools, pagination;
      
      if ((response as any).schools) {
        // New format from updated API service
        schools = transformSchools((response as any).schools);
        
        // Get total from summary or try statistics endpoint
        let totalCount = (response as any).summary?.totalSchools || (response as any).summary?.total;
        if (!totalCount) {
          try {
            const statsResponse = await apiService.getComprehensiveStats();
            const statsData = statsResponse as any;
            totalCount = statsData?.totalSchools || 0;
          } catch (error) {
            console.warn('[useSchoolsQuery] Could not get total count from statistics');
            totalCount = (response as any).schools.length;
          }
        }
        
        pagination = {
          page: filters.page || 1,
          limit: filters.limit || 50,
          total: totalCount,
          pages: Math.ceil(totalCount / (filters.limit || 50))
        };
      } else if (Array.isArray(response)) {
        // Direct array response from high-performance endpoints
        schools = transformSchools(response);
        
        // For client-side filtering, use actual array length
        const totalCount = schools.length;
        
        // Apply pagination client-side for filtered results
        const startIndex = ((filters.page || 1) - 1) * (filters.limit || 50);
        const endIndex = startIndex + (filters.limit || 50);
        const paginatedSchools = schools.slice(startIndex, endIndex);
        
        pagination = {
          page: filters.page || 1,
          limit: filters.limit || 50,
          total: totalCount,
          pages: Math.ceil(totalCount / (filters.limit || 50))
        };
        
        schools = paginatedSchools;
      } else {
        schools = [];
        pagination = {
          page: 1,
          limit: 50,
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

// Schools statistics using comprehensive stats endpoint
export const useSchoolsStats = () => {
  return useQuery({
    queryKey: ['schools-stats'],
    queryFn: async () => {
      console.log('[useSchoolsStats] Fetching comprehensive statistics...');
      
      try {
        // Use the new comprehensive stats endpoint
        const [comprehensiveStats, managementStats, categoryStats] = await Promise.all([
          apiService.getComprehensiveStats(),
          apiService.getSchoolsByManagement(),
          apiService.getSchoolsByCategory(),
        ]);
        
        console.log('[useSchoolsStats] Comprehensive stats:', comprehensiveStats);
        console.log('[useSchoolsStats] Management stats:', managementStats);
        
        const statsData = comprehensiveStats as any;
        
        // Extract total count
        const totalCount = statsData?.totalSchools || 
                          statsData?.summary?.totalSchools ||
                          statsData?.data?.totalSchools || 0;
        
        // Extract status breakdown
        const activeCount = statsData?.activeSchools || 
                           statsData?.byStatus?.active || 
                           totalCount; // Fallback to total if no breakdown
        const pendingCount = statsData?.pendingSchools || 
                            statsData?.byStatus?.pending || 0;
        const rejectedCount = statsData?.rejectedSchools || 
                             statsData?.byStatus?.rejected || 0;
        
        // Extract state data
        const byState: Record<string, number> = {};
        if (statsData?.byState) {
          Object.entries(statsData.byState).forEach(([state, count]) => {
            byState[state] = parseInt(String(count)) || 0;
          });
        }
        
        // Extract management data from dedicated endpoint
        const byManagement: Record<string, number> = {};
        const managementData = managementStats as any;
        if (managementData?.data && Array.isArray(managementData.data)) {
          managementData.data.forEach((item: any) => {
            const type = item.management_type || item.managementType || item.type;
            const count = parseInt(item.count) || 0;
            if (type && count > 0) {
              byManagement[type] = count;
            }
          });
        } else if (statsData?.byManagement) {
          Object.entries(statsData.byManagement).forEach(([type, count]) => {
            byManagement[type] = parseInt(String(count)) || 0;
          });
        }
        
        const stats = {
          total: totalCount,
          active: activeCount,
          pending: pendingCount,
          rejected: rejectedCount,
          byState,
          byManagement,
        };
        
        console.log('[useSchoolsStats] Comprehensive stats calculated:', stats);
        return stats;
      } catch (error) {
        console.error('[useSchoolsStats] Error fetching comprehensive stats:', error);
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

// Hook for state options using new states endpoint
export const useStatesOptions = () => {
  return useQuery({
    queryKey: ['states-options'],
    queryFn: async () => {
      const response = await apiService.getStates();
      const responseData = response as any;
      
      if (responseData?.states && Array.isArray(responseData.states)) {
        return responseData.states
          .map((item: any) => ({
            value: item.name || item.state_name || item.stateName,
            label: item.name || item.state_name || item.stateName,
            count: parseInt(item.school_count || item.schoolCount || item.count) || 0
          }))
          .filter((item: any) => item.value && item.count > 0)
          .sort((a: any, b: any) => b.count - a.count);
      } else if (Array.isArray(responseData)) {
        return responseData
          .map((item: any) => ({
            value: item.name || item.state_name || item.stateName,
            label: item.name || item.state_name || item.stateName,
            count: parseInt(item.school_count || item.schoolCount || item.count) || 0
          }))
          .filter((item: any) => item.value && item.count > 0)
          .sort((a: any, b: any) => b.count - a.count);
      }
      return [];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 60 minutes
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