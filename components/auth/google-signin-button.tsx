'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';

interface GoogleSignInButtonProps {
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  fullWidth?: boolean;
  showIcon?: boolean;
  text?: string;
  loadingText?: string;
}

export function GoogleSignInButton({
  onError,
  disabled = false,
  className = '',
  variant = 'outline',
  size = 'default',
  fullWidth = true,
  showIcon = true,
  text = 'Continue with Google',
  loadingText = 'Signing in...'
}: GoogleSignInButtonProps) {
  const authContext = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component only renders on client to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render anything until mounted on client or if auth context is not available
  if (!isMounted || !authContext) {
    return (
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={true}
        className={`
          ${fullWidth ? 'w-full' : ''}
          ${className}
          relative
          transition-all
          duration-200
        `}
      >
        {showIcon && (
          <div className="mr-2 w-5 h-5 bg-gray-200 rounded animate-pulse" />
        )}
        {text}
      </Button>
    );
  }

  const { signInWithGoogle } = authContext;

  const handleGoogleSignIn = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isLoading || disabled) return;

    setIsLoading(true);
    
    try {
      await signInWithGoogle();
      // Navigation is handled in the auth context
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      const errorMessage = error.message || 'An unknown error occurred';
      
      // Call the onError callback if provided
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const GoogleIcon = () => (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleGoogleSignIn}
      disabled={isLoading || disabled}
      className={`
        ${fullWidth ? 'w-full' : ''}
        ${className}
        relative
        transition-all
        duration-200
        hover:shadow-md
        focus:ring-2
        focus:ring-blue-500
        focus:ring-offset-2
      `}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {loadingText}
        </>
      ) : (
        <>
          {showIcon && (
            <div className="mr-2">
              <GoogleIcon />
            </div>
          )}
          {text}
        </>
      )}
    </Button>
  );
}

// Alternative compact version for smaller spaces
export function GoogleSignInButtonCompact({
  onError,
  disabled = false,
  className = ''
}: Pick<GoogleSignInButtonProps, 'onError' | 'disabled' | 'className'>) {
  return (
    <GoogleSignInButton
      onError={onError}
      disabled={disabled}
      className={className}
      variant="outline"
      size="sm"
      fullWidth={false}
      text="Google"
      loadingText="..."
    />
  );
}

// Icon-only version
export function GoogleSignInButtonIcon({
  onError,
  disabled = false,
  className = ''
}: Pick<GoogleSignInButtonProps, 'onError' | 'disabled' | 'className'>) {
  return (
    <GoogleSignInButton
      onError={onError}
      disabled={disabled}
      className={className}
      variant="outline"
      size="icon"
      fullWidth={false}
      text=""
      loadingText=""
      showIcon={true}
    />
  );
}
