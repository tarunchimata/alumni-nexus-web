import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiService } from '@/services/apiService';
import { 
  School, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  AlertCircle, 
  MapPin,
  Building
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { cn } from '@/lib/utils';

interface SchoolsAnalyticsProps {
  stats?: {
    total: number;
    active: number;
    pending: number;
    rejected: number;
    byState: Record<string, number>;
    byManagement: Record<string, number>;
  };
  loading?: boolean;
}

const COLORS = {
  approved: 'hsl(142, 71%, 45%)',    // Green for active/approved
  active: 'hsl(142, 71%, 45%)',      // Green for active/approved  
  pending: 'hsl(25, 95%, 53%)',      // Orange for pending
  rejected: 'hsl(0, 84%, 60%)',      // Red for rejected
  government: 'hsl(217, 91%, 60%)',  // Blue for government
  private: 'hsl(330, 81%, 60%)',     // Pink for private
  aided: 'hsl(262, 83%, 58%)',       // Purple for aided
  international: 'hsl(160, 71%, 55%)', // Teal for international
  unknown: 'hsl(215, 16%, 47%)',     // Muted for unknown
};

export const SchoolsAnalytics: React.FC<SchoolsAnalyticsProps> = ({ stats: propStats, loading: propLoading }) => {
  // Fetch fresh comprehensive stats data
  const { data: apiStats, isLoading: queryLoading } = useQuery({
    queryKey: ['schools-comprehensive-stats'],
    queryFn: async () => {
      try {
        const response = await apiService.getComprehensiveStats();
        console.log('[SchoolsAnalytics] Comprehensive stats from API:', response);
        
        // Transform API response to match expected format
        return {
          total: response?.totalSchools || 0,
          active: response?.statusBreakdown?.active || response?.statusBreakdown?.approved || 0,
          pending: response?.statusBreakdown?.pending || 0,
          rejected: response?.statusBreakdown?.rejected || response?.statusBreakdown?.inactive || 0,
          byState: response?.topStates || {},
          byManagement: response?.managementBreakdown || {},
        };
      } catch (error) {
        console.error('[SchoolsAnalytics] Error fetching comprehensive stats:', error);
        return {
          total: 0,
          active: 0,
          pending: 0,
          rejected: 0,
          byState: {},
          byManagement: {},
        };
      }
    },
  });

  // Use API stats if available, otherwise fall back to props
  const stats = apiStats || propStats || {
    total: 0,
    active: 0,
    pending: 0,
    rejected: 0,
    byState: {},
    byManagement: {},
  };
  
  const loading = queryLoading || propLoading;

  const statusData = [
    { name: 'Active', value: stats.active, color: COLORS.active },
    { name: 'Pending', value: stats.pending, color: COLORS.pending },
    { name: 'Rejected', value: stats.rejected, color: COLORS.rejected },
  ].filter(item => item.value > 0);

  const managementData = Object.entries(stats.byManagement)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: Number(value) || 0,
      color: COLORS[name as keyof typeof COLORS] || COLORS.government
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const topStates = Object.entries(stats.byState)
    .map(([state, count]) => ({ state, count: Number(count) || 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const activePercentage = stats.total > 0 ? ((stats.active / stats.total) * 100) : 0;
  const pendingPercentage = stats.total > 0 ? ((stats.pending / stats.total) * 100) : 0;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-8 bg-muted rounded w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-full -translate-y-16 translate-x-16" />
          <CardContent className="p-6 relative">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <School className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Schools</p>
                <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
                {stats.total > 1000000 && (
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-600 font-medium">1M+ milestone</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-full -translate-y-16 translate-x-16" />
          <CardContent className="p-6 relative">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Schools</p>
                <p className="text-2xl font-bold">{stats.active.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="text-xs text-muted-foreground">
                    {activePercentage.toFixed(1)}% of total
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-full -translate-y-16 translate-x-16" />
          <CardContent className="p-6 relative">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold">{stats.pending.toLocaleString()}</p>
                {stats.pending > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      Needs Review
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-full -translate-y-16 translate-x-16" />
          <CardContent className="p-6 relative">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Building className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Management Types</p>
                <p className="text-2xl font-bold">{Object.keys(stats.byManagement).length}</p>
                <div className="flex gap-1 mt-1">
                  {Object.keys(stats.byManagement).slice(0, 3).map((type) => (
                    <Badge key={type} variant="outline" className="text-xs capitalize">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="w-4 h-4 text-blue-600" />
              </div>
              School Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString(), 'Schools']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Management Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Building className="w-4 h-4 text-green-600" />
              </div>
              Management Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={managementData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [value.toLocaleString(), 'Schools']}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {managementData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top States by School Count */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MapPin className="w-4 h-4 text-purple-600" />
            </div>
            Top States by School Count
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {topStates.map((item, index) => (
              <div 
                key={item.state}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all hover:shadow-md",
                  index === 0 && "border-yellow-200 bg-yellow-50",
                  index === 1 && "border-gray-200 bg-gray-50", 
                  index === 2 && "border-orange-200 bg-orange-50",
                  index > 2 && "border-muted bg-muted/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{item.state}</p>
                    <p className="text-2xl font-bold">{item.count.toLocaleString()}</p>
                  </div>
                  {index < 3 && (
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold",
                      index === 0 && "bg-yellow-500",
                      index === 1 && "bg-gray-500",
                      index === 2 && "bg-orange-500"
                    )}>
                      {index + 1}
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground">
                    {((item.count / stats.total) * 100).toFixed(1)}% of total
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};