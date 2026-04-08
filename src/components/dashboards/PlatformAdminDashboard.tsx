import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, School, Settings, TrendingUp, Shield, AlertTriangle, 
  CheckCircle, Clock, UserPlus, RefreshCw, XCircle, Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

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

const PlatformAdminDashboard = () => {
  const [schools, setSchools] = useState<SchoolRecord[]>([]);
  const [schoolRequests, setSchoolRequests] = useState<SchoolRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [schoolsRes, requestsRes] = await Promise.all([
        supabase.from('schools').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('school_requests').select('*').order('created_at', { ascending: false }),
      ]);

      if (schoolsRes.data) setSchools(schoolsRes.data);
      if (requestsRes.data) setSchoolRequests(requestsRes.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApproveRequest = async (request: SchoolRequest) => {
    try {
      // Add the school to the schools table
      const { error: insertError } = await supabase.from('schools').insert({
        institution_name: request.institution_name,
        city: request.city,
        state: request.state,
        status: 'active',
      });
      if (insertError) throw insertError;

      // Update request status
      const { error: updateError } = await supabase
        .from('school_requests')
        .update({ status: 'approved' })
        .eq('id', request.id);
      if (updateError) throw updateError;

      toast.success(`${request.institution_name} approved and added to schools`);
      fetchData();
    } catch (err) {
      console.error('Approve failed:', err);
      toast.error('Failed to approve school request');
    }
  };

  const handleRejectRequest = async (request: SchoolRequest) => {
    try {
      const { error } = await supabase
        .from('school_requests')
        .update({ status: 'rejected' })
        .eq('id', request.id);
      if (error) throw error;

      toast.success(`${request.institution_name} rejected`);
      fetchData();
    } catch (err) {
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
            <div className="text-2xl font-bold">{schools.length}</div>
            <p className="text-xs text-muted-foreground">{activeSchools.length} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              {pendingRequests.length > 0 ? 'Action required' : 'All caught up'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-muted-foreground">All systems operational</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schoolRequests.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Pending School Requests ({pendingRequests.length})
            </CardTitle>
            <CardDescription>Review and approve new school registrations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                <div className="flex-1">
                  <p className="font-medium text-foreground">{request.institution_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {[request.city, request.state].filter(Boolean).join(', ') || 'Location not specified'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Requested: {new Date(request.created_at).toLocaleDateString()}
                    {request.requested_by && ` by ${request.requested_by}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button size="sm" onClick={() => handleApproveRequest(request)}>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleRejectRequest(request)}>
                    <XCircle className="w-3 h-3 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/dashboard/schools" className="block">
              <Button className="w-full justify-start" variant="outline">
                <School className="w-4 h-4 mr-2" />
                Manage Schools
                <Badge variant="secondary" className="ml-auto">{schools.length}</Badge>
              </Button>
            </Link>
            <Link to="/dashboard/people" className="block">
              <Button className="w-full justify-start" variant="outline">
                <Users className="w-4 h-4 mr-2" />
                People Directory
              </Button>
            </Link>
            <Link to="/dashboard/admin/csv-upload" className="block">
              <Button className="w-full justify-start" variant="outline">
                <UserPlus className="w-4 h-4 mr-2" />
                Bulk Import
              </Button>
            </Link>
            <Link to="/dashboard/analytics" className="block">
              <Button className="w-full justify-start" variant="outline">
                <TrendingUp className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </Link>
            <Link to="/dashboard/settings" className="block">
              <Button className="w-full justify-start" variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Platform Settings
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Schools List */}
        <Card>
          <CardHeader>
            <CardTitle>Schools Directory</CardTitle>
            <CardDescription>{schools.length} schools registered</CardDescription>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search schools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filteredSchools.map((school) => (
                <div key={school.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{school.institution_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[school.city, school.state].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  <Badge variant={school.status === 'active' ? 'default' : 'secondary'} className="text-xs ml-2">
                    {school.status || 'active'}
                  </Badge>
                </div>
              ))}
              {filteredSchools.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {searchQuery ? 'No schools match your search' : 'No schools found'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlatformAdminDashboard;
