import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  className?: string;
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message = 'Loading...',
  className,
  variant = 'spinner',
  fullScreen = false
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const containerClasses = cn(
    'flex items-center justify-center',
    fullScreen ? 'fixed inset-0 bg-white/80 backdrop-blur-sm z-50' : 'p-4',
    className
  );

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  'rounded-full bg-primary animate-pulse',
                  size === 'sm' ? 'h-2 w-2' : size === 'md' ? 'h-3 w-3' : 'h-4 w-4'
                )}
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <div className={cn('rounded-full bg-primary animate-pulse-slow', sizeClasses[size])} />
        );

      case 'skeleton':
        return (
          <div className="space-y-3 w-full max-w-sm">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6" />
          </div>
        );

      default:
        return (
          <svg
            className={cn('animate-spin text-primary', sizeClasses[size])}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
        );
    }
  };

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center space-y-3">
        {renderSpinner()}
        {message && variant !== 'skeleton' && (
          <span className={cn(
            'text-gray-600 font-medium',
            size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'
          )}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
