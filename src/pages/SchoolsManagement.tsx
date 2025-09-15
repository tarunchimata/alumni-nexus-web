import { useState, useEffect } from 'react';
import { apiService } from '@/services/apiService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { School, MapPin, Users, CheckCircle, Clock, AlertTriangle, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { transformSchools, type School as TransformedSchool, type ApiSchool } from '@/lib/apiTransforms';

interface ValidationResult {
  issues: Array<{
    type: string;
    message: string;
    field?: string;
  }>;
}

interface School {
  id: number;
  name?: string;
  schoolName: string;
  stateName: string;
  districtName: string;
  blockName?: string | null;
  udiseCode?: string | null;
  institutionId: string;
  status: string;
  schoolType?: string | null;
  management?: string | null;
  userCount?: number;
  classCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface SchoolsResponse {
  schools: School[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const SchoolsManagement = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<SchoolsResponse['pagination']>();
  const [usingFallback, setUsingFallback] = useState(false);
  const { toast } = useToast();

  // Dev fallback sample schools (used when API is unavailable in preview)
  const sampleSchools: School[] = [
    { id: 1, name: 'Delhi Public School Vasant Kunj', schoolName: 'Delhi Public School Vasant Kunj', stateName: 'Delhi', districtName: 'New Delhi', status: 'active', schoolType: 'Private', management: 'Private Unaided', userCount: 215, classCount: 24, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), institutionId: 'INC-IN-DL-001' },
    { id: 2, name: 'Government Higher Secondary School Bandra', schoolName: 'Government Higher Secondary School Bandra', stateName: 'Maharashtra', districtName: 'Mumbai', status: 'active', schoolType: 'Government', management: 'State Government', userCount: 180, classCount: 18, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), institutionId: 'INC-IN-MH-002' },
    { id: 3, name: "St. Josephs Boys High School", schoolName: "St. Josephs Boys High School", stateName: 'Karnataka', districtName: 'Bangalore', status: 'active', schoolType: 'Private', management: 'Private Aided', userCount: 200, classCount: 20, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), institutionId: 'INC-IN-KA-003' },
  ];

  useEffect(() => {
    fetchSchools();
  }, [page, searchQuery, statusFilter, typeFilter]);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
      });

      console.log('[SchoolsManagement] Fetching from external API:', `${import.meta.env.VITE_API_URL}/schools?${params}`);
      
      try {
        // Fetch from external API - expects direct array response (snake_case)
        const apiResponse = await apiService.get<ApiSchool[]>(`/schools?${params}`);
        
        if (Array.isArray(apiResponse)) {
          console.log('[SchoolsManagement] API Response (direct array):', apiResponse.slice(0, 2));
          
          // Transform snake_case API response to camelCase frontend format
          const transformedSchools = transformSchools(apiResponse);
          
          setSchools(transformedSchools);
          setPagination({ 
            page: page, 
            limit: 10, 
            total: transformedSchools.length, 
            totalPages: Math.ceil(transformedSchools.length / 10) 
          });
          setUsingFallback(false);
          
          console.log('[SchoolsManagement] Successfully loaded', transformedSchools.length, 'schools from external API');
        } else {
          throw new Error('Expected array response from external API');
        }
      } catch (apiError) {
        console.warn('[SchoolsManagement] External API failed, using fallback data:', apiError);
        
        if (import.meta.env.DEV) {
          setSchools(sampleSchools);
          setPagination({ page: 1, limit: 10, total: sampleSchools.length, totalPages: 1 });
          setUsingFallback(true);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to load schools from API',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('[SchoolsManagement] Critical error:', error);
      toast({
        title: 'Error', 
        description: 'Failed to load schools',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSchool = async (schoolId: number) => {
    try {
      await apiService.approveSchool(schoolId.toString());
      toast({
        title: 'Success',
        description: 'School approved successfully',
      });
      fetchSchools();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve school',
        variant: 'destructive',
      });
    }
  };

  const handleValidateSchool = async (schoolId: number) => {
    try {
      const result = await apiService.validateSchool(schoolId.toString()) as ValidationResult;
      
      if (result.issues.length === 0) {
        toast({
          title: 'Validation Success',
          description: 'No issues found with this school',
        });
      } else {
        toast({
          title: 'Validation Issues Found',
          description: `${result.issues.length} issues detected`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to validate school',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'active':
        return <Badge className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
      case 'inactive':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Inactive</Badge>;
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
  };

  if (loading && schools.length === 0) {
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Schools Management</h2>
          <p className="text-muted-foreground">Manage and approve schools in the system</p>
        </div>
        {usingFallback && (
          <Badge variant="secondary">Demo data (API offline)</Badge>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search schools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="government">Government</SelectItem>
            <SelectItem value="private">Private</SelectItem>
            <SelectItem value="aided">Aided</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={fetchSchools} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Schools List */}
      <div className="space-y-4">
        {schools.map((school) => (
          <Card key={school.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <School className="h-5 w-5" />
                    {school.schoolName || school.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {school.districtName}, {school.stateName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {school.userCount || 0} users
                      {school.classCount && `, ${school.classCount} classes`}
                    </span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(school.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Added on {new Date(school.createdAt).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  {school.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleValidateSchool(school.id)}
                      >
                        Validate
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApproveSchool(school.id)}
                      >
                        Approve
                      </Button>
                    </>
                  )}
                  {school.status === 'approved' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleValidateSchool(school.id)}
                    >
                      Re-validate
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} schools
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {schools.length === 0 && !loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <School className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Schools Found</h3>
              <p className="text-muted-foreground">No schools match your current filters.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SchoolsManagement;