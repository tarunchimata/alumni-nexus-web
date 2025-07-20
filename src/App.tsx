
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
import PlatformDashboard from "@/pages/dashboard/PlatformDashboard";
import SchoolDashboard from "@/pages/dashboard/SchoolDashboard";  
import UserDashboard from "@/pages/dashboard/UserDashboard";

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

  // Role-based redirects
  switch (user.role) {
    case 'platform_admin':
      return <Navigate to="/dashboard/platform" replace />;
    case 'school_admin':
      return <Navigate to="/dashboard/school" replace />;
    case 'teacher':
    case 'student':
    case 'alumni':
      return <Navigate to="/dashboard/user" replace />;
    default:
      return <UserDashboard />;
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

              {/* Dashboard Routes */}
              <Route path="/dashboard" element={<DashboardRoute />} />
              <Route 
                path="/dashboard/platform" 
                element={
                  <ProtectedRoute>
                    <PlatformDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/school" 
                element={
                  <ProtectedRoute>
                    <SchoolDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/user" 
                element={
                  <ProtectedRoute>
                    <UserDashboard />
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
