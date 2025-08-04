import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { oauth2Service } from '@/lib/oauth2';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const OAuth2Callback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing login...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const state = searchParams.get('state');

        // Enhanced debug logging
        const debugInfo = {
          timestamp: new Date().toISOString(),
          hasCode: !!code,
          codeLength: code?.length || 0,
          hasError: !!error,
          hasState: !!state,
          stateLength: state?.length || 0,
          error: error,
          errorDescription: searchParams.get('error_description'),
          state: state?.substring(0, 20) + '...',
          code: code?.substring(0, 30) + '...',
          currentUrl: window.location.href,
          origin: window.location.origin,
          hostname: window.location.hostname,
          protocol: window.location.protocol,
          redirectPath: window.location.pathname,
          allSearchParams: Object.fromEntries(searchParams.entries()),
          userAgent: navigator.userAgent.substring(0, 100)
        };

        console.group('[OAuth2Callback] Callback Processing Start');
        console.log('Debug Info:', debugInfo);
        console.log('Raw URL:', window.location.href);
        console.groupEnd();

        if (error) {
          console.error('[OAuth2Callback] OAuth2 error received:', {
            error,
            errorDescription: searchParams.get('error_description'),
            allParams: Object.fromEntries(searchParams.entries())
          });
          
          setStatus('error');
          const errorDesc = searchParams.get('error_description');
          setMessage(`Login failed: ${error}${errorDesc ? ` - ${errorDesc}` : ''}`);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (!code) {
          console.error('[OAuth2Callback] No authorization code received');
          console.log('Available search params:', Object.fromEntries(searchParams.entries()));
          
          setStatus('error');
          setMessage('No authorization code received from login provider. Please try logging in again.');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        console.log('[OAuth2Callback] Starting token exchange process...');
        setMessage('Exchanging authorization code for tokens...');
        
        // Handle the OAuth2 callback with state parameter
        const success = await oauth2Service.handleCallback(code, state || undefined);
        
        if (success) {
          console.log('[OAuth2Callback] ✅ Token exchange successful!');
          setStatus('success');
          setMessage('Login successful! Loading your profile...');
          
          console.log('[OAuth2Callback] Refreshing authentication state...');
          
          // Refresh auth state to get user info
          await refreshAuth();
          
          console.log('[OAuth2Callback] ✅ Authentication state refreshed, redirecting...');
          setMessage('Welcome! Redirecting to dashboard...');
          
          // Small delay to show success message
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        } else {
          console.error('[OAuth2Callback] ❌ Token exchange returned false');
          console.log('This usually indicates a network issue or backend configuration problem');
          
          setStatus('error');
          setMessage('Authentication failed. Please check the browser console for details and try again.');
          
          // Log debugging instructions for user
          console.group('[OAuth2Callback] Debugging Instructions');
          console.log('1. Check if backend is accessible:');
          console.log('   - Open browser console');
          console.log('   - Run: fetch("/api/oauth2/health").then(r => r.json()).then(console.log)');
          console.log('2. Check network tab for failed requests');
          console.log('3. Verify environment variables are correct');
          console.groupEnd();
          
          setTimeout(() => navigate('/login'), 5000); // Longer delay for debugging
        }
      } catch (error) {
        console.group('[OAuth2Callback] ❌ Callback Error');
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : 'Unknown',
          cause: error instanceof Error ? (error as any).cause : undefined
        });
        console.log('Current URL:', window.location.href);
        console.log('Search params:', Object.fromEntries(searchParams.entries()));
        console.groupEnd();
        
        setStatus('error');
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setMessage(`Authentication error: ${errorMessage}`);
        
        setTimeout(() => navigate('/login'), 5000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, refreshAuth]);

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
          <div className="text-red-600 dark:text-red-400 text-sm">
            Redirecting to login page...
          </div>
        )}
      </div>
    </div>
  );
};

export default OAuth2Callback;