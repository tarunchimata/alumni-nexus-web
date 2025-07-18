
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { RoleProvider } from "./contexts/RoleContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import MultiStepRegister from "./pages/MultiStepRegister";
import RegistrationPending from "./pages/RegistrationPending";
import Dashboard from "./pages/Dashboard";
import ActivityFeedPage from "./pages/ActivityFeedPage";
import PeopleDiscovery from "./pages/PeopleDiscovery";
import AlumniDirectory from "./pages/AlumniDirectory";
import PeopleYouMayKnow from "./pages/PeopleYouMayKnow";
import ConnectionsList from "./pages/ConnectionsList";
import EventsList from "./pages/EventsList";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import Settings from "./pages/Settings";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";
import OAuth2Callback from "./pages/OAuth2Callback";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <RoleProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<MultiStepRegister />} />
        <Route path="/registration/pending" element={<RegistrationPending />} />
              <Route path="/oauth2/callback" element={<OAuth2Callback />} />
              
              {/* Dashboard Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="activity" element={<ActivityFeedPage />} />
                <Route path="people" element={<PeopleDiscovery />} />
                <Route path="people/alumni" element={<AlumniDirectory />} />
                <Route path="people/suggestions" element={<PeopleYouMayKnow />} />
                <Route path="connections" element={<ConnectionsList />} />
                <Route path="events" element={<EventsList />} />
                <Route path="profile" element={<Profile />} />
                <Route path="profile/edit" element={<ProfileEdit />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              
              {/* Standalone Messages Route */}
              <Route 
                path="/messages" 
                element={
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                } 
              />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </RoleProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
