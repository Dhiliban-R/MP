'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { toast as toastSonner } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, Mail, RefreshCw, AlertTriangle } from 'lucide-react';

// Grace period duration in milliseconds (24 hours)
const GRACE_PERIOD_DURATION = 24 * 60 * 60 * 1000;

interface VerificationPromptProps {
  featureName?: string;
  onVerified?: () => void;
  redirectPath?: string;
  variant?: 'default' | 'inline' | 'banner';
  showSkip?: boolean;
}

export function VerificationPrompt({
  featureName,
  onVerified,
  redirectPath,
  variant = 'default',
  showSkip = false,
}: VerificationPromptProps) {
  const authContext = useAuth();

  if (!authContext) {
    return null;
  }

  const { user, isEmailVerified, sendVerificationEmail, checkEmailVerification, lastVerificationEmailSent, verificationCheckInProgress, isInGracePeriod } = authContext;
  const router = useRouter();
  const { toast } = useToast();
  
  // State for countdown timer
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  
  // Calculate account creation time and grace period expiration
  const accountCreationTime = useMemo(() => {
    if (!user?.metadata?.creationTime) return null;
    return new Date(user.metadata.creationTime);
  }, [user?.metadata?.creationTime]);
  
  const gracePeriodExpiration = useMemo(() => {
    if (!accountCreationTime) return null;
    return new Date(accountCreationTime.getTime() + GRACE_PERIOD_DURATION);
  }, [accountCreationTime]);
  
  // Format remaining time as days, hours, minutes
  const formattedTimeRemaining = useMemo(() => {
    if (timeRemaining === null) return '';
    
    const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
    const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  }, [timeRemaining]);
  
  // Calculate grace period progress percentage
  const gracePeriodProgress = useMemo(() => {
    if (!accountCreationTime || !timeRemaining) return 100;
    
    const elapsed = GRACE_PERIOD_DURATION - timeRemaining;
    return Math.min(100, Math.max(0, (elapsed / GRACE_PERIOD_DURATION) * 100));
  }, [accountCreationTime, timeRemaining]);
  
  // Update countdown timer
  useEffect(() => {
    if (isEmailVerified || !isInGracePeriod() || !gracePeriodExpiration) {
      setTimeRemaining(null);
      return;
    }
    
    const calculateTimeRemaining = () => {
      if (!gracePeriodExpiration) return 0;
      const now = new Date();
      return Math.max(0, gracePeriodExpiration.getTime() - now.getTime());
    };
    
    // Set initial time
    setTimeRemaining(calculateTimeRemaining());
    
    // Update every minute
    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
        // Refresh verification status when grace period expires
        checkVerificationStatus();
      }
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, [isEmailVerified, isInGracePeriod, gracePeriodExpiration]);
  
  // Function to handle sending verification email
  const handleSendVerificationEmail = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      await sendVerificationEmail();
      toastSonner.success('Verification email sent', {
        description: 'Please check your inbox and follow the instructions to verify your email.'
      });
    } catch (error) {
      console.error('Error sending verification email:', error);
      toastSonner.error('Failed to send verification email', {
        description: 'Please try again later.'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Function to check verification status
  const checkVerificationStatus = async () => {
    if (!user || verificationCheckInProgress) return;
    
    try {
      setCheckingStatus(true);
      const isVerified = await checkEmailVerification();
      
      if (isVerified) {
        toastSonner.success('Email verified successfully', {
          description: 'You now have full access to all features.'
        });
        
        // Call onVerified callback if provided
        if (onVerified) {
          onVerified();
        }
        
        // Redirect if path provided
        if (redirectPath) {
          router.push(redirectPath);
        }
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };
  
  // Skip verification and continue (only for grace period)
  const handleSkip = () => {
    if (onVerified) {
      onVerified();
    }
    
    if (redirectPath) {
      router.push(redirectPath);
    }
  };
  
  // Don't show if already verified
  if (isEmailVerified) {
    return null;
  }
  
  // Determine which variant to render
  if (variant === 'inline') {
    return (
      <Alert variant="warning" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>
          {isInGracePeriod() ? 'Email verification recommended' : 'Email verification required'}
        </AlertTitle>
        <AlertDescription className="mt-2">
          {isInGracePeriod() ? (
            <div className="space-y-2">
              <p>
                Please verify your email to maintain full access to {featureName || 'all features'}.
                {timeRemaining !== null && (
                  <span className="font-medium"> Grace period: {formattedTimeRemaining}</span>
                )}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSendVerificationEmail}
                  disabled={loading}
                >
                  {loading ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <Mail className="h-3 w-3 mr-1" />}
                  Send verification email
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={checkVerificationStatus}
                  disabled={checkingStatus}
                >
                  {checkingStatus ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                  I've verified
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p>
                Your grace period has expired. Please verify your email to access {featureName || 'this feature'}.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleSendVerificationEmail}
                  disabled={loading}
                >
                  {loading ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <Mail className="h-3 w-3 mr-1" />}
                  Send verification email
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={checkVerificationStatus}
                  disabled={checkingStatus}
                >
                  {checkingStatus ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                  Check status
                </Button>
              </div>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }
  
  if (variant === 'banner') {
    return (
      <div className={`w-full p-2 ${isInGracePeriod() ? 'bg-yellow-50 border-b border-yellow-200' : 'bg-red-50 border-b border-red-200'}`}>
        <div className="container flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isInGracePeriod() ? (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm font-medium">
              {isInGracePeriod() ? (
                <>Email verification needed - Grace period: {formattedTimeRemaining}</>
              ) : (
                <>Email verification required</>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={isInGracePeriod() ? "outline" : "default"} 
              size="sm" 
              onClick={handleSendVerificationEmail}
              disabled={loading}
              className={isInGracePeriod() ? "border-yellow-300 hover:bg-yellow-100" : ""}
            >
              {loading ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <Mail className="h-3 w-3 mr-1" />}
              Verify email
            </Button>
            {isInGracePeriod() && showSkip && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSkip}
              >
                Skip for now
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Default card variant
  return (
    <Card className={isInGracePeriod() ? "border-yellow-300" : "border-red-300"}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Email Verification {isInGracePeriod() ? "Needed" : "Required"}</CardTitle>
          {isInGracePeriod() && (
            <Badge variant="outline" className="flex items-center gap-1 py-1">
              <Clock className="h-3 w-3" />
              <span>{formattedTimeRemaining}</span>
            </Badge>
          )}
        </div>
        <CardDescription>
          {isInGracePeriod()
            ? `Please verify your email to maintain full access to ${featureName || 'all features'}.`
            : `Your grace period has expired. Please verify your email to access ${featureName || 'all features'}.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isInGracePeriod() && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Grace period progress</span>
              <span>{Math.round(gracePeriodProgress)}%</span>
            </div>
            <Progress value={gracePeriodProgress} className="h-2" />
          </div>
        )}
        
        <Alert>
          <Mail className="h-4 w-4" />
          <AlertTitle>Check your inbox</AlertTitle>
          <AlertDescription>
            We've sent a verification link to <strong>{user?.email}</strong>. Click the link in the email to verify your account.
          </AlertDescription>
        </Alert>
        
        {lastVerificationEmailSent && (
          <p className="text-xs text-muted-foreground">
            Last email sent: {new Date(lastVerificationEmailSent).toLocaleString()}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2">
        <Button 
          className="w-full sm:w-auto"
          onClick={handleSendVerificationEmail}
          disabled={loading}
        >
          {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
          Resend verification email
        </Button>
        <Button 
          variant="outline" 
          className="w-full sm:w-auto"
          onClick={checkVerificationStatus}
          disabled={checkingStatus}
        >
          {checkingStatus ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
          I've verified my email
        </Button>
        {isInGracePeriod() && showSkip && (
          <Button 
            variant="ghost" 
            className="w-full sm:w-auto"
            onClick={handleSkip}
          >
            Skip for now
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

