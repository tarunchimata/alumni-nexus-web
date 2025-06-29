
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { initKeycloak, login as keycloakLogin, logout as keycloakLogout, register as keycloakRegister, getUserInfo, isAuthenticated, getToken } from "@/lib/keycloak";

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      const authenticated = await initKeycloak();
      
      if (authenticated) {
        const userInfo = getUserInfo();
        const authToken = getToken();
        
        if (userInfo) {
          // Fetch user profile from backend
          const response = await fetch('/api/auth/profile', {
            headers: {
              'Authorization': `Bearer ${authToken}`,
            },
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser({
              id: userData.id,
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: userData.role,
              schoolId: userData.school?.id,
              avatar: userData.profilePictureUrl,
            });
          } else {
            // Fallback to Keycloak user info
            setUser({
              id: userInfo.id,
              email: userInfo.email,
              firstName: userInfo.firstName,
              lastName: userInfo.lastName,
              role: userInfo.roles.includes('platform_admin') ? 'platform_admin' :
                    userInfo.roles.includes('school_admin') ? 'school_admin' :
                    userInfo.roles.includes('teacher') ? 'teacher' :
                    userInfo.roles.includes('alumni') ? 'alumni' : 'student',
            });
          }
        }
        
        setToken(authToken || null);
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = () => {
    keycloakLogin();
  };

  const register = () => {
    keycloakRegister();
  };

  const logout = () => {
    keycloakLogout();
    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    login,
    logout,
    register,
    isLoading,
    isAuthenticated: isAuthenticated(),
    token,
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
