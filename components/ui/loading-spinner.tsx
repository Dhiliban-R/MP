'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
};

export function LoadingSpinner({ 
  size = 'md', 
  className, 
  text, 
  fullScreen = false 
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn(
      "flex items-center justify-center gap-2",
      fullScreen && "min-h-[50vh]",
      className
    )}>
      <Loader2 className={cn(
        "animate-spin text-primary",
        sizeClasses[size]
      )} />
      {text && (
        <span className="text-sm text-muted-foreground animate-pulse">
          {text}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}

// Skeleton loading components for better UX
export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/2"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
      <div className="h-10 bg-gray-200 rounded w-1/3"></div>
    </div>
  );
}
