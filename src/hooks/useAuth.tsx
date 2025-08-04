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
  login: () => Promise<boolean>;
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
      const isAuthenticated = await oauth2Service.isAuthenticated();
      if (isAuthenticated) {
        const userInfo = await oauth2Service.getUserInfo();
        if (userInfo) {
          setUser({
            id: userInfo.id,
            email: userInfo.email,
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            role: userInfo.role,
            schoolId: userInfo.schoolId,
            avatar: userInfo.avatar
          });
          const accessToken = await oauth2Service.getAccessToken();
          setToken(accessToken);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      await oauth2Service.login();
      return true;
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
      await oauth2Service.logout();
      setUser(null);
      setToken(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      setToken(null);
      navigate('/');
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