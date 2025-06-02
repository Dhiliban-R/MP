'use client';

import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import {
  onAuthStateChange,
  signIn as authSignIn,
  signOut as authSignOut,
  registerUser as authRegisterUser,
  sendEmailVerification as authSendEmailVerification
} from '@/lib/auth';
import { User, UserRole } from '@/lib/types/user.types';
import { useRouter } from 'next/navigation';
import { toast as toastSonner } from 'sonner';
import { signInWithGoogle as authSignInWithGoogle, handleGoogleRedirectResult } from "@/lib/auth";
import { initializeFcmForUser, onMessageListener } from '@/lib/fcm-service';
import { useToast } from '@/hooks/use-toast';
import { NavigationUtils } from '@/lib/navigation-utils';
import { isPublicRoute } from '@/lib/route-utils'; // Import from new utility
import { handleAuthError } from '@/lib/auth-error-handler';
import Cookies from 'js-cookie';

// Cookie configuration
const COOKIE_CONFIG = {
  expires: 7, // 7 days
  path: '/',
  secure: process.env.NODE_ENV === 'production', // Secure in production
  sameSite: 'strict' as const
};

// Define features that require email verification
export const FEATURES_REQUIRING_VERIFICATION = {
  DONATE: 'donate',
  CHAT: 'chat',
  RESERVE: 'reserve',
  PROFILE_EDIT: 'profile_edit',
  NOTIFICATIONS: 'notifications',
  DASHBOARD: 'dashboard'
} as const;

type FeatureRequiringVerification = typeof FEATURES_REQUIRING_VERIFICATION[keyof typeof FEATURES_REQUIRING_VERIFICATION];

// Grace period configuration in milliseconds
const GRACE_PERIOD_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  registerUser: (email: string, password: string, displayName: string, role: UserRole, organizationName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<User>;
  isAuthorized: (requiredRole: UserRole) => boolean;
  isEmailVerified: boolean;
  sendVerificationEmail: () => Promise<void>;
  requireEmailVerification: (redirectToVerification?: boolean) => boolean;
  checkEmailVerification: () => Promise<boolean>;
  canAccessFeature: (feature: FeatureRequiringVerification) => boolean;
  isFeatureAccessible: (feature: FeatureRequiringVerification, showWarning?: boolean) => boolean;
  getUnverifiedFeatureMessage: (feature: FeatureRequiringVerification) => string;
  lastVerificationEmailSent: Date | null;
  verificationCheckInProgress: boolean;
  isInGracePeriod: () => boolean;
}
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null); // Initialize with null
  const [role, setRole] = useState<UserRole | null>(null); // Track user role
  const [loading, setLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [lastVerificationEmailSent, setLastVerificationEmailSent] = useState<Date | null>(null);
  const [verificationCheckInProgress, setVerificationCheckInProgress] = useState(false);
  const [accountCreationTime, setAccountCreationTime] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Track if component is mounted to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle Google Sign-In redirect results on page load
  useEffect(() => {
    if (!isMounted) return;

    const handleRedirectResult = async () => {
      try {
        const user = await handleGoogleRedirectResult();
        if (user) {
          // Update user state and verification status
          setUser(user);
          setIsEmailVerified(user.emailVerified || false);

          // Set auth cookies for middleware
          setAuthCookies(user, user.emailVerified || false);

          // Show success message
          toastSonner.success('Welcome back!', {
            description: `Signed in with Google as ${user.displayName || user.email}`
          });

          // Handle navigation based on verification status
          if (user.emailVerified) {
            await NavigationUtils.navigateToDashboard(router, user.role, setLoading);
          } else {
            toastSonner.warning(
              'Email verification required',
              { description: 'Please verify your email address to access all features.' }
            );

            // Navigate to verification page using robust navigation
            await NavigationUtils.navigateTo(router, '/profile/verify-email', {
              showToast: false,
              fallbackToWindow: true
            });
          }
        }
      } catch (error: any) {
        console.error('Error handling Google redirect result:', error);

        // Only show error if it's not a "no redirect result" case
        if (error.message && !error.message.includes('No redirect result')) {
          toastSonner.error('Google Sign-In Failed', {
            description: error.message || 'Failed to complete Google sign-in. Please try again.'
          });
        }
      }
    };

    // Wrap in try-catch to prevent runtime errors
    try {
      handleRedirectResult();
    } catch (error) {
      console.error('Error in Google redirect handler:', error);
    }
  }, [isMounted, router]);

  // Set auth cookies based on user state
  const setAuthCookies = (user: User | null, isVerified: boolean) => {
    if (user) {
      // Set auth token cookie (in a real app, this would be a JWT or session token)
      Cookies.set('auth_token', user.uid, COOKIE_CONFIG);
      
      // Set email verification status cookie
      Cookies.set('email_verified', isVerified ? 'true' : 'false', COOKIE_CONFIG);
      
      // Store account creation time if available
      if (user.metadata?.creationTime) {
        Cookies.set('account_creation_time', user.metadata.creationTime, COOKIE_CONFIG);
      }
      
      // Store last verification time if verified
      if (isVerified) {
        Cookies.set('verification_time', new Date().toISOString(), COOKIE_CONFIG);
      }
    } else {
      // Clear cookies when no user
      Cookies.remove('auth_token');
      Cookies.remove('email_verified');
      Cookies.remove('verification_time');
      Cookies.remove('account_creation_time');
    }
  };

  // Check if user is within grace period for email verification
  const isInGracePeriod = (): boolean => {
    if (!user || isEmailVerified) return false;
    
    // If we have account creation time from metadata, use it
    if (accountCreationTime) {
      const timeSinceCreation = Date.now() - accountCreationTime.getTime();
      return timeSinceCreation < GRACE_PERIOD_DURATION;
    }
    
    // Fallback to checking creation time from cookies
    const creationTimeStr = Cookies.get('account_creation_time');
    if (creationTimeStr) {
      try {
        const creationTime = new Date(creationTimeStr);
        const timeSinceCreation = Date.now() - creationTime.getTime();
        return timeSinceCreation < GRACE_PERIOD_DURATION;
      } catch (e) {
        console.error('Error parsing account creation time:', e);
      }
    }
    
    return false;
  };

  // Feature access control based on verification status
  const canAccessFeature = (feature: FeatureRequiringVerification): boolean => {
    if (!user) return false;
    if (isEmailVerified) return true;

    const inGracePeriod = isInGracePeriod();
    
    // Special cases where unverified users might have limited access
    switch (feature) {
      case FEATURES_REQUIRING_VERIFICATION.PROFILE_EDIT:
        return true; // Always allow profile editing so users can update their info
      case FEATURES_REQUIRING_VERIFICATION.NOTIFICATIONS:
        return true; // Always allow notifications for verification reminders
      case FEATURES_REQUIRING_VERIFICATION.DASHBOARD:
        return inGracePeriod; // Allow dashboard access during grace period
      default:
        return false;
    }
  };
  
  // Helper function to check feature access and optionally show a warning
  const isFeatureAccessible = (feature: FeatureRequiringVerification, showWarning: boolean = true): boolean => {
    const canAccess = canAccessFeature(feature);
    
    if (!canAccess && showWarning && user) {
      const message = getUnverifiedFeatureMessage(feature);
      toastSonner.warning('Verification Required', { description: message });
      
      // For certain features, redirect to verification page
      if ([
        FEATURES_REQUIRING_VERIFICATION.DONATE,
        FEATURES_REQUIRING_VERIFICATION.RESERVE,
        FEATURES_REQUIRING_VERIFICATION.CHAT
      ].includes(feature as any)) {
        NavigationUtils.navigateTo(router, '/profile/verify-email', {
          showToast: false,
          fallbackToWindow: true
        });
      }
    }
    
    return canAccess;
  };

  // Get appropriate message for unverified users trying to access features
  const getUnverifiedFeatureMessage = (feature: FeatureRequiringVerification): string => {
    const inGracePeriod = isInGracePeriod();
    const gracePeriodMsg = inGracePeriod 
      ? " You're currently in a grace period, but please verify soon to maintain access."
      : " Your grace period has expired. Please verify now to regain access.";
      
    switch (feature) {
      case FEATURES_REQUIRING_VERIFICATION.DONATE:
        return 'Email verification is required to create donations.' + (!inGracePeriod ? ' Please verify your email to continue.' : gracePeriodMsg);
      case FEATURES_REQUIRING_VERIFICATION.CHAT:
        return 'Please verify your email to access the chat feature.' + (!inGracePeriod ? ' Verification is required for security reasons.' : gracePeriodMsg);
      case FEATURES_REQUIRING_VERIFICATION.RESERVE:
        return 'Email verification is required to reserve donations.' + (!inGracePeriod ? ' This helps ensure the legitimacy of reservations.' : gracePeriodMsg);
      case FEATURES_REQUIRING_VERIFICATION.PROFILE_EDIT:
        return 'Some profile features require email verification.' + (!inGracePeriod ? ' Please verify to access all profile settings.' : gracePeriodMsg);
      case FEATURES_REQUIRING_VERIFICATION.NOTIFICATIONS:
        return 'Verify your email to receive all notifications.' + (!inGracePeriod ? ' Full notification access requires verification.' : gracePeriodMsg);
      case FEATURES_REQUIRING_VERIFICATION.DASHBOARD:
        return 'Full dashboard access requires email verification.' + (!inGracePeriod ? ' Please verify your email to continue using all features.' : gracePeriodMsg);
      default:
        return 'This feature requires email verification.' + (!inGracePeriod ? ' Please verify your email to gain full access.' : gracePeriodMsg);
    }
  };

  useEffect(() => {
    // Only run auth state listener when component is mounted
    if (!isMounted) return;

    // Set loading to true when starting the auth check
    setLoading(true);

    // Add a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
    }, 5000); // 5 second timeout

    try {
      const unsubscribe = onAuthStateChange(async (firebaseUser) => {
        try {
          // Clear the timeout since we got a response
          clearTimeout(loadingTimeout);
          if (firebaseUser) {
            const isVerified = firebaseUser.emailVerified || false;
            const creationTime = firebaseUser.metadata?.creationTime ? new Date(firebaseUser.metadata.creationTime) : null;

            setUser(firebaseUser);
            setIsEmailVerified(isVerified);
            setAccountCreationTime(creationTime);

            setAuthCookies(firebaseUser, isVerified);

            // Update email verification status in Firestore if needed
            if (firebaseUser.uid) {
              try {
                // Use static imports to avoid circular dependencies
                const { updateEmailVerificationStatus } = await import('../lib/auth-utils');
                await updateEmailVerificationStatus(firebaseUser.uid, firebaseUser.emailVerified);
              } catch (firestoreError) {
                console.error('Error updating email verification status in Firestore:', firestoreError);
              }
            }
            setLoading(false);
          } else {
            // No user is logged in
            setUser(null);
            setIsEmailVerified(false);
            setAccountCreationTime(null);

            // Clear auth cookies
            setAuthCookies(null, false);

            setLoading(false);
          }
        } catch (authStateError) {
          console.error('Error in auth state change handler:', authStateError);
          setLoading(false);
        }
      });

      // Return cleanup function to unsubscribe from auth state changes
      return () => {
        clearTimeout(loadingTimeout);
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up auth state listener:', error);
      setLoading(false);
    }
  }, [isMounted]);

  useEffect(() => {
    if (user) {
      // Set user role directly from the user object
      setRole(user.role);
    }
  }, [user]);

  const handleSignIn = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      
      // Call the authentication service to sign in
      const user = await authSignIn(email, password);
      
      // Update user state and verification status
      setUser(user);
      setIsEmailVerified(user.emailVerified || false);

      // Set auth cookies for middleware
      setAuthCookies(user, user.emailVerified || false);

      // Show success message
      toastSonner.success('Welcome back!', {
        description: `Signed in as ${user.displayName || user.email}`
      });

      // Handle navigation based on verification status
      if (user.emailVerified) {
        await NavigationUtils.navigateToDashboard(router, user.role, setLoading);
      } else {
        toastSonner.warning(
          'Email verification required',
          { description: 'Please check your inbox and verify your email address to access all features.' }
        );

        // Navigate to verification page using robust navigation
        await NavigationUtils.navigateTo(router, '/profile/verify-email', {
          showToast: false,
          fallbackToWindow: true
        });
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      // Provide specific error messages based on the error code
      if (error.code === 'auth/invalid-credential' || error.message?.includes('auth/invalid-credential')) {
        toastSonner.error('Invalid credentials', { 
          description: 'Please check your email and password and try again.' 
        });
      } else if (error.code === 'auth/too-many-requests' || error.message?.includes('auth/too-many-requests')) {
        toastSonner.error('Too many failed attempts', { 
          description: 'Account temporarily locked due to too many failed login attempts. Try again later or reset your password.' 
        });
      } else if (error.code === 'auth/network-request-failed' || error.message?.includes('auth/network-request-failed')) {
        toastSonner.error('Network error', { 
          description: 'Please check your internet connection and try again.' 
        });
      } else if (error.code === 'auth/user-not-found' || error.message?.includes('auth/user-not-found')) {
        toastSonner.error('User not found', { 
          description: 'No account exists with this email address. Please check the email or register for a new account.' 
        });
      } else if (error.code === 'auth/wrong-password' || error.message?.includes('auth/wrong-password')) {
        toastSonner.error('Incorrect password', { 
          description: 'The password you entered is incorrect. Please try again or reset your password.' 
        });
      } else {
        toastSonner.error('Failed to sign in', { 
          description: 'Please check your credentials and try again.' 
        });
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignInWithGoogle = async (): Promise<User> => {
    try {
      setLoading(true);
      
      // Call the authentication service to sign in with Google
      const user = await authSignInWithGoogle();
      
      // Update user state and verification status
      setUser(user);
      setIsEmailVerified(user.emailVerified || false);

      // Set auth cookies for middleware
      setAuthCookies(user, user.emailVerified || false);

      // Show success message
      toastSonner.success('Welcome back!', {
        description: `Signed in with Google as ${user.displayName || user.email}`
      });

      // Handle navigation based on verification status
      if (user.emailVerified) {
        await NavigationUtils.navigateToDashboard(router, user.role, setLoading);
      } else {
        toastSonner.warning(
          'Email verification required',
          { description: 'Please verify your email address to access all features.' }
        );

        // Navigate to verification page using robust navigation
        await NavigationUtils.navigateTo(router, '/profile/verify-email', {
          showToast: false,
          fallbackToWindow: true
        });
      }
      
      return user;
    } catch (error: any) {
      console.error('Sign in with Google error:', error);

      // Use the comprehensive error handler
      const authError = handleAuthError(error);

      toastSonner.error('Google Sign-In Failed', {
        description: authError.userFriendlyMessage
      });

      throw new Error(authError.userFriendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      // Set loading state
      setLoading(true);
      
      // Call the authentication service to sign out
      await authSignOut();
      
      // Clear user state
      setUser(null);
      setIsEmailVerified(false);
      
      // Clear auth cookies
      Cookies.remove('auth_token');
      Cookies.remove('email_verified');
      
      // Navigate to home page using robust navigation
      await NavigationUtils.navigateTo(router, '/', {
        showToast: true,
        toastMessage: 'Signed out successfully',
        fallbackToWindow: true
      });
    } catch (error) {
      console.error('Sign out error:', error);
      toastSonner.error('Failed to sign out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
    organizationName?: string
  ): Promise<void> => {
    try {
      setLoading(true);
      
      // Call the authentication service to register the user
      const user = await authRegisterUser(email, password, displayName, role, organizationName);
      
      // Update user state, verification status, and account creation time
      setUser(user);
      setIsEmailVerified(user.emailVerified || false);
      setAccountCreationTime(user.metadata?.creationTime ? new Date(user.metadata.creationTime) : null);

      // Set auth cookies for middleware
      setAuthCookies(user, user.emailVerified || false);

      // Show success message
      toastSonner.success('Registration successful! Welcome to FDMS.', {
        description: 'Please check your email to verify your account. You have 24 hours to verify your email to maintain full access.'
      });
      
      // Navigate based on verification status
      if (user.emailVerified) {
        // If email is already verified (unlikely for new registrations), redirect to dashboard
        await NavigationUtils.navigateToDashboard(router, user.role, setLoading);
      } else {
        // Navigate to verification page
        await NavigationUtils.navigateTo(router, '/profile/verify-email', {
          showToast: false,
          fallbackToWindow: true
        });
      }
      
      // Do not return user; just return void
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Provide specific error messages based on the error
      if (error.code === 'auth/email-already-in-use' || error.message?.includes('email-already-in-use')) {
        toastSonner.error('Email already in use', {
          description: 'An account with this email already exists. Please use a different email or try logging in.'
        });
      } else if (error.code === 'auth/invalid-email' || error.message?.includes('invalid-email')) {
        toastSonner.error('Invalid email', {
          description: 'Please provide a valid email address.'
        });
      } else if (error.code === 'auth/weak-password' || error.message?.includes('weak-password')) {
        toastSonner.error('Weak password', {
          description: 'Password should be at least 6 characters long.'
        });
      } else if (error.code === 'auth/network-request-failed' || error.message?.includes('network-request-failed')) {
        toastSonner.error('Network error', {
          description: 'Please check your internet connection and try again.'
        });
      } else {
        toastSonner.error('Registration failed', {
          description: 'Please try again or contact support if the problem persists.'
        });
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const isAuthorized = (requiredRole: UserRole) => {
    return role === requiredRole;
  };
  
  /**
   * Check if email verification is required for the current route
   * and optionally redirect to verification page
   */
  const requireEmailVerification = (redirectToVerification: boolean = true) => {
    // Get current path - only use window.location when available
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
    
    // Skip check for public routes
    if (isPublicRoute(pathname)) {
      return true;
    }
    
    // If user is verified, allow access
    if (isEmailVerified) {
      return true;
    }
    
    // Check if user is in grace period
    const inGracePeriod = isInGracePeriod();
    if (inGracePeriod) {
      // Show warning but allow access
      toastSonner.warning('Limited access mode', {
        description: 'You have limited access during the grace period. Please verify your email soon to maintain full access.'
      });
      return true;
    }
    
    // If user exists but is not verified and outside grace period, handle redirect
    if (user && !isEmailVerified && redirectToVerification) {
      toastSonner.warning('Email verification required', {
        description: 'Please verify your email address to access this feature'
      });
      
      NavigationUtils.navigateTo(router, '/profile/verify-email', {
        replace: true,
        fallbackToWindow: true
      });
    }
    
    // Return false to indicate verification is required
    return false;
  };
  
  /**
:start_line:605
-------
   * Force check email verification status by calling the API route
   */
  const checkEmailVerification = async (): Promise<boolean> => {
    if (!user) return false;
    
    setVerificationCheckInProgress(true);
    try {
      // Get the ID token for the current user
      const idToken = await user.getIdToken();

      // Call the new API route to check verification status
      const response = await fetch('/api/auth/check-verification-status', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch verification status');
      }

      const data = await response.json();
      const isVerified = data.emailVerified || false;

      // If verification status changed, update state and cookies
      if (isVerified !== isEmailVerified) {
        setIsEmailVerified(isVerified);
        
        // Update cookies with verification time
        setAuthCookies(user, isVerified);
        
        // Update user object
        const updatedUser = {...user, emailVerified: isVerified};
        setUser(updatedUser);
        
        // Update Firestore with verification time
        try {
          const { doc, updateDoc } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase');
          await updateDoc(doc(db, 'users', user.uid), {
            emailVerified: isVerified,
            verificationTime: isVerified ? new Date().toISOString() : null
          });
        } catch (firestoreError) {
          console.error('Error updating email verification in Firestore:', firestoreError);
        }
        
        // Show success message if newly verified
        if (isVerified) {
          toast({
            title: "Email Verified",
            description: "Your email has been verified successfully. You now have full access to all features.",
            variant: "default",
          });
        }
      }
      
      return isVerified;
    } catch (error: any) {
      console.error('Error checking email verification:', error);
      toast({
        title: "Verification Check Failed",
        description: error.message || "We couldn't check your verification status. Please try again later.",
        variant: "destructive",
      });
      return false; // Return false on error
    } finally {
      setVerificationCheckInProgress(false);
    }
  };
  
  const handleSendVerificationEmail = async () => {
    if (!user) throw new Error('No user is currently logged in');
    
    // Check if we're within the rate limit (1 email per minute)
    if (lastVerificationEmailSent && Date.now() - lastVerificationEmailSent.getTime() < 60000) {
      toastSonner.error('Rate limit exceeded', {
        description: 'Please wait at least 1 minute before requesting another verification email.'
      });
      throw new Error('Please wait before requesting another verification email');
    }
    
    try {
      // Get the current Firebase user
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        await authSendEmailVerification(currentUser);
        
        // Update last sent time
        setLastVerificationEmailSent(new Date());
        
        // Also store in Firestore for persistence
        try {
          const { doc, updateDoc } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase');
          await updateDoc(doc(db, 'users', user.uid), {
            lastVerificationEmailSent: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error updating last verification email time:', error);
        }
        
        toastSonner.success('Verification email sent', {
          description: 'Please check your inbox and follow the link to verify your email address.'
        });
        
      } else {
        throw new Error('No user is currently logged in');
      }
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/too-many-requests') {
        toastSonner.error('Too many requests', {
          description: 'Please wait before requesting another verification email.'
        });
      } else {
        toastSonner.error('Failed to send verification email', {
          description: 'Please try again later or contact support.'
        });
      }
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn: handleSignIn,
    signOut: handleSignOut,
    registerUser: handleRegister,
    signInWithGoogle: handleSignInWithGoogle,
    isAuthorized,
    isEmailVerified,
    sendVerificationEmail: handleSendVerificationEmail,
    requireEmailVerification,
    checkEmailVerification,
    canAccessFeature,
    isFeatureAccessible,
    getUnverifiedFeatureMessage,
    lastVerificationEmailSent,
    verificationCheckInProgress,
    isInGracePeriod
  };

  useEffect(() => {
    const setupNotifications = async () => {
      if (user && (user.emailVerified || isInGracePeriod())) {
        try {
          // Only initialize FCM for verified users
          console.log('Setting up notifications for verified user:', user.uid);

          // Initialize FCM for the current user using the user object
          const success = await initializeFcmForUser(user);
          if (success) {
            console.log('FCM initialized successfully for user:', user.uid);

            // Set up foreground message handler
            onMessageListener().then((payload) => {
              // Assert the payload type to access notification properties
              const notificationPayload = payload as {
                notification?: { title?: string; body?: string };
                data?: Record<string, string>;
              };

              console.log('Notification received:', notificationPayload);

              // Show toast notification
              toast({
                title: notificationPayload.notification?.title || 'New Notification',
                description: notificationPayload.notification?.body || 'You have a new message.',
                variant: (notificationPayload.data?.type === 'error' ? 'destructive' :
                          notificationPayload.data?.type === 'warning' ? 'default' :
                          'default'),
              });

              // Handle navigation if link is provided
              if (notificationPayload.data?.link) {
                // Use router to navigate to the link
                // We don't navigate automatically to avoid disrupting user experience
                // Instead, clicking the toast could navigate
              }
            }).catch((error) => {
              console.error('Error setting up message listener:', error);
            });
          } else {
            console.log('FCM initialization completed without token (normal in development)');
          }
        } catch (error: any) {
          console.warn('FCM setup failed (non-critical):', error.message);

          // Only show error toast in production or if it's a critical error
          if (process.env.NODE_ENV === 'production') {
            toast({
              title: "Notification Setup",
              description: "Push notifications may not work properly. You can still use the app normally.",
              variant: "destructive",
              duration: 5000,
            });
          }
        }
      } else if (user && !user.emailVerified) {
        console.log('User email not verified, skipping FCM setup');
      }
    };

    setupNotifications();
  }, [user, toast]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Export the useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};