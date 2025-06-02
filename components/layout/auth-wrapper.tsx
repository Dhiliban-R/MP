"use client";

import { ReactNode } from "react";

// This component is now simplified since AuthProvider is in the root layout
// Back button functionality is now handled by DashboardShell for dashboard pages
export default function AuthWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {children}
    </div>
  );
}
