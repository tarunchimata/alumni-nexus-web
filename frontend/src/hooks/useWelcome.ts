import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useNavigate } from 'react-router-dom';

export const useWelcome = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if user has completed initial welcome flow
      const hasCompletedWelcome = localStorage.getItem(`welcome_completed_${user.id}`);
      
      // For new users (first login), show welcome screen
      if (!hasCompletedWelcome) {
        navigate('/dashboard/welcome');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const markWelcomeCompleted = () => {
    if (user?.id) {
      localStorage.setItem(`welcome_completed_${user.id}`, 'true');
    }
  };

  const isWelcomeCompleted = () => {
    if (!user?.id) return false;
    return !!localStorage.getItem(`welcome_completed_${user.id}`);
  };

  return {
    markWelcomeCompleted,
    isWelcomeCompleted
  };
};