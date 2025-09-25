/**
 * API Test Lab with Comprehensive School Management
 * Complete school directory with CRUD operations and API testing
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Plus, Edit, RefreshCw, Search, Activity, Database } from 'lucide-react';
import { useSchoolSearch } from '@/hooks/useSchoolSearch';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { SchoolFormModal } from '@/components/schools/SchoolFormModal';
import { apiService } from '@/services/apiService';
import { toast } from 'sonner';

export default function APITestLab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<any>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const { health, loading: healthLoading, checkHealth, isHealthy } = useHealthCheck({ 
    autoStart: false,
    onHealthChange: (status) => {
      if (status.status === 'error') {
        toast.error('Health check failed: ' + status.message);
      } else {
        toast.success('System is healthy');
      }
    }
  });

  const {
    results,
    loading: searchLoading,
    error: searchError,
    search,
    fetchAll,
    fetchByFilters,
    totalResults,
    hasResults
  } = useSchoolSearch();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      search(searchTerm);
    }
  };

  const handleCreateSchool = () => {
    setSelectedSchool(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditSchool = (school: any) => {
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
      toast.success('School deleted successfully');
      // Refresh search results
      if (searchTerm.trim()) {
        search(searchTerm);
      }
    } catch (error) {
      console.error('Delete school error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete school');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleModalSuccess = () => {
    // Refresh search results
    if (searchTerm.trim()) {
      search(searchTerm);
    }
  };

  const loadAllSchools = () => {
    fetchAll(25);
  };

  const loadSampleData = () => {
    fetchByFilters({ state: 'Uttarakhand', limit: '25' });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Schools Management & API Test Lab</h1>
          <p className="text-muted-foreground mt-2">
            Complete school directory with CRUD operations - Create, Read, Update, Delete schools
          </p>
        </div>
        <Button onClick={handleCreateSchool} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New School
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="schools" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="schools" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            School Directory
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            System Health
          </TabsTrigger>
        </TabsList>

        {/* Schools Management Tab */}
        <TabsContent value="schools" className="space-y-6">
          
          {/* Search and Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Quick Actions</CardTitle>
              <CardDescription>
                Find schools and perform bulk operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  placeholder="Search schools by name, state, district..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={searchLoading}>
                  {searchLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </form>
              
              <div className="flex gap-2 flex-wrap">
                <Button 
                  onClick={loadAllSchools}
                  variant="outline"
                  size="sm"
                  disabled={searchLoading}
                >
                  Load All Schools
                </Button>
                <Button 
                  onClick={loadSampleData}
                  variant="outline"
                  size="sm"
                  disabled={searchLoading}
                >
                  Sample: Uttarakhand
                </Button>
                <Button 
                  onClick={() => fetchByFilters({ school_type: 'Primary', limit: '25' })}
                  variant="outline"
                  size="sm"
                  disabled={searchLoading}
                >
                  Primary Schools
                </Button>
                <Button 
                  onClick={() => fetchByFilters({ school_type: 'Secondary', limit: '25' })}
                  variant="outline"
                  size="sm"
                  disabled={searchLoading}
                >
                  Secondary Schools
                </Button>
              </div>

              {searchError && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-md">
                  <strong>Error:</strong> {searchError}
                </div>
              )}
            </CardContent>
          </Card>

          {/* School List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                School Directory
                <div className="flex items-center gap-2">
                  {hasResults && (
                    <Badge variant="outline">
                      {totalResults} total schools
                    </Badge>
                  )}
                  <Button 
                    onClick={() => window.location.reload()}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Browse, edit, and manage all schools in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!hasResults && !searchLoading && (
                <div className="text-center py-12">
                  <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No schools loaded</h3>
                  <p className="text-muted-foreground mb-4">
                    Click "Load All Schools" to see the complete directory or search for specific schools.
                  </p>
                  <Button onClick={loadAllSchools} variant="outline">
                    Load All Schools
                  </Button>
                </div>
              )}
              
              {searchLoading && (
                <div className="text-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Loading schools from API...</p>
                </div>
              )}

              {hasResults && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">
                      Showing {results.length} of {totalResults} schools
                    </span>
                    <Badge variant="secondary">
                      API Connected
                    </Badge>
                  </div>
                  
                  <div className="grid gap-4 max-h-96 overflow-y-auto">
                    {results.map((school, index) => (
                      <div key={school.id || index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{school.name}</h3>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>📍 {school.stateName}, {school.districtName}
                                {school.blockName && ` • ${school.blockName}`}
                              </p>
                              {school.udiseCode && (
                                <p>🏫 UDISE Code: {school.udiseCode}</p>
                              )}
                              {school.institutionId && (
                                <p>🆔 Institution ID: {school.institutionId}</p>
                              )}
                            </div>
                            <div className="flex gap-2 mt-3 flex-wrap">
                              <Badge 
                                variant={school.status === 'active' ? 'default' : 'secondary'} 
                                className="text-xs"
                              >
                                {school.status}
                              </Badge>
                              {school.schoolType && (
                                <Badge variant="outline" className="text-xs">
                                  {school.schoolType}
                                </Badge>
                              )}
                              {school.management && (
                                <Badge variant="secondary" className="text-xs">
                                  {school.management}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditSchool(school)}
                              className="h-9 w-9 p-0"
                              title="Edit school details"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteSchool(school.id, school.name)}
                              disabled={deleteLoading === school.id}
                              className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Delete school"
                            >
                              {deleteLoading === school.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Check Tab */}
        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                API Health Monitor
                {health && (
                  <Badge variant={isHealthy ? 'default' : 'destructive'}>
                    {health.status}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Monitor API connectivity and system health
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={checkHealth} 
                disabled={healthLoading}
                className="w-full"
              >
                {healthLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Checking System Health...
                  </>
                ) : (
                  <>
                    <Activity className="h-4 w-4 mr-2" />
                    Run Health Check
                  </>
                )}
              </Button>
              
              {health && (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">System Status</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={isHealthy ? 'default' : 'destructive'} className="ml-2">
                          {health.status}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Timestamp:</span>
                        <span className="ml-2">{new Date(health.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    {health.message && (
                      <div className="mt-2">
                        <span className="text-muted-foreground">Message:</span>
                        <span className="ml-2">{health.message}</span>
                      </div>
                    )}
                  </div>
                  
                  {health.services && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Service Health</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {Object.entries(health.services).map(([service, status]) => (
                          <div key={service} className="flex justify-between items-center">
                            <span className="text-sm">{service}</span>
                            <Badge 
                              variant={status === 'ok' ? 'default' : 'destructive'} 
                              className="text-xs"
                            >
                              {status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
}