"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { NotificationBell } from "@/components/ui/notification-bell";

export default function DonorLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== "donor")) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading) {
    // You could replace this with a proper loading component
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user || user.role !== "donor") {
    return null; // Don't render anything while redirecting
  }

  return (
    <DashboardShell>
      {children}
    </DashboardShell>
  );
}
