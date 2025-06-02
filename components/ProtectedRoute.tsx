'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/types/user.types';
import { toast } from 'sonner';
import { NavigationUtils } from '@/lib/navigation-utils';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requireEmailVerification?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireEmailVerification = false
}) => {
  const authContext = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Handle null auth context (SSR or before provider is mounted)
  if (!authContext) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-center text-gray-600">
          Loading authentication...
        </p>
      </div>
    );
  }

  const { user, loading, isEmailVerified } = authContext;

  useEffect(() => {
    // Only run this effect if loading is complete
    if (!loading) {
      const handleRedirect = async (path: string, message: string, variant: 'error' | 'warning' = 'error') => {
        // Set redirecting state to prevent flashing of protected content
        setIsRedirecting(true);
        
        // Show appropriate toast message
        if (variant === 'error') {
          toast.error(message);
        } else {
          toast.warning(message);
        }
        
        // Use robust navigation with a small delay to show toast
        setTimeout(async () => {
          await NavigationUtils.navigateTo(router, path, {
            showToast: false,
            fallbackToWindow: true
          });
        }, 100);
      };

      const checkAccess = () => {
        // Case 1: User is not logged in
        if (!user) {
          handleRedirect('/auth/login', 'You need to be logged in to access this page.');
          return;
        }
        
        // Case 2: User doesn't have the required role
        if (allowedRoles && !allowedRoles.includes(user.role)) {
          // Redirect to appropriate dashboard based on user's actual role
          const redirectPath = NavigationUtils.getDashboardPath(user.role);
          handleRedirect(redirectPath, 'You do not have permission to access this page.');
          return;
        }
        
        // Case 3: Email verification is required but not verified
        if (requireEmailVerification && !isEmailVerified) {
         handleRedirect(
            '/profile/verify-email', 
            'Please verify your email address to access this page.', 
            'warning'
          );
          return;
        }
        
        // If we reach here, user has access to the protected route
        setIsRedirecting(false);
      };
      
      // Execute access check
      checkAccess();
    }
  }, [user, loading, allowedRoles, router, isEmailVerified, requireEmailVerification, toast]);
  
  // Show loading or redirecting state
  if (loading || isRedirecting || 
      !user || 
      (allowedRoles && !allowedRoles.includes(user.role)) ||
      (requireEmailVerification && !isEmailVerified)) {
    
    // Determine the appropriate message based on the current state
    let message = 'Checking authentication...';
    
    if (!loading && isRedirecting) {
      message = 'Redirecting to the appropriate page...';
    } else if (!loading && !user) {
      message = 'Authentication required...';
    } else if (!loading && allowedRoles && user && !allowedRoles.includes(user.role)) {
      message = 'Checking permissions...';
    } else if (!loading && requireEmailVerification && user && !isEmailVerified) {
      message = 'Email verification required...';
    }
    
    // Show a loading spinner with appropriate message
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-center text-gray-600">
          {message}
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
