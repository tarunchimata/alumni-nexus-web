import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { apiService } from '@/services/apiService';
import { Search, School, Users, Calendar, MoreVertical, Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SchoolFormModal } from '@/components/schools/SchoolFormModal';
import { School as ApiSchool } from '@/lib/apiTransforms';

interface School {
  id: string;
  name: string;
  schoolName: string;
  udiseCode: string;
  districtName: string;
  stateName: string;
  schoolType: string;
  management: string;
  status: string;
  userCount: number;
  classCount: number;
  createdAt: string;
  updatedAt: string;
  blockName?: string;
  institutionId?: string;
}

const SchoolsPage = () => {
  const [schools, setSchools] = useState<ApiSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<ApiSchool | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[SchoolsPage] Fetching schools from external API...');
      const schoolsResponse = await apiService.getSchools();
      const schoolsArray = (schoolsResponse as any).schools || (Array.isArray(schoolsResponse) ? schoolsResponse : []);
      console.log('[SchoolsPage] Received schools:', schoolsArray?.length || 0);
      console.log('[SchoolsPage] Sample school data:', schoolsArray?.[0]);
      setSchools(schoolsArray);
      
    } catch (error: any) {
      console.error('[SchoolsPage] Failed to fetch schools:', error);
      const errorMessage = error?.message || 'Failed to load schools. Please try again.';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchool = () => {
    setSelectedSchool(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditSchool = (school: ApiSchool) => {
    setSelectedSchool(school);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteSchool = async (schoolId: string, schoolName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${schoolName}"? This action cannot be undone.`)) {
      return;
    }

    setDeleteLoading(schoolId);
    try {
      await apiService.deleteSchool(schoolId);
      toast({
        title: "Success",
        description: "School deleted successfully"
      });
      // Refresh the schools list
      await fetchSchools();
    } catch (error) {
      console.error('Delete school error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to delete school',
        variant: "destructive"
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleModalSuccess = async () => {
    // Refresh the schools list
    await fetchSchools();
  };

  const filteredSchools = schools.filter(school =>
    school.schoolName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.udiseCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.districtName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading schools...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Schools Management</h1>
        <p className="text-gray-600">Manage and monitor all schools in the platform</p>
      </div>

      {/* Search and Controls */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search schools by name, UDISE code, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleCreateSchool} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add School
            </Button>
            <Button onClick={fetchSchools} variant="outline">
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schools.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Schools</CardTitle>
            <School className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schools.filter(s => s.status === 'active').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schools.reduce((sum, s) => sum + (s.userCount || 0), 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Schools List */}
      {error ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchSchools} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Schools ({filteredSchools.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredSchools.length === 0 ? (
                <div className="text-center py-8">
                  <School className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? 'No schools match your search criteria' : 'No schools found'}
                  </p>
                </div>
              ) : (
                filteredSchools.map((school) => (
                  <div key={school.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-lg">
                            {school.schoolName}
                          </h3>
                          <Badge variant={school.status === 'active' ? 'default' : 'secondary'}>
                            {school.status}
                          </Badge>
                          {school.schoolType && (
                            <Badge variant="outline">{school.schoolType}</Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">UDISE:</span> {school.udiseCode || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">District:</span> {school.districtName}
                          </div>
                          <div>
                            <span className="font-medium">State:</span> {school.stateName}
                          </div>
                          <div>
                            <span className="font-medium">Management:</span> {school.management || 'N/A'}
                          </div>
                        </div>

                        <div className="flex items-center space-x-6 mt-3 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{school.userCount || 0} users</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>Created {new Date(school.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditSchool(school)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteSchool(String(school.id), school.schoolName)}
                            disabled={deleteLoading === String(school.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {deleteLoading === String(school.id) ? 'Deleting...' : 'Delete'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* School Management Modal */}
      <SchoolFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        school={selectedSchool}
        mode={modalMode}
      />
    </div>
  );
};

export default SchoolsPage;