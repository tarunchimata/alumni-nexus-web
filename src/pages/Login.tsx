
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/shared/Logo";
import loginBg from "@/assets/login-bg.jpg";

const Login = () => {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
  });

  const useOAuth2 = import.meta.env.VITE_USE_OAUTH2 === 'true';

  const handleOAuth2Login = async () => {
    console.log('[Login] Keycloak login button clicked');
    
    try {
      // Show loading state
      const button = document.querySelector('[data-oauth-login]') as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.textContent = 'Connecting to Keycloak...';
      }

      console.log('[Login] Fetching OAuth2 config from backend...');
      
      // Fetch config from backend API
      const configResponse = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/oauth2/config`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!configResponse.ok) {
        throw new Error(`Config fetch failed: ${configResponse.status} ${configResponse.statusText}`);
      }

      const config = await configResponse.json();
      console.log('[Login] OAuth2 config received:', config);

      // Build OAuth2 authorization URL
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: import.meta.env.VITE_OAUTH2_REDIRECT_URI,
        response_type: 'code',
        scope: 'openid profile email',
        state: Math.random().toString(36).substring(2, 15),
      });

      const authUrl = `${config.authorizationEndpoint}?${params.toString()}`;
      console.log('[Login] Redirecting to Keycloak:', authUrl);

      // Redirect to Keycloak
      window.location.href = authUrl;

    } catch (error) {
      console.error('[Login] OAuth2 login failed:', error);
      
      // Reset button state
      const button = document.querySelector('[data-oauth-login]') as HTMLButtonElement;
      if (button) {
        button.disabled = false;
        button.innerHTML = '<svg class="w-5 h-5 mr-2">...</svg>Login with Keycloak';
      }

      // Fallback to service method
      console.log('[Login] Falling back to oauth2Service.login()');
      login();
    }
  };

  const handleLegacySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Add CSRF token to headers
      const csrfResponse = await fetch('/api/csrf-token', {
        credentials: 'include',
      });
      
      let csrfToken = '';
      if (csrfResponse.ok) {
        const csrfData = await csrfResponse.json();
        csrfToken = csrfData.csrfToken;
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          username: formData.email,
          password: formData.password,
        }),
      });

      if (response.ok) {
        // Get user profile to determine redirect
        const profileResponse = await fetch('/api/auth/profile', {
          credentials: 'include',
        });
        
        if (profileResponse.ok) {
          const profile = await profileResponse.json();
          
          // Role-based redirect
          if (profile.roles.includes('platform_admin')) {
            window.location.href = '/dashboard/platform';
          } else if (profile.roles.includes('school_admin')) {
            window.location.href = '/dashboard/school';
          } else {
            window.location.href = '/dashboard';
          }
        } else {
          window.location.href = '/dashboard';
        }
      } else {
        const error = await response.json();
        console.error('Login failed:', error);
        // Handle login error (show toast, etc.)
      }
    } catch (error) {
      console.error('Login error:', error);
      // Handle network error
    }
  };


  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${loginBg})` }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60" />
      
      {/* Content */}
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo size="lg" />
          <p className="text-white/90 mt-4 text-lg font-medium">Welcome back to your school community</p>
        </div>

        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Sign in</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <Button 
                onClick={handleOAuth2Login}
                data-oauth-login
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium"
              >
                <Shield className="w-5 h-5 mr-2" />
                Login with Keycloak
              </Button>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or use legacy login</span>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleLegacySubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <Label htmlFor="remember" className="text-sm text-gray-600">
                    Remember me
                  </Label>
                </div>
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
                  Forgot password?
                </Link>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                Sign In
              </Button>
            </form>


            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary hover:text-primary/80 font-medium">
                  Create Account
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
