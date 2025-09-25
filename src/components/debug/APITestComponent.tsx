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
import { Trash2, Plus, Edit, RefreshCw } from 'lucide-react';
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
          <h1 className="text-2xl font-bold">API Integration Test</h1>
          <p className="text-muted-foreground">Test MySchoolBuddies API integration and manage schools</p>
        </div>
        <Button onClick={handleCreateSchool} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add School
        </Button>
      </div>

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
                {health.services && (
                  <div>
                    <strong>Services:</strong>
                    <ul className="ml-4 mt-1">
                      {Object.entries(health.services).map(([service, status]) => (
                        <li key={service} className="flex justify-between">
                          <span>{service}:</span>
                          <Badge variant={status === 'ok' ? 'default' : 'destructive'} className="text-xs">
                            {status}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search Test Section */}
        <Card>
          <CardHeader>
            <CardTitle>School Search Test</CardTitle>
            <CardDescription>
              Test enhanced search functionality
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
              <Button type="submit" disabled={searchLoading}>
                {searchLoading ? 'Searching...' : 'Search'}
              </Button>
            </form>

            {searchError && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                Error: {searchError}
              </div>
            )}

            {hasResults && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    Found {totalResults} schools
                  </span>
                  <Badge variant="outline">
                    Showing {results.length}
                  </Badge>
                </div>
                
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {results.slice(0, 10).map((school, index) => (
                    <div key={school.id || index} className="p-3 border rounded-md text-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium">{school.name}</div>
                          <div className="text-muted-foreground text-xs">
                            {school.stateName}, {school.districtName}
                            {school.udiseCode && ` • UDISE: ${school.udiseCode}`}
                          </div>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {school.status}
                            </Badge>
                            {school.schoolType && (
                              <Badge variant="secondary" className="text-xs">
                                {school.schoolType}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditSchool(school)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteSchool(school.id, school.name)}
                            disabled={deleteLoading === school.id}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
                  {results.length > 10 && (
                    <div className="text-center text-sm text-muted-foreground py-2">
                      ... and {results.length - 10} more schools
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
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