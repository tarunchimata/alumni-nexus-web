import React, { useState, useRef, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Plus, 
  RefreshCw, 
  Search, 
  Filter, 
  Download,
  Upload,
  FileSpreadsheet,
  Settings,
  MoreVertical
} from 'lucide-react';

import { SchoolsTabs, type SchoolTab } from './SchoolsTabs';
import { SchoolsDataGrid } from './SchoolsDataGrid';
import { SchoolsAnalytics } from './SchoolsAnalytics';
import { SchoolFormModal } from './SchoolFormModal';
import { SchoolsExportModal } from './SchoolsExportModal';
import { useSchoolsQuery, useSchoolsStats, useStatesOptions, useInvalidateSchools, SchoolFilters } from '@/hooks/useSchoolsQuery';
import { useDistrictsOptions, useManagementOptions, useSchoolTypeOptions, useStatusOptions } from '@/hooks/useDistrictsOptions';
import { DynamicSchoolFilters } from './DynamicSchoolFilters';
import { type School } from '@/lib/apiTransforms';
import { usePermissions } from '@/hooks/usePermissions';
import { apiService } from '@/services/apiService';

// Create a query client for the component
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

interface ValidationResult {
  issues: string[];
}

const EnhancedSchoolsManagementContent: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<SchoolTab>('overview');
  const [filters, setFilters] = useState<SchoolFilters>({
    page: 1,
    limit: 50, // Increase default limit to show more schools
  });
  const [searchInput, setSearchInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput, page: 1 }));
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Hooks
  const permissions = usePermissions();
  const { invalidateList, invalidateStats, invalidateAll } = useInvalidateSchools();
  
  // Queries
  const schoolsQuery = useSchoolsQuery(filters);
  const statsQuery = useSchoolsStats();
  const statesQuery = useStatesOptions();
  
  // Dynamic filter options based on selected state
  const districtsQuery = useDistrictsOptions(filters.state);
  const managementQuery = useManagementOptions();
  const schoolTypeQuery = useSchoolTypeOptions();
  const statusQuery = useStatusOptions();

  const schools = schoolsQuery.data?.schools || [];
  const pagination = schoolsQuery.data?.pagination || { page: 1, limit: 50, total: 0, pages: 0 };
  const totalCount = pagination.total;
  const stats = statsQuery.data;

  const handleFilterChange = (key: keyof SchoolFilters, value: any) => {
    if (key === 'search') {
      setSearchInput(value);
      return;
    }
    
    // Clear district when state changes
    if (key === 'state') {
      setFilters(prev => ({
        ...prev,
        state: value,
        district: undefined, // Clear district when state changes
        page: 1
      }));
      return;
    }
    
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1 // Reset to page 1 when filters change
    }));
  };

  const handleClearFilters = () => {
    setFilters({ page: 1, limit: 50 });
    setSearchInput('');
  };

  const handleApproveSchool = async (schoolId: number) => {
    if (!permissions.canApproveSchools()) {
      toast.error('You do not have permission to approve schools');
      return;
    }
    
    try {
      await apiService.approveSchool(schoolId);
      toast.success('School approved successfully');
      invalidateAll();
    } catch (error) {
      console.error('Error approving school:', error);
      toast.error('Failed to approve school');
    }
  };

  const handleValidateSchool = async (schoolId: number) => {
    try {
      const result = await apiService.validateSchool(schoolId) as ValidationResult;
      if (result.issues && result.issues.length > 0) {
        toast.error(`Validation failed: ${result.issues.join(', ')}`);
      } else {
        toast.success('School validation passed');
      }
    } catch (error) {
      console.error('Error validating school:', error);
      toast.error('Failed to validate school');
    }
  };

  const handleCreateSchool = () => {
    if (!permissions.canCreateSchools()) {
      toast.error('You do not have permission to create schools');
      return;
    }
    
    setModalMode('create');
    setSelectedSchool(null);
    setIsModalOpen(true);
  };

  const handleEditSchool = (school: School) => {
    if (!permissions.canEditSchools()) {
      toast.error('You do not have permission to edit schools');
      return;
    }
    
    setModalMode('edit');
    setSelectedSchool(school);
    setIsModalOpen(true);
  };

  const handleDeleteSchool = async (schoolId: number) => {
    if (!permissions.canDeleteSchools()) {
      toast.error('You do not have permission to delete schools');
      return;
    }
    
    try {
      await apiService.deleteSchool(schoolId);
      toast.success('School deleted successfully');
      invalidateAll();
    } catch (error) {
      console.error('Error deleting school:', error);
      toast.error('Failed to delete school');
    }
  };

  const handleModalSuccess = () => {
    invalidateAll();
    setIsModalOpen(false);
  };

  const handleRefresh = () => {
    invalidateAll();
    toast.success('Data refreshed');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Dynamic Filters */}
            <DynamicSchoolFilters
              filters={filters}
              searchInput={searchInput}
              onFilterChange={handleFilterChange}
              onSearchChange={setSearchInput}
              onClearFilters={handleClearFilters}
              onRefresh={handleRefresh}
              statesOptions={statesQuery.data || []}
              districtsOptions={districtsQuery.data || []}
              managementOptions={managementQuery.data || []}
              schoolTypeOptions={schoolTypeQuery.data || []}
              statusOptions={statusQuery.data || []}
              loading={schoolsQuery.isLoading}
            />
            
            {/* Schools Data Grid */}
            <SchoolsDataGrid
              schools={schools}
              loading={schoolsQuery.isLoading}
              totalCount={totalCount}
              currentPage={filters.page || 1}
              pageSize={filters.limit || 50}
              onPageChange={(page) => handleFilterChange('page', page)}
              onPageSizeChange={(size) => handleFilterChange('limit', size)}
              onApprove={handleApproveSchool}
              onEdit={handleEditSchool}
              onDelete={handleDeleteSchool}
              onValidate={handleValidateSchool}
            />
          </motion.div>
        );
        
      case 'analytics':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <SchoolsAnalytics 
              stats={stats || {
                total: 0,
                active: 0, 
                pending: 0,
                rejected: 0,
                byState: {},
                byManagement: {}
              }}
              loading={statsQuery.isLoading}
            />
          </motion.div>
        );
        
      case 'management':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Management Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center gap-2"
                    onClick={handleCreateSchool}
                  >
                    <Plus className="w-6 h-6" />
                    Add New School
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center gap-2"
                  >
                    <Upload className="w-6 h-6" />
                    Bulk Import
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center gap-2"
                  >
                    <FileSpreadsheet className="w-6 h-6" />
                    Export Data
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center gap-2"
                  >
                    <Settings className="w-6 h-6" />
                    Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
        
      case 'reports':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Reports & Export</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Generate Reports</h3>
                  <p className="text-muted-foreground mb-4">
                    Advanced reporting features will be available in the next update.
                  </p>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export Current View
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-full mx-auto space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Schools Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive school directory and management system
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          
          {permissions.canCreateSchools() && (
            <Button 
              onClick={handleCreateSchool}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add School
            </Button>
          )}
        </div>
      </motion.div>

      {/* Multi-Color Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <SchoolsTabs 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
      </motion.div>


      {/* Tab Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {renderTabContent()}
      </motion.div>

      {/* School Form Modal */}
      <SchoolFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        school={selectedSchool}
        mode={modalMode}
      />

      {/* Schools Export Modal */}
      <SchoolsExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        currentFilters={filters}
      />
    </div>
  );
};

export const EnhancedSchoolsManagement: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <EnhancedSchoolsManagementContent />
    </QueryClientProvider>
  );
};