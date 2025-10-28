import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/utils/supabase/client';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the code from URL parameters
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const error = params.get('error');
        const errorDescription = params.get('error_description');

        // Check for errors from the OAuth provider
        if (error) {
          setStatus('error');
          setErrorMessage(errorDescription || error);
          toast({
            title: 'Authentication failed',
            description: errorDescription || error,
            variant: 'destructive',
          });
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        // Exchange the code for a session
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            setStatus('error');
            setErrorMessage(exchangeError.message);
            toast({
              title: 'Authentication failed',
              description: exchangeError.message,
              variant: 'destructive',
            });
            setTimeout(() => navigate('/'), 3000);
            return;
          }

          if (data.session) {
            setStatus('success');
            toast({
              title: 'Welcome!',
              description: 'You have successfully signed in with Google.',
            });
            // Redirect to dashboard after successful login
            setTimeout(() => navigate('/'), 1000);
            return;
          }
        }

        // If we get here without code or session, something went wrong
        setStatus('error');
        setErrorMessage('No authentication code received');
        setTimeout(() => navigate('/'), 3000);
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setStatus('error');
        setErrorMessage(err.message || 'An unexpected error occurred');
        toast({
          title: 'Error',
          description: err.message || 'An unexpected error occurred',
          variant: 'destructive',
        });
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <h2 className="text-2xl font-bold">Completing sign in...</h2>
            <p className="text-muted-foreground">Please wait while we authenticate your account</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="h-12 w-12 mx-auto rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">Success!</h2>
            <p className="text-muted-foreground">Redirecting to dashboard...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="h-12 w-12 mx-auto rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">Authentication Failed</h2>
            <p className="text-muted-foreground">{errorMessage}</p>
            <p className="text-sm text-muted-foreground">Redirecting to home page...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
