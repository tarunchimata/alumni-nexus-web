import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/lib/auth';
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const OAuth2Callback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing login...');
  const [showRetry, setShowRetry] = useState(false);
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const handleCallback = async () => {
      try {
        const rawParams = new URLSearchParams(window.location.search);
        const code = rawParams.get('code') || searchParams.get('code');
        const error = rawParams.get('error') || searchParams.get('error');
        const state = rawParams.get('state') || searchParams.get('state');
        const error_description = rawParams.get('error_description') || searchParams.get('error_description');

        if (error) {
          console.error('[OAuth2Callback] OAuth2 error:', error, error_description);
          setStatus('error');
          setMessage(`Login failed: ${error}${error_description ? ` - ${error_description}` : ''}`);
          setShowRetry(true);
          setTimeout(() => navigate('/login'), 5000);
          return;
        }

        if (!code) {
          console.error('[OAuth2Callback] No authorization code received');
          setStatus('error');
          setMessage('No authorization code received.');
          setShowRetry(true);
          setTimeout(() => navigate('/login'), 5000);
          return;
        }

        setMessage('Exchanging authorization code...');
        const success = await authService.handleCallback(code, state || undefined);

        if (success) {
          setStatus('success');
          setMessage('Login successful! Redirecting...');
          await refreshAuth();
          
          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);

          // Keycloak disabled users can't authenticate, so if we're here, user is approved
          const userInfo = await authService.getUserInfo();
          const hasCompletedWelcome = userInfo?.id
            ? localStorage.getItem(`welcome_completed_${userInfo.id}`)
            : null;

          setTimeout(() => {
            if (!hasCompletedWelcome && userInfo?.id) {
              navigate('/dashboard/welcome');
            } else {
              navigate('/dashboard');
            }
          }, 1000);
        } else {
          setStatus('error');
          setMessage('Authentication failed. Please try again.');
          setShowRetry(true);
          setTimeout(() => navigate('/login'), 5000);
        }
      } catch (error) {
        console.error('[OAuth2Callback] Error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Authentication error');
        setShowRetry(true);
        setTimeout(() => navigate('/login'), 5000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, refreshAuth]);

  const handleRetry = () => {
    hasProcessed.current = false;
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
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          )}
          {status === 'error' && (
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          )}
          
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {status === 'processing' && 'Processing Login'}
            {status === 'success' && 'Login Successful'}
            {status === 'error' && 'Login Failed'}
          </h2>
          <p className="text-muted-foreground">{message}</p>
        </div>
        
        {status === 'processing' && (
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        )}
        
        {status === 'error' && showRetry && (
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default OAuth2Callback;
