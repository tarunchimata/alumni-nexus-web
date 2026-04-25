import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/shared/Logo';
import loginBg from '@/assets/login-bg.jpg';

export const Login = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  // Auto-redirect to login on mount
  useEffect(() => {
    const autoLogin = async () => {
      try {
        setIsSubmitting(true);
        await login();
      } catch (error) {
        console.error('Auto-login failed:', error);
      } finally {
        setIsSubmitting(false);
      }
    };
    autoLogin();
  }, []);

  const handleLogin = async () => {
    try {
      setIsSubmitting(true);
      await login();
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={loginBg}
          alt="School background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo and Welcome Text */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-white/80">Sign in to connect with your school community</p>
        </div>

        {/* Login Card */}
        <Card className="backdrop-blur-sm bg-white/95 border-0 shadow-2xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Use your institutional account to access the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button 
              type="button"
              onClick={handleLogin}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isSubmitting}
            >
              <Shield className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Connecting...' : 'Login with Keycloak'}
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-600">Need an account? </span>
              <Link to="/register" className="text-primary hover:underline font-medium">
                Register here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;