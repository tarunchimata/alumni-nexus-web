
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import MultiStepRegister from "@/pages/MultiStepRegister";
import PendingApproval from "@/pages/PendingApproval";
import OAuth2Callback from "@/pages/OAuth2Callback";
import Health from "@/pages/Health";

// Dashboard Layout and Pages
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import ActivityFeedPage from "@/pages/ActivityFeedPage";
import PeopleDiscovery from "@/pages/PeopleDiscovery";
import ConnectionsList from "@/pages/ConnectionsList";
import EventsList from "@/pages/EventsList";
import ProfileEdit from "@/pages/ProfileEdit";
import Profile from "@/pages/Profile";
import Messages from "@/pages/Messages";
import Settings from "@/pages/Settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<MultiStepRegister />} />
              <Route path="/auth/callback" element={<OAuth2Callback />} />
              <Route path="/auth/pending-approval" element={<PendingApproval />} />

              {/* Dashboard Routes with Nested Layout */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="activity" element={<ActivityFeedPage />} />
                <Route path="people" element={<PeopleDiscovery />} />
                <Route path="connections" element={<ConnectionsList />} />
                <Route path="events" element={<EventsList />} />
                <Route path="messages" element={<Messages />} />
                <Route path="profile" element={<Profile />} />
                <Route path="profile/edit" element={<ProfileEdit />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* Legacy Routes for Backward Compatibility */}
              <Route 
                path="/profile" 
                element={<Navigate to="/dashboard/profile" replace />}
              />
              <Route 
                path="/settings" 
                element={<Navigate to="/dashboard/settings" replace />}
              />

              {/* Health check endpoint */}
              <Route path="/health" element={<Health />} />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            <Toaster />
          </div>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
