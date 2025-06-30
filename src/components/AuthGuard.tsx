
import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: string;
}

const AuthGuard = ({ children, requiredRole }: AuthGuardProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check authentication with backend using cookies
        const response = await fetch('/api/auth/profile', {
          method: 'GET',
          credentials: 'include', // Important: include cookies
        });

        if (response.ok) {
          const profile = await response.json();
          setIsAuthenticated(true);
          setUserRole(profile.user_type || profile.role);
        } else if (response.status === 401) {
          // Try to refresh token
          const refreshResponse = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
          });

          if (refreshResponse.ok) {
            // Retry profile fetch
            const retryResponse = await fetch('/api/auth/profile', {
              method: 'GET',
              credentials: 'include',
            });

            if (retryResponse.ok) {
              const profile = await retryResponse.json();
              setIsAuthenticated(true);
              setUserRole(profile.user_type || profile.role);
            } else {
              setIsAuthenticated(false);
              navigate('/login');
            }
          } else {
            setIsAuthenticated(false);
            navigate('/login');
          }
        } else {
          setIsAuthenticated(false);
          navigate('/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (isAuthenticated && requiredRole && userRole !== requiredRole) {
      // Redirect to appropriate dashboard based on role
      navigate('/dashboard');
    }
  }, [isAuthenticated, userRole, requiredRole, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (requiredRole && userRole !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
