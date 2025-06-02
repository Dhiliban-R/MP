'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface VerificationStatusProps {
  showResendButton?: boolean;
  variant?: 'default' | 'compact' | 'badge';
  className?: string;
}

/**
 * VerificationStatus component
 * 
 * Displays the current email verification status of the user and
 * provides functionality to resend verification emails.
 * 
 * @param showResendButton - Whether to show the resend verification email button
 * @param variant - The display variant ('default', 'compact', or 'badge')
 * @param className - Additional CSS classes to apply
 */
export function VerificationStatus({
  showResendButton = false,
  variant = 'default',
  className = '',
}: VerificationStatusProps) {
  const { user, isEmailVerified, sendVerificationEmail } = useAuth();
  const [countdown, setCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Handle countdown for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle resend verification email
  const handleResendEmail = async () => {
    if (countdown > 0 || !user) return;

    try {
      setIsResending(true);
      await sendVerificationEmail();
      setCountdown(60); // Set cooldown to 60 seconds

      toast.success('Verification email sent!', {
        description: 'Please check your inbox and spam folder',
      });
    } catch (error) {
      console.error('Error resending verification email:', error);
      toast.error('Failed to send verification email', {
        description: 'Please try again later or contact support',
      });
    } finally {
      setIsResending(false);
    }
  };

  if (!user) return null;

  // Badge variant
  if (variant === 'badge') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              className={cn(
                'cursor-pointer',
                isEmailVerified 
                  ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200' 
                  : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200',
                className
              )}
            >
              {isEmailVerified ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <AlertTriangle className="h-3 w-3 mr-1" />
              )}
              {isEmailVerified ? 'Verified' : 'Unverified'}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {isEmailVerified
              ? 'Your email is verified'
              : 'Please verify your email address'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {isEmailVerified ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
        )}
        <span className="text-sm">
          {isEmailVerified ? 'Email verified' : 'Email not verified'}
        </span>
        {!isEmailVerified && showResendButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResendEmail}
            disabled={countdown > 0 || isResending}
            className="p-0 h-auto"
          >
            <Mail className="h-3 w-3 mr-1" />
            {isResending
              ? 'Sending...'
              : countdown > 0
              ? `Resend (${countdown}s)`
              : 'Resend'}
          </Button>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        {isEmailVerified ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
        )}
        <span className="font-medium">
          {isEmailVerified ? 'Email Verified' : 'Email Not Verified'}
        </span>
      </div>
      {!isEmailVerified && (
        <div className="text-sm text-gray-600">
          Please verify your email address to access all features.
          {showResendButton && (
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResendEmail}
                disabled={countdown > 0 || isResending}
              >
                <Mail className="h-4 w-4 mr-2" />
                {isResending
                  ? 'Sending...'
                  : countdown > 0
                  ? `Resend Email (${countdown}s)`
                  : 'Resend Verification Email'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

