
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

// Pages
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import MultiStepRegister from "@/pages/MultiStepRegister";
import PendingApproval from "@/pages/PendingApproval";
import OAuth2Callback from "@/pages/OAuth2Callback";

// Dashboards
import PlatformAdminDashboard from "@/pages/dashboard/PlatformAdminDashboard";
import SchoolAdminDashboard from "@/pages/dashboard/SchoolAdminDashboard";  
import TeacherDashboard from "@/pages/dashboard/TeacherDashboard";
import StudentDashboard from "@/pages/dashboard/StudentDashboard";
import AlumniDashboard from "@/pages/dashboard/AlumniDashboard";

// Profile and Settings
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Role-based dashboard routing
const DashboardRoute = () => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Handle pending approval
  if (user.status === 'pending_approval') {
    return <Navigate to="/auth/pending-approval" replace />;
  }

  // Role-based redirects to the correct paths
  switch (user.role) {
    case 'platform_admin':
      return <Navigate to="/admin/platform" replace />;
    case 'school_admin':
      return <Navigate to="/admin/school" replace />;
    case 'teacher':
      return <Navigate to="/dashboard/teacher" replace />;
    case 'student':
      return <Navigate to="/dashboard/student" replace />;
    case 'alumni':
      return <Navigate to="/dashboard/alumni" replace />;
    default:
      return <Navigate to="/dashboard/student" replace />;
  }
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<MultiStepRegister />} />
              <Route path="/auth/pending-approval" element={<PendingApproval />} />
              <Route path="/oauth2/callback" element={<OAuth2Callback />} />

              {/* Dashboard Routes - Updated to match required paths */}
              <Route path="/dashboard" element={<DashboardRoute />} />
              <Route 
                path="/admin/platform" 
                element={
                  <ProtectedRoute>
                    <PlatformAdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/school" 
                element={
                  <ProtectedRoute>
                    <SchoolAdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/teacher" 
                element={
                  <ProtectedRoute>
                    <TeacherDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/student" 
                element={
                  <ProtectedRoute>
                    <StudentDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/alumni" 
                element={
                  <ProtectedRoute>
                    <AlumniDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Profile and Settings */}
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } 
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
