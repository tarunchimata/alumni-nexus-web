import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { School, CheckCircle, X, Eye, AlertTriangle, Users } from "lucide-react";
import { apiService } from "@/services/apiService";
import { useToast } from "@/hooks/use-toast";

interface PendingSchool {
  id: string;
  schoolName: string;
  stateName: string;
  districtName: string;
  udiseSchoolCode?: string;
  address?: string;
  contactNumber?: string;
  status: string;
  createdAt: string;
  _count?: {
    users: number;
  };
}

interface SchoolApprovalQueueProps {
  onApprovalAction?: () => void;
}

interface SchoolsResponse {
  schools: PendingSchool[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface ValidationResult {
  schoolId: string;
  isValid: boolean;
  duplicates: Array<{
    id: string;
    schoolName: string;
    udiseSchoolCode?: string;
    districtName: string;
    stateName: string;
    status: string;
  }>;
  issues: string[];
}

const SchoolApprovalQueue = ({ onApprovalAction }: SchoolApprovalQueueProps) => {
  const [pendingSchools, setPendingSchools] = useState<PendingSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingSchools();
  }, []);

  const fetchPendingSchools = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSchools() as SchoolsResponse;
      
      // Filter for pending schools
      const pending = response.schools?.filter((school: PendingSchool) => 
        school.status === 'pending' || school.status === 'pending_approval'
      ) || [];
      
      setPendingSchools(pending);
    } catch (error) {
      console.error('Failed to fetch pending schools:', error);
      toast({
        title: "Error",
        description: "Failed to load pending schools",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (schoolId: string, schoolName: string) => {
    setProcessingIds(prev => new Set(prev).add(schoolId));
    
    try {
      await apiService.post(`/schools/${schoolId}/approve`, {});
      
      toast({
        title: "School Approved",
        description: `${schoolName} has been approved and activated`,
      });
      
      setPendingSchools(prev => prev.filter(school => school.id !== schoolId));
      onApprovalAction?.();
    } catch (error) {
      console.error('Failed to approve school:', error);
      toast({
        title: "Approval Failed",
        description: "Failed to approve school. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(schoolId);
        return newSet;
      });
    }
  };

  const handleReject = async (schoolId: string, schoolName: string) => {
    setProcessingIds(prev => new Set(prev).add(schoolId));
    
    try {
      await apiService.put(`/schools/${schoolId}`, { status: 'rejected' });
      
      toast({
        title: "School Rejected",
        description: `${schoolName} has been rejected`,
        variant: "destructive",
      });
      
      setPendingSchools(prev => prev.filter(school => school.id !== schoolId));
      onApprovalAction?.();
    } catch (error) {
      console.error('Failed to reject school:', error);
      toast({
        title: "Rejection Failed",
        description: "Failed to reject school. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(schoolId);
        return newSet;
      });
    }
  };

  const handleValidate = async (schoolId: string) => {
    try {
      const result = await apiService.validateSchool(schoolId) as ValidationResult;
      
      if (result.isValid) {
        toast({
          title: "Validation Passed",
          description: "No issues found with this school",
        });
      } else {
        const issues = [
          ...(result.duplicates?.length > 0 ? [`${result.duplicates.length} potential duplicates found`] : []),
          ...result.issues,
        ].join(", ");
        
        toast({
          title: "Validation Issues",
          description: issues,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to validate school:', error);
      toast({
        title: "Validation Failed",
        description: "Failed to validate school. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>School Approval Queue</CardTitle>
          <CardDescription>Loading pending schools...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <School className="h-5 w-5" />
          School Approval Queue
        </CardTitle>
        <CardDescription>
          {pendingSchools.length} schools pending approval
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingSchools.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-muted-foreground">No schools pending approval</p>
            <p className="text-sm text-muted-foreground">All caught up!</p>
          </div>
        ) : (
          pendingSchools.map((school) => (
            <div key={school.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium">{school.schoolName}</h4>
                  <p className="text-sm text-muted-foreground">
                    {school.districtName}, {school.stateName}
                  </p>
                  {school.udiseSchoolCode && (
                    <p className="text-xs text-muted-foreground">
                      UDISE: {school.udiseSchoolCode}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Submitted: {new Date(school.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="secondary">
                  {school.status}
                </Badge>
              </div>
              
              {school._count && school._count.users > 0 && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {school._count.users} users waiting
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <Button 
                  size="sm" 
                  onClick={() => handleApprove(school.id, school.schoolName)}
                  disabled={processingIds.has(school.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Approve
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleValidate(school.id)}
                  disabled={processingIds.has(school.id)}
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Validate
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleReject(school.id, school.schoolName)}
                  disabled={processingIds.has(school.id)}
                >
                  <X className="h-3 w-3 mr-1" />
                  Reject
                </Button>
                
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => window.open(`/schools/${school.id}`, '_blank')}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Details
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default SchoolApprovalQueue;