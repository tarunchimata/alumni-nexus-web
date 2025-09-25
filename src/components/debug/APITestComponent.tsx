/**
 * API Test Component
 * For testing and debugging the enhanced API integration
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Plus, Edit, RefreshCw, Search } from 'lucide-react';
import { useSchoolSearch } from '@/hooks/useSchoolSearch';
import { useHealthCheck } from '@/hooks/useHealthCheck';
import { SchoolFormModal } from '@/components/schools/SchoolFormModal';
import { apiService } from '@/services/apiService';
import { toast } from 'sonner';

export const APITestComponent: React.FC = () => {
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

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Schools Management Test</h1>
          <p className="text-muted-foreground">Complete school directory with CRUD operations - Create, Read, Update, Delete schools</p>
        </div>
        <Button onClick={handleCreateSchool} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add School
        </Button>
      </div>

      {/* School List Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            School Directory
            <div className="flex gap-2">
              <Button 
                onClick={() => fetchAll(25)}
                variant="outline"
                size="sm"
              >
                Load All Schools
              </Button>
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
            Browse and manage all schools in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasResults && !searchLoading && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No schools loaded yet</p>
              <Button onClick={() => fetchAll(25)} variant="outline">
                Load Schools
              </Button>
            </div>
          )}
          
          {searchLoading && (
            <div className="text-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Loading schools...</p>
            </div>
          )}

          {searchError && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm">
              <strong>Error loading schools:</strong> {searchError}
            </div>
          )}

          {hasResults && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  Total: {totalResults} schools
                </span>
                <Badge variant="outline">
                  Showing {results.length} schools
                </Badge>
              </div>
              
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {results.map((school, index) => (
                  <div key={school.id || index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-base">{school.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {school.stateName}, {school.districtName}
                          {school.blockName && ` • ${school.blockName}`}
                        </p>
                        {school.udiseCode && (
                          <p className="text-xs text-muted-foreground mt-1">
                            UDISE: {school.udiseCode}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {school.status}
                          </Badge>
                          {school.schoolType && (
                            <Badge variant="secondary" className="text-xs">
                              {school.schoolType}
                            </Badge>
                          )}
                          {school.management && (
                            <Badge variant="outline" className="text-xs">
                              {school.management}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 ml-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditSchool(school)}
                          className="h-8 w-8 p-0"
                          title="Edit school"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteSchool(school.id, school.name)}
                          disabled={deleteLoading === school.id}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          title="Delete school"
                        >
                          {deleteLoading === school.id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Quick Actions Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Health Check Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Health Check
              {health && (
                <Badge variant={isHealthy ? 'default' : 'destructive'}>
                  {health.status}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Test API connectivity and system health
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={checkHealth} 
              disabled={healthLoading}
              className="w-full"
            >
              {healthLoading ? 'Checking...' : 'Check Health'}
            </Button>
            
            {health && (
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Status:</strong> {health.status}
                </div>
                <div>
                  <strong>Timestamp:</strong> {new Date(health.timestamp).toLocaleString()}
                </div>
                {health.message && (
                  <div>
                    <strong>Message:</strong> {health.message}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Search</CardTitle>
            <CardDescription>
              Search and filter schools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Search schools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={searchLoading} size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </form>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => fetchAll(25)}
                variant="outline"
                size="sm"
                disabled={searchLoading}
              >
                Load All
              </Button>
              <Button 
                onClick={() => fetchByFilters({ state: 'Uttarakhand', limit: '25' })}
                variant="outline"
                size="sm"
                disabled={searchLoading}
              >
                Uttarakhand
              </Button>
            </div>

            {searchError && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                Error: {searchError}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>

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