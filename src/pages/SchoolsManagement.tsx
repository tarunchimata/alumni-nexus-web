import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, RefreshCw, CheckCircle, AlertCircle, Plus, Edit, Trash2, School as SchoolIcon, MapPin, Users } from 'lucide-react';
import { toast } from 'sonner';
import { transformSchools, type School } from '@/lib/apiTransforms';
import { apiService } from '@/services/apiService';
import { SchoolFormModal } from '@/components/schools/SchoolFormModal';
import { usePermissions } from '@/hooks/usePermissions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ValidationResult {
  issues: string[];
}


const SchoolsManagement: React.FC = () => {
  const [allSchools, setAllSchools] = useState<School[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const itemsPerPage = 12;
  const permissions = usePermissions();

  useEffect(() => {
    fetchSchools();
  }, [currentPage, searchTerm, statusFilter, typeFilter]);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      console.log('[SchoolsManagement] Fetching schools from API...');
      
      const response = await apiService.getSchools();
      console.log('[SchoolsManagement] Raw API response:', response);
      
      // Handle direct array response from API
      const schoolsArray = Array.isArray(response) ? response : 
        (response as any)?.schools || (response as any)?.data || [];
      console.log('[SchoolsManagement] Schools array:', schoolsArray);
      
      if (schoolsArray.length === 0) {
        console.warn('[SchoolsManagement] No schools found in API response');
        toast.info('No schools found');
      }
      
      // Transform the data from snake_case to camelCase
      const transformedSchools = transformSchools(schoolsArray);
      console.log('[SchoolsManagement] Transformed schools:', transformedSchools.slice(0, 2));
      // Save full list for stats and client-side filtering
      setAllSchools(transformedSchools);
      
      // Apply filters (case-insensitive)
      const filteredSchools = transformedSchools.filter((school) => {
        const term = searchTerm?.toLowerCase?.() || '';
        const matchesSearch = !term ||
          school.schoolName?.toLowerCase?.().includes(term) ||
          school.stateName?.toLowerCase?.().includes(term) ||
          school.districtName?.toLowerCase?.().includes(term);
        const matchesStatus = statusFilter === 'all' || (school.status?.toLowerCase?.() === statusFilter.toLowerCase());
        const matchesType = typeFilter === 'all' || (school.schoolType?.toLowerCase?.() === typeFilter.toLowerCase());
        return matchesSearch && matchesStatus && matchesType;
      });
      setSchools(filteredSchools);
      setTotalPages(Math.ceil(filteredSchools.length / itemsPerPage));
      
    } catch (error) {
      console.error('[SchoolsManagement] Error fetching schools:', error);
      toast.error('Failed to fetch schools from API. Please check your connection.');
      setSchools([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSchool = async (schoolId: number) => {
    if (!permissions.canApproveSchools()) {
      toast.error('You do not have permission to approve schools');
      return;
    }
    
    try {
      await apiService.approveSchool(schoolId);
      toast.success('School approved successfully');
      fetchSchools(); // Refresh the list
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
    setModalMode('create');
    setEditingSchool(null);
    setIsModalOpen(true);
  };

  const handleEditSchool = (school: School) => {
    if (!permissions.canEditSchools()) {
      toast.error('You do not have permission to edit schools');
      return;
    }
    
    setModalMode('edit');
    setEditingSchool(school);
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
      fetchSchools(); // Refresh the list
    } catch (error) {
      console.error('Error deleting school:', error);
      toast.error('Failed to delete school');
    }
  };

  const handleModalSuccess = () => {
    fetchSchools(); // Refresh the list
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'pending':
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
      case 'inactive':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
  };

  // Pagination logic
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSchools = schools.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            <p className="mt-2 text-muted-foreground">Loading schools...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Schools Management</h1>
          <p className="text-muted-foreground">Manage and approve schools in the system</p>
        </div>
        
        {permissions.canCreateSchools() && (
          <Button onClick={handleCreateSchool} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add School
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <SchoolIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Schools</p>
                <p className="text-2xl font-bold">{allSchools.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Schools</p>
                <p className="text-2xl font-bold">
                  {allSchools.filter(s => (s.status?.toLowerCase() === 'approved' || s.status?.toLowerCase() === 'active')).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold">
                  {allSchools.filter(s => s.status?.toLowerCase() === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search schools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="government">Government</SelectItem>
            <SelectItem value="private">Private</SelectItem>
            <SelectItem value="aided">Aided</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={fetchSchools} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Schools Grid */}
      {currentSchools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {currentSchools.map((school) => (
            <Card key={`${school.id ?? school.institutionId ?? school.udiseCode ?? school.schoolName}`} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">
                      {school.schoolName}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{school.districtName}, {school.stateName}</span>
                    </div>
                  </div>
                  {getStatusBadge(school.status)}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-2 mb-4">
                  {school.udiseCode && (
                    <p className="text-sm"><span className="font-medium">UDISE:</span> {school.udiseCode}</p>
                  )}
                  {school.schoolType && (
                    <p className="text-sm"><span className="font-medium">Type:</span> {school.schoolType}</p>
                  )}
                  {school.management && (
                    <p className="text-sm"><span className="font-medium">Management:</span> {school.management}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {school.userCount || 0} users
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {permissions.canApproveSchools() && school.status?.toLowerCase() === 'pending' && typeof school.id === 'number' && (
                    <Button
                      size="sm"
                      onClick={() => handleApproveSchool(school.id)}
                      className="flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Approve
                    </Button>
                  )}
                  
                  {permissions.canApproveSchools() && typeof school.id === 'number' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleValidateSchool(school.id)}
                      className="flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      Validate
                    </Button>
                  )}
                  
                  {permissions.canEditSchools() && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditSchool(school)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </Button>
                  )}
                  
                  {permissions.canDeleteSchools() && typeof school.id === 'number' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete School</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{school.schoolName}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteSchool(school.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <SchoolIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Schools Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                  ? 'No schools match your current filters.' 
                  : 'No schools have been added yet.'}
              </p>
              {permissions.canCreateSchools() && (
                <Button onClick={handleCreateSchool} className="mt-4">
                  Add First School
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, schools.length)} of {schools.length} schools
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      
      <SchoolFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        school={editingSchool}
        mode={modalMode}
      />
    </div>
  );
};

export default SchoolsManagement;