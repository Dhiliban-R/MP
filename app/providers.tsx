'use client';

import { ReactNode, Suspense } from 'react';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';

interface ProvidersProps {
  children: ReactNode;
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}


export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      {children}
      <Toaster />
      <SonnerToaster
        position="top-right"
        richColors
        closeButton
        expand={false}
        visibleToasts={5}
      />
    </AuthProvider>
  );
}
