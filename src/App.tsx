
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/useAuth";
import { RoleProvider } from "@/contexts/RoleContext";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from "@/components/ErrorFallback";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import MultiStepRegister from "@/pages/MultiStepRegister";
import PendingApproval from "@/pages/PendingApproval";
import OAuth2Callback from "@/pages/OAuth2Callback";
import Health from "@/pages/Health";
import SchoolsTest from "@/pages/SchoolsTest";
import SchoolsAPIDebug from "@/pages/SchoolsAPIDebug";
import APITestLab from "@/pages/APITestLab";
import APIIntegrationTest from "@/pages/APIIntegrationTest";

// Production Dashboard Layout and Pages
import { ProductionDashboardLayout } from "@/components/layout/ProductionDashboardLayout";
import DashboardHome from "@/pages/DashboardHome";
import ActivityFeedPage from "@/pages/ActivityFeedPage";
import PeopleDiscovery from "@/pages/PeopleDiscovery";
import ConnectionsList from "@/pages/ConnectionsList";
import EventsList from "@/pages/EventsList";
import ProfileEdit from "@/pages/ProfileEdit";
import Profile from "@/pages/Profile";
import Messages from "@/pages/Messages";
import SettingsPage from "@/pages/SettingsPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import CSVUploadPage from "@/pages/CSVUploadPage";
import SchoolsManagement from "@/pages/SchoolsManagement";
import WelcomePage from "@/pages/WelcomePage";
import MatrixAdminPage from "@/pages/MatrixAdminPage";

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
          <RoleProvider>
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <div className="min-h-screen w-full bg-background">
                <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<MultiStepRegister />} />
              <Route path="/auth/callback" element={<OAuth2Callback />} />
              <Route path="/auth/pending-approval" element={<PendingApproval />} />
               <Route path="/schools-test" element={<SchoolsTest />} />
               <Route path="/schools-debug" element={<SchoolsAPIDebug />} />
               <Route path="/api-test" element={<APITestLab />} />
               <Route path="/api-integration-test" element={<APIIntegrationTest />} />

              {/* Production Dashboard Routes with Nested Layout */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <ProductionDashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardHome />} />
                <Route path="activity" element={<ActivityFeedPage />} />
                <Route path="people" element={<PeopleDiscovery />} />
                <Route path="connections" element={<ConnectionsList />} />
                <Route path="events" element={<EventsList />} />
                <Route path="messages" element={<Messages />} />
                <Route path="profile" element={<Profile />} />
                <Route path="profile/edit" element={<ProfileEdit />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="admin/csv-upload" element={<CSVUploadPage />} />
                <Route path="schools" element={<SchoolsManagement />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="school-analytics" element={<AnalyticsPage />} />
                <Route path="admin/matrix" element={<MatrixAdminPage />} />
                <Route path="welcome" element={<WelcomePage />} />
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
            </ErrorBoundary>
          </RoleProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
