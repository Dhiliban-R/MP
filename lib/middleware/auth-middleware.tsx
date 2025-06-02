'use client';


import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { NavigationUtils } from '@/lib/navigation-utils';
import { toast } from 'sonner';
import { isPublicRoute } from '@/lib/route-utils'; // Import from new utility

/**
 * Higher-order component for client-side route protection based on email verification
 */
export function withEmailVerification(Component: React.ComponentType<any>) {
  return function ProtectedRoute(props: any) {
    const authContext = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    // Handle null auth context (SSR or before provider is mounted)
    if (!authContext) {
      return <div className="flex items-center justify-center min-h-screen">Loading authentication...</div>;
    }

    const { user, loading, isEmailVerified } = authContext;

    // Allow access to public routes
    if (isPublicRoute(pathname || '')) {
      return <Component {...props} />;
    }

    // Handle loading state
    if (loading) {
      return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    // If no user, redirect to login
    if (!user) {
      // Use setTimeout to avoid React hydration issues
      setTimeout(() => {
        toast.error('Please sign in to access this page');
        NavigationUtils.navigateTo(router, '/auth/login', {
          replace: true,
          fallbackToWindow: true
        });
      }, 0);
      
      // Return null or a loading state
      return <div className="flex items-center justify-center min-h-screen">Redirecting to login...</div>;
    }

    // If user is not verified and trying to access a protected route
    if (user && !isEmailVerified && !isPublicRoute(pathname || '')) {
      // Use setTimeout to avoid React hydration issues
      setTimeout(() => {
        toast.warning('Please verify your email to access this feature', {
          description: 'Check your inbox for a verification link or request a new one'
        });
        NavigationUtils.navigateTo(router, '/profile/verify-email', {
          replace: true,
          fallbackToWindow: true
        });
      }, 0);
      
      // Return null or a loading state
      return <div className="flex items-center justify-center min-h-screen">Redirecting to email verification...</div>;
    }

    // If all checks pass, render the component
    return <Component {...props} />;
  };
}

/**
 * Middleware function for protecting API routes based on email verification
 */
export async function verifyEmailForApiRoute(
  req: Request,
  handler: (req: Request) => Promise<Response>,
  options: { 
    requireAuth?: boolean;
    requireVerification?: boolean; 
  } = {}
): Promise<Response> {
  const { requireAuth = true, requireVerification = true } = options;
  const url = new URL(req.url);

  // Check if it's a public API route
  if (isPublicRoute(url.pathname)) {
    return handler(req);
  }

  try {
    // Get user from request (implementation depends on your auth setup)
    // This is a simplified example and should be adapted to your specific auth implementation
    const { getCurrentUser } = await import('@/lib/auth');
    const user = await getCurrentUser();

    // If authentication is required but no user is found
    if (requireAuth && !user) {
      return new Response(JSON.stringify({ 
        error: 'Authentication required' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // If email verification is required but user's email is not verified
    if (requireVerification && user && !user.emailVerified) {
      return new Response(JSON.stringify({ 
        error: 'Email verification required',
        verificationNeeded: true 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // If all checks pass, process the request
    return handler(req);
  } catch (error) {
    console.error('Error in API route authentication:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Authentication error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Helper hook to use email verification in components
 */
export function useEmailVerification() {
  const authContext = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Handle null auth context
  if (!authContext) {
    return {
      isVerified: false,
      checkVerification: () => false,
      sendVerificationEmail: async () => {},
      isPublicRoute: isPublicRoute(pathname || '')
    };
  }

  const { user, isEmailVerified, sendVerificationEmail } = authContext;

  const checkVerification = () => {
    if (!user) {
      toast.error('Please sign in to access this feature');
      NavigationUtils.navigateTo(router, '/auth/login', {
        replace: true
      });
      return false;
    }

    if (!isEmailVerified) {
      toast.warning('Please verify your email to access this feature', {
        description: 'Check your inbox for a verification link or request a new one'
      });
      NavigationUtils.navigateTo(router, '/profile/verify-email', {
        replace: true
      });
      return false;
    }

    return true;
  };

  return {
    isVerified: isEmailVerified,
    checkVerification,
    sendVerificationEmail,
    isPublicRoute: isPublicRoute(pathname || '')
  };
}

