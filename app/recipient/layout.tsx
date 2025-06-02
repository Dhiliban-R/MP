'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import React, { Suspense } from 'react';
const NotificationBell = React.lazy(() => import('@/components/ui/notification-bell').then(mod => ({ default: mod.NotificationBell })));

export default function RecipientLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'recipient')) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    // You could replace this with a proper loading component
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user || user.role !== 'recipient') {
    return null; // Don't render anything while redirecting
  }

  return (
    <DashboardShell>
      {children}
    </DashboardShell>
  );
}
