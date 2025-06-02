'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { NavigationUtils } from '@/lib/navigation-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, RefreshCw, Mail, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function VerifyEmailPage() {
  const { user, loading, isEmailVerified, sendVerificationEmail, checkEmailVerification, verificationCheckInProgress } = useAuth();
  const router = useRouter();
  
  // State for the resend cooldown
  const [countdown, setCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  
  // Auto-redirect when verified
  useEffect(() => {
    if (isEmailVerified && user) {
      toast.success('Email verified successfully!', {
        description: 'Redirecting to your dashboard...'
      });
      
      // Navigate to the appropriate dashboard
      NavigationUtils.navigateToDashboard(router, user.role);
    }
  }, [isEmailVerified, user, router]);

  // Handle countdown for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Periodically check verification status using the context's checkEmailVerification
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    // Only set up polling if the user exists and email is not verified
    if (user && !isEmailVerified && !loading) {
      intervalId = setInterval(async () => {
        await checkEmailVerification(); // Use the context's function
      }, 10000); // Check every 10 seconds
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user, isEmailVerified, loading, checkEmailVerification]);

  // Handle resend verification email
  const handleResendEmail = async () => {
    if (countdown > 0) return;
    
    try {
      setIsResending(true);
      await sendVerificationEmail();
      
      // Set cooldown to 60 seconds
      setCountdown(60);
      
      toast.success('Verification email sent!', {
        description: 'Please check your inbox and spam folder'
      });
    } catch (error) {
      console.error('Error resending verification email:', error);
      toast.error('Failed to send verification email', {
        description: 'Please try again later or contact support'
      });
    } finally {
      setIsResending(false);
    }
  };

  // Handle manual verification check
  const handleCheckVerification = async () => {
    await checkEmailVerification(); // Use the context's function
  };

  // Redirect to login if no user
  useEffect(() => {
    if (!loading && !user) {
      toast.error('Please sign in to verify your email');
      NavigationUtils.navigateTo(router, '/auth/login', {
        replace: true,
        fallbackToWindow: true
      });
    }
  }, [loading, user, router]);

  // Handle loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Email Verification</CardTitle>
            <CardDescription>Loading your account information...</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={undefined} className="w-full h-2 mb-4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no user is logged in (should redirect via effect, but just in case)
  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isEmailVerified ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                Email Verified
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Verification Required
              </>
            )}
          </CardTitle>
          <CardDescription>
            {isEmailVerified
              ? 'Your email has been successfully verified.'
              : `Please verify your email address (${user.email}) to access all features.`}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isEmailVerified ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle>Email Verified Successfully</AlertTitle>
              <AlertDescription>
                You now have full access to all features of the Food Donation Management System.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert className="mb-4 bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <AlertTitle>Verification Required</AlertTitle>
                <AlertDescription>
                  We've sent a verification link to your email address. Please check your inbox
                  (and spam folder) and click the link to verify your email.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4 mt-4">
                <h3 className="text-sm font-medium">Haven't received the email?</h3>
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                  <li>Check your spam or junk folder</li>
                  <li>Verify you entered the correct email address</li>
                  <li>Wait a few minutes for the email to arrive</li>
                  <li>Use the resend button below if needed</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-3">
          {isEmailVerified ? (
            <Button
              className="w-full sm:w-auto"
              onClick={() => NavigationUtils.navigateToDashboard(router, user.role)}
            >
              Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleCheckVerification}
                disabled={verificationCheckInProgress}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${verificationCheckInProgress ? 'animate-spin' : ''}`} />
                {verificationCheckInProgress ? 'Checking...' : 'Check Verification Status'}
              </Button>
              
              <Button
                className="w-full sm:w-auto"
                onClick={handleResendEmail}
                disabled={countdown > 0 || isResending}
              >
                <Mail className="mr-2 h-4 w-4" />
                {isResending
                  ? 'Sending...'
                  : countdown > 0
                    ? `Resend Email (${countdown}s)`
                    : 'Resend Verification Email'}
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
