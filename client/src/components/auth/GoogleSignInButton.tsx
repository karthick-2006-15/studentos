import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface GoogleSignInButtonProps {
  mode?: 'signin' | 'signup';
  onError?: (error: string) => void;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  mode = 'signin',
  onError
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { googleLogin } = useAuthStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleCredentialResponse = async (response: any) => {
    if (!response || !response.credential) {
      onError?.('Google authentication failed: No credential received');
      return;
    }

    try {
      setIsLoading(true);
      await googleLogin(response.credential);
      navigate('/');
    } catch (err: any) {
      onError?.(err.message || 'Google authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevGoogleLogin = async () => {
    try {
      setIsLoading(true);
      // Simulate Google OAuth token in development mode
      const simulatedEmail = mode === 'signup' ? 'alex.student@nexus.io' : 'google.user@nexus.io';
      const simulatedName = mode === 'signup' ? 'Alex Chen' : 'Google Student';
      const devToken = `dev-mock-google-token:${simulatedEmail}:${simulatedName}`;
      await googleLogin(devToken);
      navigate('/');
    } catch (err: any) {
      onError?.(err.message || 'Google authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!clientId) return;

    const checkGsi = () => {
      const google = (window as any).google;
      if (google?.accounts?.id) {
        setIsGsiLoaded(true);
        try {
          google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false
          });

          if (containerRef.current) {
            containerRef.current.innerHTML = '';
            google.accounts.id.renderButton(containerRef.current, {
              type: 'standard',
              theme: 'filled_black',
              size: 'large',
              text: mode === 'signup' ? 'signup_with' : 'signin_with',
              shape: 'rectangular',
              width: containerRef.current.offsetWidth || 340,
              logo_alignment: 'left'
            });
          }
        } catch (err) {
          console.error('[Google Auth] Failed to initialize GIS:', err);
        }
      }
    };

    const google = (window as any).google;
    if (google?.accounts?.id) {
      checkGsi();
    } else {
      const interval = setInterval(() => {
        const g = (window as any).google;
        if (g?.accounts?.id) {
          clearInterval(interval);
          checkGsi();
        }
      }, 200);

      const timeout = setTimeout(() => clearInterval(interval), 5000);
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [clientId, mode]);

  // If Google Client ID is configured and GSI container rendered
  if (clientId) {
    return (
      <div className="w-full">
        <div ref={containerRef} className="w-full flex justify-center min-h-[42px]" />
        {isLoading && (
          <p className="text-[11px] text-zinc-400 text-center mt-2 animate-pulse font-mono">
            Signing in with Google...
          </p>
        )}
      </div>
    );
  }

  // Fallback Minimalist Button (Styled with Google G Logo)
  return (
    <button
      type="button"
      onClick={handleDevGoogleLogin}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white transition-all text-xs font-medium focus:outline-none focus:ring-1 focus:ring-zinc-600 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm group"
    >
      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
        />
      </svg>
      <span>
        {isLoading
          ? 'Connecting...'
          : mode === 'signup'
          ? 'Sign up with Google'
          : 'Continue with Google'}
      </span>
    </button>
  );
};
