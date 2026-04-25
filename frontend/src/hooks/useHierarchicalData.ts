import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/apiService';
import { transformSchools } from '@/lib/apiTransforms';

// Hook for hierarchical data (all states, districts, schools in one call)
export const useHierarchicalData = () => {
  return useQuery({
    queryKey: ['hierarchical-data'],
    queryFn: async () => {
      console.log('[useHierarchicalData] Fetching hierarchical data...');
      
      const response = await apiService.getHierarchicalData();
      const responseData = response as any;
      
      console.log('[useHierarchicalData] Raw response:', responseData);
      
      // Extract hierarchical structure
      const states = responseData?.states || [];
      const districts = responseData?.districts || [];
      const schools = responseData?.schools || responseData?.data?.schools || [];
      
      // Transform schools if needed
      const transformedSchools = Array.isArray(schools) ? transformSchools(schools) : [];
      
      const result = {
        states: states.map((state: any) => ({
          name: state.name || state.state_name || state.stateName,
          schoolCount: parseInt(state.school_count || state.schoolCount || state.count) || 0,
          districts: state.districts || []
        })),
        districts: districts.map((district: any) => ({
          name: district.name || district.district_name || district.districtName,
          state: district.state || district.state_name || district.stateName,
          schoolCount: parseInt(district.school_count || district.schoolCount || district.count) || 0
        })),
        schools: transformedSchools,
        totalSchools: responseData?.totalSchools || transformedSchools.length,
        totalStates: states.length,
        totalDistricts: districts.length
      };
      
      console.log('[useHierarchicalData] Processed result:', result);
      return result;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes - hierarchical data doesn't change often
    gcTime: 1000 * 60 * 60, // 60 minutes
  });
};

// Hook for state search functionality
export const useStateSearch = () => {
  const searchStates = async (query: string) => {
    if (!query || query.length < 2) {
      return [];
    }
    
    const response = await apiService.searchStates(query);
    const responseData = response as any;
    
    if (responseData?.states && Array.isArray(responseData.states)) {
      return responseData.states.map((state: any) => ({
        name: state.name || state.state_name || state.stateName,
        schoolCount: parseInt(state.school_count || state.schoolCount || state.count) || 0
      }));
    } else if (Array.isArray(responseData)) {
      return responseData.map((state: any) => ({
        name: state.name || state.state_name || state.stateName,
        schoolCount: parseInt(state.school_count || state.schoolCount || state.count) || 0
      }));
    }
    
    return [];
  };
  
  return { searchStates };
};

// Hook for state details
export const useStateDetails = (stateName?: string) => {
  return useQuery({
    queryKey: ['state-details', stateName],
    queryFn: async () => {
      if (!stateName) return null;
      
      const response = await apiService.getStateDetails(stateName);
      const responseData = response as any;
      
      return {
        name: responseData?.name || responseData?.state_name || stateName,
        totalSchools: parseInt(responseData?.total_schools || responseData?.totalSchools || responseData?.schoolCount) || 0,
        districts: responseData?.districts || [],
        managementBreakdown: responseData?.by_management || responseData?.byManagement || {},
        typeBreakdown: responseData?.by_type || responseData?.byType || {},
        ...responseData
      };
    },
    enabled: !!stateName && stateName !== 'all',
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 60 minutes
  });
};