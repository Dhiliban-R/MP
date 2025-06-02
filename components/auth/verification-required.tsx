'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { VerificationStatus } from './verification-status';
import { FEATURES_REQUIRING_VERIFICATION } from '@/contexts/auth-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface VerificationRequiredProps {
  children: ReactNode;
  feature: keyof typeof FEATURES_REQUIRING_VERIFICATION;
  fallback?: ReactNode;
  showCard?: boolean;
  enforceVerification?: boolean;
}

/**
 * VerificationRequired component
 * 
 * Wraps content that requires email verification. If the user is not verified,
 * it shows a verification prompt instead of the protected content.
 * 
 * @param children - The protected content to display when verified
 * @param feature - The feature requiring verification (from FEATURES_REQUIRING_VERIFICATION)
 * @param fallback - Optional custom content to show when verification is required
 * @param showCard - Whether to wrap the verification prompt in a card (default: true)
 * @param enforceVerification - Whether to strictly enforce verification (default: true)
 */
export function VerificationRequired({
  children,
  feature,
  fallback,
  showCard = true,
  enforceVerification = true
}: VerificationRequiredProps) {
  const authContext = useAuth();

  if (!authContext) {
    return <div>Loading...</div>;
  }

  const {
    user,
    isEmailVerified,
    canAccessFeature,
    getUnverifiedFeatureMessage
  } = authContext;

  // If no user is logged in, return null
  if (!user) return null;

  // If user is verified or feature access is allowed, show the protected content
  if (isEmailVerified || (!enforceVerification && canAccessFeature(FEATURES_REQUIRING_VERIFICATION[feature]))) {
    return <>{children}</>;
  }

  // If custom fallback is provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default verification required message
  const verificationPrompt = (
    <>
      <Alert className="mb-4 bg-yellow-50 border-yellow-200">
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
        <AlertTitle>Verification Required</AlertTitle>
        <AlertDescription>
          {getUnverifiedFeatureMessage(FEATURES_REQUIRING_VERIFICATION[feature])}
        </AlertDescription>
      </Alert>
      <VerificationStatus
        showResendButton
        variant="default"
        className="mt-4"
      />
    </>
  );

  // Wrap in card if showCard is true
  if (showCard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Verification Required</CardTitle>
          <CardDescription>
            Please verify your email address to access this feature
          </CardDescription>
        </CardHeader>
        <CardContent>
          {verificationPrompt}
        </CardContent>
      </Card>
    );
  }

  // Return without card wrapper
  return verificationPrompt;
}

/**
 * Higher-order component version of VerificationRequired
 * 
 * Wraps a component to enforce email verification requirements
 * 
 * @param Component - The component to wrap
 * @param feature - The feature requiring verification
 * @param options - Additional options (fallback, showCard, enforceVerification)
 */
export function withVerificationRequired<P extends object>(
  Component: React.ComponentType<P>,
  feature: keyof typeof FEATURES_REQUIRING_VERIFICATION,
  options: Omit<VerificationRequiredProps, 'children' | 'feature'> = {}
) {
  return function WrappedComponent(props: P) {
    return (
      <VerificationRequired
        feature={feature}
        {...options}
      >
        <Component {...props} />
      </VerificationRequired>
    );
  };
}

/**
 * Hook to check if a feature is accessible based on verification status
 * 
 * @param feature - The feature to check access for
 * @returns Object containing access status and helper functions
 */
export function useVerificationRequired(feature: keyof typeof FEATURES_REQUIRING_VERIFICATION) {
  const authContext = useAuth();

  if (!authContext) {
    return {
      hasAccess: false,
      message: 'Loading...',
      sendVerificationEmail: async () => {},
      user: null,
      isEmailVerified: false
    };
  }

  const {
    user,
    isEmailVerified,
    canAccessFeature,
    getUnverifiedFeatureMessage,
    sendVerificationEmail
  } = authContext;

  const featureKey = FEATURES_REQUIRING_VERIFICATION[feature];
  const hasAccess = isEmailVerified || canAccessFeature(featureKey);
  const message = getUnverifiedFeatureMessage(featureKey);

  return {
    hasAccess,
    isVerified: isEmailVerified,
    message,
    sendVerification: sendVerificationEmail,
    requiresVerification: !hasAccess,
    user
  };
}

