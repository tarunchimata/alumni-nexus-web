import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, GraduationCap, BookOpen, UserPlus, Settings, BarChart3, 
  Calendar, CheckCircle, Clock, AlertCircle, RefreshCw, School
} from "lucide-react";
import { toast } from "sonner";

interface SchoolRequest {
  id: string;
  institution_name: string;
  city: string | null;
  state: string | null;
  status: string | null;
  requested_by: string | null;
  created_at: string;
}

const SchoolAdminDashboard = () => {
  const [totalSchools, setTotalSchools] = useState(0);
  const [pendingRequests, setPendingRequests] = useState<SchoolRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [schoolsRes, requestsRes] = await Promise.all([
        supabase.from('schools').select('id', { count: 'exact', head: true }),
        supabase.from('school_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      ]);

      setTotalSchools(schoolsRes.count || 0);
      if (requestsRes.data) setPendingRequests(requestsRes.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApprove = async (request: SchoolRequest) => {
    try {
      await supabase.from('schools').insert({
        institution_name: request.institution_name,
        city: request.city,
        state: request.state,
        status: 'active',
      });
      await supabase.from('school_requests').update({ status: 'approved' }).eq('id', request.id);
      toast.success(`${request.institution_name} approved`);
      fetchData();
    } catch {
      toast.error('Failed to approve');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">School Administration</h2>
          <p className="text-muted-foreground">Manage your school's community and data</p>
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
            <CardTitle className="text-sm font-medium">Schools</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSchools}</div>
            <p className="text-xs text-muted-foreground">Registered schools</p>
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
              {pendingRequests.length > 0 ? 'Require approval' : 'All caught up'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Community</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">Members in your school</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">Upcoming events</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Pending Approvals ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">{request.institution_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[request.city, request.state].filter(Boolean).join(', ')}
                    {' · '}{new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button size="sm" onClick={() => handleApprove(request)}>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Approve
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>School Management</CardTitle>
            <CardDescription>Administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/dashboard/people" className="block">
              <Button className="w-full justify-start" variant="outline">
                <Users className="w-4 h-4 mr-2" />
                People Directory
              </Button>
            </Link>
            <Link to="/dashboard/admin/csv-upload" className="block">
              <Button className="w-full justify-start" variant="outline">
                <UserPlus className="w-4 h-4 mr-2" />
                Bulk Import Users
              </Button>
            </Link>
            <Link to="/dashboard/events" className="block">
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                Manage Events
              </Button>
            </Link>
            <Link to="/dashboard/school-analytics" className="block">
              <Button className="w-full justify-start" variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                School Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your school</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground text-center py-8">
              Activity feed will appear here as users interact with the platform.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SchoolAdminDashboard;
