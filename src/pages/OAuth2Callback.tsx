import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { oauth2Service } from '@/lib/oauth2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface CallbackState {
  status: 'loading' | 'success' | 'error';
  message: string;
  userInfo?: any;
}

const OAuth2Callback = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<CallbackState>({
    status: 'loading',
    message: 'Processing login...',
  });

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Parse URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        // Handle OAuth2 errors
        if (error) {
          setState({
            status: 'error',
            message: `Authentication failed: ${errorDescription || error}`,
          });
          return;
        }

        // Validate required parameters
        if (!code || !state) {
          setState({
            status: 'error',
            message: 'Missing authorization code or state parameter',
          });
          return;
        }

        setState({
          status: 'loading',
          message: 'Exchanging authorization code for tokens...',
        });

        console.log('OAuth2 Callback: Exchanging code for tokens', { code: code.substring(0, 10) + '...', state });

        // Exchange code for tokens
        await oauth2Service.exchangeCodeForTokens(code, state);
        
        console.log('OAuth2 Callback: Token exchange successful');

        setState({
          status: 'loading',
          message: 'Fetching user profile...',
        });

        // Get user information
        console.log('OAuth2 Callback: Fetching user info...');
        const userInfo = await oauth2Service.getUserInfo();
        
        if (!userInfo) {
          console.error('OAuth2 Callback: Failed to fetch user profile');
          setState({
            status: 'error',
            message: 'Failed to fetch user profile',
          });
          return;
        }
        
        console.log('OAuth2 Callback: User info retrieved successfully', { 
          userId: userInfo.id, 
          email: userInfo.email, 
          role: userInfo.role 
        });

        setState({
          status: 'success',
          message: 'Login successful! Redirecting...',
          userInfo,
        });

        // Redirect based on user role
        setTimeout(() => {
          switch (userInfo.role) {
            case 'platform_admin':
            case 'school_admin':
            case 'teacher':
            case 'student':
            case 'alumni':
              navigate('/dashboard');
              break;
            default:
              navigate('/');
          }
        }, 1500);

      } catch (error) {
        console.error('OAuth2 callback error:', error);
        
        // Additional debug logging for network errors
        if (error instanceof Error && error.message.includes('fetch')) {
          console.error('Network error details:', {
            message: error.message,
            stack: error.stack,
            currentUrl: window.location.href,
            apiUrl: import.meta.env.VITE_API_URL
          });
        }
        
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
        });
      }
    };

    handleCallback();
  }, [navigate]);

  const handleRetry = () => {
    navigate('/login');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            {state.status === 'loading' && (
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            )}
            {state.status === 'success' && (
              <CheckCircle className="w-8 h-8 text-white" />
            )}
            {state.status === 'error' && (
              <XCircle className="w-8 h-8 text-white" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {state.status === 'loading' && 'Processing Login'}
            {state.status === 'success' && 'Login Successful'}
            {state.status === 'error' && 'Login Failed'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">{state.message}</p>
          
          {state.userInfo && (
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <h4 className="font-medium text-gray-900 mb-2">Welcome back!</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Name:</span> {state.userInfo.firstName} {state.userInfo.lastName}</p>
                <p><span className="font-medium">Email:</span> {state.userInfo.email}</p>
                <p><span className="font-medium">Role:</span> {state.userInfo.role.replace('_', ' ').toUpperCase()}</p>
              </div>
            </div>
          )}

          {state.status === 'error' && (
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={handleGoHome}
                className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Go Home
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuth2Callback;