import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { oauth2Service } from "@/lib/oauth2";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'teacher' | 'alumni' | 'school_admin' | 'platform_admin';
  schoolId?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: () => void;
  logout: () => void;
  register: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  // Re-initialize auth when URL changes (for OAuth2 callback handling)
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('[Auth] Storage changed, re-initializing auth...');
      initializeAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      console.log('[Auth] Initializing authentication...');
      
      // Check if user is authenticated
      const isAuth = await oauth2Service.isAuthenticated();
      
      if (isAuth) {
        console.log('[Auth] User is authenticated, fetching user info...');
        const userInfo = await oauth2Service.getUserInfo();
        const authToken = await oauth2Service.getAccessToken();
        
        if (userInfo) {
          setUser({
            id: userInfo.id,
            email: userInfo.email,
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            role: userInfo.role as 'student' | 'teacher' | 'alumni' | 'school_admin' | 'platform_admin',
            schoolId: userInfo.schoolId,
            avatar: userInfo.avatar,
          });
          console.log('[Auth] User authenticated successfully:', userInfo.email);
        }
        
        setToken(authToken || null);
        setAuthenticated(true);
      } else {
        console.log('[Auth] User is not authenticated');
        setAuthenticated(false);
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      console.error('[Auth] Authentication initialization failed:', error);
      setAuthenticated(false);
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = () => {
    console.log('[Auth] Initiating login...');
    oauth2Service.login();
  };

  const register = () => {
    console.log('[Auth] Initiating registration...');
    oauth2Service.login();
  };

  const logout = () => {
    console.log('[Auth] Logging out...');
    oauth2Service.logout();
    setUser(null);
    setToken(null);
    setAuthenticated(false);
  };

  // Expose method to manually refresh auth state
  const refreshAuth = () => {
    console.log('[Auth] Manually refreshing auth state...');
    initializeAuth();
  };

  const value = {
    user,
    login,
    logout,
    register,
    isLoading,
    isAuthenticated: authenticated,
    token,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
