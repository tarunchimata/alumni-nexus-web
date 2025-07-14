import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { oauth2Service } from '@/lib/oauth2';
import { useAuth } from '@/hooks/useAuth';
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
  const { user, isLoading, refreshAuth } = useAuth();
  const [state, setState] = useState<CallbackState>({
    status: 'loading',
    message: 'Processing login...',
  });

  useEffect(() => {
    const handleCallback = async () => {
      console.log('🚀 [OAuth2Callback] Starting callback processing');
      
      try {
        // Parse URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const stateParam = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        console.log('📋 [OAuth2Callback] URL parameters:', {
          hasCode: !!code,
          hasState: !!stateParam,
          hasError: !!error,
          error,
          errorDescription
        });

        // Handle OAuth2 errors from Keycloak
        if (error) {
          console.error('❌ [OAuth2Callback] OAuth2 error:', { error, errorDescription });
          setState({
            status: 'error',
            message: `Authentication failed: ${errorDescription || error}`,
            errorDetails: 'The authentication server returned an error. Please try logging in again.',
          });
          return;
        }

        // Validate required parameters
        if (!code) {
          console.error('❌ [OAuth2Callback] Missing authorization code');
          setState({
            status: 'error',
            message: 'Missing authorization code from authentication server',
            errorDetails: 'The login process was incomplete. Please try logging in again.',
          });
          return;
        }

        if (!stateParam) {
          console.error('❌ [OAuth2Callback] Missing state parameter');
          setState({
            status: 'error',
            message: 'Missing state parameter from authentication server',
            errorDetails: 'Security validation failed. Please try logging in again.',
          });
          return;
        }

        setState({
          status: 'loading',
          message: 'Exchanging authorization code for tokens...',
        });

        console.log('🔄 [OAuth2Callback] Starting token exchange');

        // Exchange code for tokens
        try {
          await oauth2Service.exchangeCodeForTokens(code, stateParam);
          console.log('✅ [OAuth2Callback] Token exchange completed');
        } catch (tokenError) {
          console.error('❌ [OAuth2Callback] Token exchange failed:', tokenError);
          
          let errorMessage = 'Token exchange failed';
          let errorDetails = 'Please try logging in again.';
          
          if (tokenError instanceof Error) {
            errorMessage = tokenError.message;
            
            if (tokenError.message.includes('state')) {
              errorDetails = 'Security validation failed. Clear your browser cache and try logging in again.';
            } else if (tokenError.message.includes('invalid_client')) {
              errorDetails = 'Client configuration error. Please verify the client settings.';
            } else if (tokenError.message.includes('invalid_grant')) {
              errorDetails = 'Authorization code expired or invalid. Please try logging in again.';
            }
          }
          
          setState({
            status: 'error',
            message: errorMessage,
            errorDetails,
          });
          return;
        }
        
        setState({
          status: 'loading',
          message: 'Refreshing authentication state...',
        });

        console.log('🔄 [OAuth2Callback] Tokens stored, refreshing auth state');

        // Refresh authentication state immediately
        await refreshAuth();

        console.log('🎉 [OAuth2Callback] Authentication state refreshed');

        setState({
          status: 'loading',
          message: 'Authentication successful! Redirecting to dashboard...',
        });

        // Wait for auth state to update in next render cycle
        setTimeout(() => {
          console.log('🔄 [OAuth2Callback] Checking auth state before redirect');
          navigate('/dashboard', { replace: true });
        }, 100);

      } catch (error) {
        console.error('💥 [OAuth2Callback] Unexpected error:', error);
        
        setState({
          status: 'error',
          message: 'Unexpected error during login processing',
          errorDetails: 'An unexpected error occurred. Please try logging in again.',
        });
      }
    };

    handleCallback();
  }, [navigate, refreshAuth]);

  // If user is already authenticated and loaded, redirect immediately
  useEffect(() => {
    if (!isLoading && user) {
      console.log('🚀 [OAuth2Callback] User already authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [user, isLoading, navigate]);

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
