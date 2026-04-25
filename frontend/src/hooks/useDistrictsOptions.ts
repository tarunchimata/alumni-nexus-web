import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/apiService';

// Hook for district options based on selected state
export const useDistrictsOptions = (state?: string) => {
  return useQuery({
    queryKey: ['districts-options', state],
    queryFn: async () => {
      if (!state || state === 'all') {
        return [];
      }
      
      const response = await apiService.getDistrictsWithSchools(state);
      const responseData = response as any;
      
      if (responseData?.districts && Array.isArray(responseData.districts)) {
        return responseData.districts
          .map((item: any) => ({
            value: item.name || item.district_name || item.districtName,
            label: item.name || item.district_name || item.districtName,
            count: parseInt(item.school_count || item.schoolCount || item.count) || 0
          }))
          .filter((item: any) => item.value && item.count > 0)
          .sort((a: any, b: any) => b.count - a.count);
      } else if (Array.isArray(responseData)) {
        return responseData
          .map((item: any) => ({
            value: item.name || item.district_name || item.districtName,
            label: item.name || item.district_name || item.districtName,
            count: parseInt(item.school_count || item.schoolCount || item.count) || 0
          }))
          .filter((item: any) => item.value && item.count > 0)
          .sort((a: any, b: any) => b.count - a.count);
      }
      return [];
    },
    enabled: !!state && state !== 'all',
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

// Hook for management type options
export const useManagementOptions = () => {
  return useQuery({
    queryKey: ['management-options'],
    queryFn: async () => {
      const response = await apiService.getSchoolsByManagement();
      const responseData = response as any;
      
      if (responseData?.data && Array.isArray(responseData.data)) {
        return responseData.data
          .map((item: any) => ({
            value: item.management_type || item.managementType || item.type,
            label: item.management_type || item.managementType || item.type,
            count: parseInt(item.count) || 0
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

// Hook for school type options
export const useSchoolTypeOptions = () => {
  return useQuery({
    queryKey: ['school-type-options'],
    queryFn: async () => {
      const response = await apiService.getSchoolsByType();
      const responseData = response as any;
      
      if (responseData?.data && Array.isArray(responseData.data)) {
        return responseData.data
          .map((item: any) => ({
            value: item.school_type || item.schoolType || item.type,
            label: item.school_type || item.schoolType || item.type,
            count: parseInt(item.count) || 0
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

// Hook for status options (from comprehensive stats)
export const useStatusOptions = () => {
  return useQuery({
    queryKey: ['status-options'],
    queryFn: async () => {
      const response = await apiService.getComprehensiveStats();
      const responseData = response as any;
      
      const options = [];
      
      // Check various places where status data might be
      if (responseData?.byStatus) {
        Object.entries(responseData.byStatus).forEach(([status, count]) => {
          if (parseInt(String(count)) > 0) {
            options.push({
              value: status,
              label: status.charAt(0).toUpperCase() + status.slice(1),
              count: parseInt(String(count))
            });
          }
        });
      } else {
        // Fallback to common status options
        const fallbackOptions = [
          { value: 'active', label: 'Active', count: responseData?.activeSchools || 0 },
          { value: 'pending', label: 'Pending', count: responseData?.pendingSchools || 0 },
          { value: 'rejected', label: 'Rejected', count: responseData?.rejectedSchools || 0 },
        ];
        
        options.push(...fallbackOptions.filter(opt => opt.count > 0));
      }
      
      return options.sort((a, b) => b.count - a.count);
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 60 minutes
  });
};