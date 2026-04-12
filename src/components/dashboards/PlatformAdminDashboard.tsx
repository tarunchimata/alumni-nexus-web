import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, School, Settings, TrendingUp, Shield, AlertTriangle, 
  CheckCircle, Clock, UserPlus, RefreshCw, XCircle, Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useDashboardData } from "@/hooks/useDashboardData";

interface SchoolRecord {
  id: string;
  institution_name: string;
  city: string | null;
  state: string | null;
  district: string | null;
  status: string | null;
  institution_type: string | null;
  management_type: string | null;
  created_at: string;
}

interface SchoolRequest {
  id: string;
  institution_name: string;
  city: string | null;
  state: string | null;
  status: string | null;
  contact_info: string | null;
  requested_by: string | null;
  created_at: string;
}

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3033/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

const PlatformAdminDashboard = () => {
  const [schools, setSchools] = useState<SchoolRecord[]>([]);
  const [schoolRequests, setSchoolRequests] = useState<SchoolRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { stats } = useDashboardData();

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch schools from backend API
      const schoolsResponse = await fetch(`${API_BASE_URL}/schools`, {
        headers: getAuthHeaders()
      });

      if (schoolsResponse.ok) {
        const schoolsData = await schoolsResponse.json();
        if (schoolsData.success) {
          setSchools(schoolsData.data || []);
        }
      }

      // Fetch school requests from backend API
      const requestsResponse = await fetch(`${API_BASE_URL}/schools/requests`, {
        headers: getAuthHeaders()
      });

      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        if (requestsData.success) {
          setSchoolRequests(requestsData.data || []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApproveRequest = async (request: SchoolRequest) => {
    try {
      // Approve school request via backend API
      const response = await fetch(`${API_BASE_URL}/schools/requests/${request.id}/approve`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        toast.success(`${request.institution_name} approved and added to schools`);
        fetchData();
      } else {
        throw new Error('Failed to approve request');
      }
    } catch (err) {
      console.error('Approve failed:', err);
      toast.error('Failed to approve school request');
    }
  };

  const handleRejectRequest = async (request: SchoolRequest) => {
    try {
      // Reject school request via backend API
      const response = await fetch(`${API_BASE_URL}/schools/requests/${request.id}/reject`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        toast.success(`${request.institution_name} rejected`);
        fetchData();
      } else {
        throw new Error('Failed to reject request');
      }
    } catch (err) {
      console.error('Reject failed:', err);
      toast.error('Failed to reject request');
    }
  };

  const pendingRequests = schoolRequests.filter(r => r.status === 'pending');
  const activeSchools = schools.filter(s => s.status === 'active');
  const filteredSchools = searchQuery
    ? schools.filter(s => s.institution_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.state?.toLowerCase().includes(searchQuery.toLowerCase()))
    : schools.slice(0, 20);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Platform Administration</h2>
          <p className="text-muted-foreground">Manage schools, users, and platform settings</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSchools}</div>
            <p className="text-xs text-muted-foreground">{activeSchools.length} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Across all schools</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">{pendingRequests.length > 0 ? 'Action required' : 'All caught up'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeConnections}</div>
            <p className="text-xs text-muted-foreground">Platform activity</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Pending School Requests
            </CardTitle>
            <CardDescription>
              Review and approve or reject school registration requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold">{request.institution_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {request.city}, {request.state}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Requested by: {request.requested_by || 'Unknown'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApproveRequest(request)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleRejectRequest(request)}
                      size="sm"
                      variant="destructive"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schools List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Registered Schools</span>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search schools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </CardTitle>
          <CardDescription>
            Manage and monitor all registered schools on platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredSchools.length > 0 ? (
              filteredSchools.map((school) => (
                <div key={school.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold">{school.institution_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {school.city}, {school.state} • {school.district}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={school.status === 'active' ? 'default' : 'secondary'}>
                        {school.status}
                      </Badge>
                      {school.institution_type && (
                        <Badge variant="outline">{school.institution_type}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toast.info(`Manage ${school.institution_name} - Feature coming soon`)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Manage
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <School className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No schools match your search' : 'No schools found'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformAdminDashboard;
