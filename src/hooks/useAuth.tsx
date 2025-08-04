import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { oauth2Service } from '@/lib/oauth2';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  schoolId?: string;
  avatar?: string;
  status?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const navigate = useNavigate();

  const apiBaseUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://192.168.1.99:3033/api';

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // First try OAuth2 authentication
      const isOAuth2Auth = await oauth2Service.isAuthenticated();
      if (isOAuth2Auth) {
        const userInfo = await oauth2Service.getUserInfo();
        if (userInfo) {
          setUser({
            id: userInfo.id,
            email: userInfo.email,
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            role: userInfo.role,
            schoolId: userInfo.schoolId,
            avatar: userInfo.avatar,
            status: userInfo.status
          });
          setToken('oauth2-token');
          setIsLoading(false);
          return;
        }
      }

      // Fallback to session-based authentication
      const response = await fetch(`${apiBaseUrl}/auth/profile`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: email, password }),
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user || userData);
        setToken(userData.token || 'dummy-token');
        toast.success('Login successful!');
        navigate('/dashboard');
        return true;
      } else {
        const error = await response.json();
        toast.error(error.message || 'Login failed');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${apiBaseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      navigate('/');
      toast.success('Logged out successfully');
    }
  };

  const register = () => {
    navigate('/register');
  };

  const refreshAuth = async () => {
    await checkAuthStatus();
  };

  const value = {
    user,
    login,
    logout,
    register,
    isLoading,
    isAuthenticated: !!user,
    token,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};