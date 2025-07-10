
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
  debugInfo?: any;
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
          errorDescription,
          fullUrl: window.location.href
        });

        // Handle OAuth2 errors from Keycloak
        if (error) {
          console.error('[OAuth2Callback] OAuth2 error from Keycloak:', { error, errorDescription });
          setState({
            status: 'error',
            message: `Authentication failed: ${errorDescription || error}`,
            errorDetails: 'The authentication server returned an error. Please try logging in again.',
            debugInfo: { error, errorDescription, url: window.location.href }
          });
          return;
        }

        // Validate required parameters
        if (!code) {
          console.error('[OAuth2Callback] Missing authorization code');
          setState({
            status: 'error',
            message: 'Missing authorization code from authentication server',
            errorDetails: 'The login process was incomplete. Please try logging in again.',
            debugInfo: { hasCode: !!code, url: window.location.href }
          });
          return;
        }

        if (!stateParam) {
          console.error('[OAuth2Callback] Missing state parameter');
          setState({
            status: 'error',
            message: 'Missing state parameter from authentication server',
            errorDetails: 'Security validation failed. Please try logging in again.',
            debugInfo: { hasState: !!stateParam, url: window.location.href }
          });
          return;
        }

        setState({
          status: 'loading',
          message: 'Validating login security parameters...',
        });

        console.log('[OAuth2Callback] Exchanging authorization code for tokens');

        // Exchange code for tokens with enhanced error handling
        let tokenExchangeResult;
        try {
          tokenExchangeResult = await oauth2Service.exchangeCodeForTokens(code, stateParam);
          console.log('[OAuth2Callback] Token exchange successful');
        } catch (tokenError) {
          console.error('[OAuth2Callback] Token exchange failed:', tokenError);
          
          let errorMessage = 'Token exchange failed';
          let errorDetails = 'Please try logging in again.';
          
          if (tokenError instanceof Error) {
            errorMessage = tokenError.message;
            
            if (tokenError.message.includes('state')) {
              errorDetails = 'Security validation failed. This might be due to browser storage issues or multiple login attempts. Please clear your browser cache and try again.';
            } else if (tokenError.message.includes('Network error')) {
              errorDetails = 'Cannot connect to the authentication server. Please check your internet connection and try again.';
            } else if (tokenError.message.includes('Invalid response')) {
              errorDetails = 'The authentication server returned an invalid response. Please try again or contact support.';
            }
          }
          
          setState({
            status: 'error',
            message: errorMessage,
            errorDetails,
            debugInfo: { 
              tokenError: tokenError instanceof Error ? tokenError.message : 'Unknown error',
              code: code?.substring(0, 10) + '...',
              state: stateParam?.substring(0, 10) + '...'
            }
          });
          return;
        }
        
        setState({
          status: 'loading',
          message: 'Fetching your profile information...',
        });

        // Get user information with enhanced error handling
        console.log('[OAuth2Callback] Fetching user profile...');
        let userInfo;
        try {
          userInfo = await oauth2Service.getUserInfo();
        } catch (userInfoError) {
          console.error('[OAuth2Callback] User info fetch failed:', userInfoError);
          
          setState({
            status: 'warning',
            message: 'Login successful, but failed to fetch profile information',
            errorDetails: 'You are logged in, but we could not retrieve your profile. Some features may not work correctly.',
            debugInfo: { userInfoError: userInfoError instanceof Error ? userInfoError.message : 'Unknown error' }
          });
          
          // Still redirect to dashboard after a delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
          return;
        }
        
        if (!userInfo) {
          console.error('[OAuth2Callback] Failed to fetch user profile - no data returned');
          setState({
            status: 'warning',
            message: 'Login successful, but failed to fetch profile information',
            errorDetails: 'You are logged in, but we could not retrieve your profile. Some features may not work correctly.',
            debugInfo: { userInfo: 'null or undefined' }
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
        console.error('[OAuth2Callback] Unexpected callback processing error:', error);
        
        let errorMessage = 'An unexpected error occurred during login';
        let errorDetails = 'Please try logging in again.';
        
        if (error instanceof Error) {
          errorMessage = error.message;
          
          // Provide specific guidance for common errors
          if (error.message.includes('storage')) {
            errorDetails = 'Browser storage issue detected. Please enable cookies and local storage, then try again.';
          } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorDetails = 'Network connectivity issue. Please check your internet connection and try again.';
          } else if (error.message.includes('JSON')) {
            errorDetails = 'Server response format error. Please try again or contact support if the problem persists.';
          }
        }
        
        setState({
          status: 'error',
          message: errorMessage,
          errorDetails: errorDetails,
          debugInfo: { 
            unexpectedError: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack?.substring(0, 200) : undefined,
            url: window.location.href
          }
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
          
          {state.debugInfo && process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
              <h4 className="font-medium text-gray-900 mb-2">Debug Information:</h4>
              <pre className="text-xs text-gray-600 overflow-auto max-h-32">
                {JSON.stringify(state.debugInfo, null, 2)}
              </pre>
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
