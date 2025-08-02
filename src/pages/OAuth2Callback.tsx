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

        console.log('[OAuth2Callback] Received callback with:', { 
          hasCode: !!code, 
          hasError: !!error, 
          hasState: !!state,
          error: error,
          currentUrl: window.location.href
        });

        if (error) {
          setStatus('error');
          setMessage(`Login failed: ${error}`);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('No authorization code received');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        console.log('[OAuth2Callback] Processing authorization code...');
        
        // Handle the OAuth2 callback with state parameter
        const success = await oauth2Service.handleCallback(code, state || undefined);
        
        if (success) {
          setStatus('success');
          setMessage('Login successful! Redirecting...');
          
          console.log('[OAuth2Callback] Token exchange successful, refreshing auth...');
          
          // Refresh auth state to get user info
          await refreshAuth();
          
          console.log('[OAuth2Callback] Auth refreshed, redirecting to dashboard...');
          
          // Small delay to show success message
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        } else {
          setStatus('error');
          setMessage('Login failed. Please try again.');
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (error) {
        console.error('[OAuth2Callback] Error:', error);
        setStatus('error');
        setMessage(`An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setTimeout(() => navigate('/login'), 3000);
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