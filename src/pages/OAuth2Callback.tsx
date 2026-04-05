import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/lib/auth';
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface UrlParams {
  code?: string;
  error?: string;
  state?: string;
  error_description?: string;
}

const OAuth2Callback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing login...');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showRetry, setShowRetry] = useState(false);
  const hasProcessed = useRef(false);

  // CRITICAL: Capture URL parameters IMMEDIATELY to prevent race condition
  const captureUrlParams = (): UrlParams => {
    // Primary method: Direct URL parsing (race-condition resistant)
    const rawParams = new URLSearchParams(window.location.search);
    const directParams = {
      code: rawParams.get('code'),
      error: rawParams.get('error'),
      state: rawParams.get('state'),
      error_description: rawParams.get('error_description'),
    };

    // Secondary method: React Router params (may be cleared by navigation)
    const routerParams = {
      code: searchParams.get('code'),
      error: searchParams.get('error'),
      state: searchParams.get('state'),
      error_description: searchParams.get('error_description'),
    };

    // Tertiary method: Check localStorage backup (emergency fallback)
    const backupParams = {
      code: localStorage.getItem('oauth_callback_code'),
      error: localStorage.getItem('oauth_callback_error'),
      state: localStorage.getItem('oauth_callback_state'),
      error_description: localStorage.getItem('oauth_callback_error_desc'),
    };

    // Use the first available source
    const finalParams = {
      code: directParams.code || routerParams.code || backupParams.code,
      error: directParams.error || routerParams.error || backupParams.error,
      state: directParams.state || routerParams.state || backupParams.state,
      error_description: directParams.error_description || routerParams.error_description || backupParams.error_description,
    };

    // Store as backup for emergency recovery
    if (finalParams.code) localStorage.setItem('oauth_callback_code', finalParams.code);
    if (finalParams.error) localStorage.setItem('oauth_callback_error', finalParams.error);
    if (finalParams.state) localStorage.setItem('oauth_callback_state', finalParams.state);
    if (finalParams.error_description) localStorage.setItem('oauth_callback_error_desc', finalParams.error_description);

    return finalParams;
  };

  useEffect(() => {
    // Prevent multiple processing attempts
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const handleCallback = async () => {
      try {
        // STEP 1: Capture parameters immediately before any async operations
        const params = captureUrlParams();
        const { code, error, state, error_description } = params;

        // STEP 2: Enhanced debug logging with race condition detection
        const currentDebugInfo = {
          timestamp: new Date().toISOString(),
          urlParsingMethod: 'multi-source',
          directUrlParams: new URLSearchParams(window.location.search).toString(),
          reactRouterParams: searchParams.toString(),
          extractedParams: {
            hasCode: !!code,
            codeLength: code?.length || 0,
            hasError: !!error,
            hasState: !!state,
            stateLength: state?.length || 0,
            error: error,
            errorDescription: error_description,
          },
          urlInfo: {
            fullUrl: window.location.href,
            origin: window.location.origin,
            hostname: window.location.hostname,
            protocol: window.location.protocol,
            pathname: window.location.pathname,
            search: window.location.search,
          },
          raceConditionCheck: {
            routerParamsMatch: searchParams.get('code') === code,
            routerHasParams: searchParams.toString().length > 0,
            urlHasParams: window.location.search.length > 0,
          },
          userAgent: navigator.userAgent.substring(0, 100)
        };

        setDebugInfo(currentDebugInfo);

        console.group('[OAuth2Callback] 🚀 Callback Processing Start (Race-Condition Safe)');
        console.log('🔍 Debug Info:', currentDebugInfo);
        console.log('📝 Raw URL:', window.location.href);
        console.log('⚡ Race Condition Check:', currentDebugInfo.raceConditionCheck);
        console.groupEnd();

        // STEP 3: Handle OAuth2 errors
        if (error) {
          console.error('[OAuth2Callback] ❌ OAuth2 error received:', {
            error,
            errorDescription: error_description,
            debugInfo: currentDebugInfo
          });
          
          setStatus('error');
          setMessage(`Login failed: ${error}${error_description ? ` - ${error_description}` : ''}`);
          setShowRetry(true);
          
          // Clean up stored parameters
          ['oauth_callback_code', 'oauth_callback_error', 'oauth_callback_state', 'oauth_callback_error_desc']
            .forEach(key => localStorage.removeItem(key));
            
          setTimeout(() => navigate('/login'), 5000);
          return;
        }

        // STEP 4: Validate authorization code with fallback recovery
        if (!code) {
          console.error('[OAuth2Callback] ❌ No authorization code received');
          console.log('🔍 Available parameters:', currentDebugInfo);
          console.log('🚨 This may indicate a race condition or URL clearing issue');
          
          setStatus('error');
          setMessage('No authorization code received. This may be due to a browser navigation issue.');
          setShowRetry(true);
          
          // Attempt recovery by checking if we have the code in backup storage
          const backupCode = localStorage.getItem('oauth_callback_code');
          if (backupCode) {
            console.log('[OAuth2Callback] 🔄 Attempting recovery with backup code...');
            setMessage('Attempting recovery with backup authentication code...');
            
            // Retry with backup code
            setTimeout(() => {
              handleTokenExchange(backupCode, state);
            }, 1000);
            return;
          }
          
          setTimeout(() => navigate('/login'), 5000);
          return;
        }

        // STEP 5: Proceed with token exchange
        await handleTokenExchange(code, state);
        
      } catch (error) {
        console.group('[OAuth2Callback] ❌ Critical Callback Error');
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : 'Unknown',
          cause: error instanceof Error ? (error as any).cause : undefined
        });
        console.log('🔍 Debug context:', debugInfo);
        console.groupEnd();
        
        setStatus('error');
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setMessage(`Critical authentication error: ${errorMessage}`);
        setShowRetry(true);
        
        setTimeout(() => navigate('/login'), 5000);
      }
    };

    // Separate function for token exchange to allow retry
    const handleTokenExchange = async (code: string, state?: string | null) => {
      try {
        console.log('[OAuth2Callback] 🔄 Starting token exchange process...');
        setMessage('Exchanging authorization code for tokens...');
        
        // Handle the OAuth2 callback with state parameter
        const success = await authService.handleCallback(code, state || undefined);
        
        if (success) {
          console.log('[OAuth2Callback] ✅ Token exchange successful!');
          setStatus('success');
          setMessage('Login successful! Loading your profile...');
          
          console.log('[OAuth2Callback] 🔄 Refreshing authentication state...');
          
          // Refresh auth state to get user info
          await refreshAuth();
          
          console.log('[OAuth2Callback] ✅ Authentication state refreshed, redirecting...');
          setMessage('Welcome! Redirecting to dashboard...');
          
          // Clean up stored parameters on success
          ['oauth_callback_code', 'oauth_callback_error', 'oauth_callback_state', 'oauth_callback_error_desc']
            .forEach(key => localStorage.removeItem(key));
          
          // Clean URL AFTER successful processing to prevent race condition
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Check user approval status
          const userInfo = await authService.getUserInfo();
          const isAdmin = userInfo?.role === 'platform_admin' || userInfo?.role === 'super_admin' || userInfo?.role === 'school_admin';
          const isApproved = isAdmin || userInfo?.status === 'approved' || userInfo?.status === 'active';

          setTimeout(() => {
            if (!isApproved) {
              console.log('[OAuth2] User not approved, redirecting to pending page');
              navigate('/auth/pending-approval');
            } else {
              const hasCompletedWelcome = userInfo?.id 
                ? localStorage.getItem(`welcome_completed_${userInfo.id}`)
                : null;
              if (!hasCompletedWelcome && userInfo?.id) {
                navigate('/dashboard/welcome');
              } else {
                navigate('/dashboard');
              }
            }
          }, 1500);
        } else {
          console.error('[OAuth2Callback] ❌ Token exchange returned false');
          console.log('This usually indicates a network issue or Keycloak configuration problem');
          
          setStatus('error');
          setMessage('Authentication failed. Please check the console for details and try again.');
          setShowRetry(true);
          
          // Enhanced debugging instructions
          console.group('[OAuth2Callback] 🔧 Debugging Instructions');
          console.log('1. Check Keycloak connectivity:');
          console.log('   - Test URL: https://login.hostingmanager.in/realms/myschoolbuddies-realm');
          console.log('2. Verify redirect URI matches exactly:');
          console.log('   - Expected:', window.location.origin + '/auth/callback');
          console.log('   - Current:', window.location.href);
          console.log('3. Check browser network tab for failed requests');
          console.log('4. Verify client configuration in Keycloak admin console');
          console.groupEnd();
          
          setTimeout(() => navigate('/login'), 7000); // Longer delay for debugging
        }
      } catch (error) {
        console.error('[OAuth2Callback] ❌ Token exchange error:', error);
        setStatus('error');
        setMessage('Token exchange failed. Please try again.');
        setShowRetry(true);
        setTimeout(() => navigate('/login'), 5000);
      }
    };
    handleCallback();
  }, [searchParams, navigate, refreshAuth]);

  // Manual retry function
  const handleRetry = () => {
    setStatus('processing');
    setMessage('Retrying authentication...');
    setShowRetry(false);
    hasProcessed.current = false;
    
    // Force reload the component with current URL
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-xl shadow-xl p-8 text-center border">
        <div className="mb-6">
          {status === 'processing' && (
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}
          {status === 'success' && (
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          )}
          {status === 'error' && (
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          )}
          
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {status === 'processing' && 'Processing Login'}
            {status === 'success' && 'Login Successful'}
            {status === 'error' && 'Login Failed'}
          </h2>
          
          <p className="text-muted-foreground">
            {message}
          </p>
        </div>
        
        {status === 'processing' && (
          <div className="space-y-3">
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
            <p className="text-sm text-muted-foreground">
              Verifying your credentials...
            </p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="text-green-600 dark:text-green-400 text-sm">
            Redirecting to your dashboard...
          </div>
        )}
        
        {status === 'error' && (
          <div className="space-y-3">
            <div className="text-red-600 dark:text-red-400 text-sm">
              Redirecting to login page...
            </div>
            {showRetry && (
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Authentication
              </button>
            )}
            {debugInfo && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  Show Debug Information
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OAuth2Callback;