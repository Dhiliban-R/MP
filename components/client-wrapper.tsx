'use client';

import { ReactNode, useEffect, useState } from 'react';

interface ClientWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ClientWrapper({ children, fallback }: ClientWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}