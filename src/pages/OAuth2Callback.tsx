
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { oauth2Service } from '@/lib/oauth2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface CallbackState {
  status: 'loading' | 'success' | 'error' | 'warning';
  message: string;
  userInfo?: any;
  errorDetails?: string;
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
        console.log('[OAuth2Callback] Starting callback processing');
        
        // Parse URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const stateParam = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        console.log('[OAuth2Callback] URL parameters:', {
          hasCode: !!code,
          hasState: !!stateParam,
          hasError: !!error,
          codeLength: code?.length || 0,
          statePreview: stateParam?.substring(0, 10) + '...' || 'undefined',
          error,
          errorDescription
        });

        // Handle OAuth2 errors from Keycloak
        if (error) {
          console.error('[OAuth2Callback] OAuth2 error from Keycloak:', { error, errorDescription });
          setState({
            status: 'error',
            message: `Authentication failed: ${errorDescription || error}`,
            errorDetails: 'The authentication server returned an error. Please try logging in again.'
          });
          return;
        }

        // Validate required parameters
        if (!code) {
          console.error('[OAuth2Callback] Missing authorization code');
          setState({
            status: 'error',
            message: 'Missing authorization code from authentication server',
            errorDetails: 'The login process was incomplete. Please try logging in again.'
          });
          return;
        }

        if (!stateParam) {
          console.error('[OAuth2Callback] Missing state parameter');
          setState({
            status: 'error',
            message: 'Missing state parameter from authentication server',
            errorDetails: 'Security validation failed. Please try logging in again.'
          });
          return;
        }

        setState({
          status: 'loading',
          message: 'Validating login security parameters...',
        });

        console.log('[OAuth2Callback] Exchanging authorization code for tokens');

        // Exchange code for tokens
        await oauth2Service.exchangeCodeForTokens(code, stateParam);
        
        console.log('[OAuth2Callback] Token exchange successful');

        setState({
          status: 'loading',
          message: 'Fetching your profile information...',
        });

        // Get user information
        console.log('[OAuth2Callback] Fetching user profile...');
        const userInfo = await oauth2Service.getUserInfo();
        
        if (!userInfo) {
          console.error('[OAuth2Callback] Failed to fetch user profile');
          setState({
            status: 'warning',
            message: 'Login successful, but failed to fetch profile information',
            errorDetails: 'You are logged in, but we could not retrieve your profile. Some features may not work correctly.'
          });
          
          // Still redirect to dashboard after a delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
          return;
        }
        
        console.log('[OAuth2Callback] User profile retrieved successfully', { 
          userId: userInfo.id, 
          email: userInfo.email, 
          role: userInfo.role 
        });

        setState({
          status: 'success',
          message: 'Login successful! Redirecting to your dashboard...',
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
        }, 2000);

      } catch (error) {
        console.error('[OAuth2Callback] Callback processing error:', error);
        
        let errorMessage = 'An unexpected error occurred during login';
        let errorDetails = 'Please try logging in again.';
        
        if (error instanceof Error) {
          errorMessage = error.message;
          
          // Provide specific guidance for common errors
          if (error.message.includes('state parameter')) {
            errorDetails = 'This is a security validation error. Please clear your browser cache and try logging in again.';
          } else if (error.message.includes('token exchange')) {
            errorDetails = 'There was a problem communicating with the authentication server. Please try again.';
          } else if (error.message.includes('expired')) {
            errorDetails = 'Your login session took too long. Please try logging in again.';
          }
        }
        
        setState({
          status: 'error',
          message: errorMessage,
          errorDetails: errorDetails
        });
      }
    };

    handleCallback();
  }, [navigate]);

  const handleRetry = () => {
    console.log('[OAuth2Callback] User initiated retry, redirecting to login');
    navigate('/login');
  };

  const handleGoHome = () => {
    console.log('[OAuth2Callback] User chose to go home');
    navigate('/');
  };

  const getIcon = () => {
    switch (state.status) {
      case 'loading':
        return <Loader2 className="w-8 h-8 text-white animate-spin" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-white" />;
      case 'warning':
        return <AlertTriangle className="w-8 h-8 text-white" />;
      case 'error':
        return <XCircle className="w-8 h-8 text-white" />;
      default:
        return <Loader2 className="w-8 h-8 text-white animate-spin" />;
    }
  };

  const getTitle = () => {
    switch (state.status) {
      case 'loading':
        return 'Processing Login';
      case 'success':
        return 'Login Successful';
      case 'warning':
        return 'Login Partially Successful';
      case 'error':
        return 'Login Failed';
      default:
        return 'Processing Login';
    }
  };

  const getIconBgColor = () => {
    switch (state.status) {
      case 'success':
        return 'bg-gradient-to-br from-green-500 to-emerald-600';
      case 'warning':
        return 'bg-gradient-to-br from-yellow-500 to-orange-600';
      case 'error':
        return 'bg-gradient-to-br from-red-500 to-rose-600';
      default:
        return 'bg-gradient-to-br from-blue-500 to-purple-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className={`mx-auto w-16 h-16 rounded-full ${getIconBgColor()} flex items-center justify-center`}>
            {getIcon()}
          </div>
          <CardTitle className="text-2xl">{getTitle()}</CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">{state.message}</p>
          
          {state.errorDetails && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
              <h4 className="font-medium text-red-900 mb-2">What can you do?</h4>
              <p className="text-sm text-red-700">{state.errorDetails}</p>
            </div>
          )}
          
          {state.userInfo && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
              <h4 className="font-medium text-green-900 mb-2">Welcome back!</h4>
              <div className="space-y-1 text-sm text-green-700">
                <p><span className="font-medium">Name:</span> {state.userInfo.firstName} {state.userInfo.lastName}</p>
                <p><span className="font-medium">Email:</span> {state.userInfo.email}</p>
                <p><span className="font-medium">Role:</span> {state.userInfo.role.replace('_', ' ').toUpperCase()}</p>
              </div>
            </div>
          )}

          {(state.status === 'error' || state.status === 'warning') && (
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors"
              >
                Try Logging In Again
              </button>
              <button
                onClick={handleGoHome}
                className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Go to Home Page
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuth2Callback;
