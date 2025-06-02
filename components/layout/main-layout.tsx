'use client';

import React, { ReactNode } from 'react';
import { Navbar } from './navbar';
import { Sidebar } from './sidebar';
import { useAppStore } from '@/store/store';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
  showSidebar?: boolean;
  showNavbar?: boolean;
}

export function MainLayout({ 
  children, 
  className,
  showSidebar = true,
  showNavbar = true 
}: MainLayoutProps) {
  const { sidebarOpen } = useAppStore();

  if (!showNavbar && !showSidebar) {
    // Simple layout without navbar or sidebar
    return (
      <div className={cn("min-h-screen w-full", className)}>
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Top Navigation Bar - Fixed */}
      {showNavbar && <Navbar />}
      
      {/* Content Area with optional Sidebar */}
      <div className={cn(
        "flex flex-1",
        showNavbar && "pt-16" // pt-16 to account for fixed navbar height
      )}>
        {/* Sidebar - Fixed on the left */}
        {showSidebar && <Sidebar />}
        
        {/* Main Content - Takes remaining space and adjusts for sidebar */}
        <main
          className={cn(
            'flex-1 transition-all duration-300 ease-in-out w-full overflow-x-hidden',
            showNavbar && "min-h-[calc(100vh-4rem)]",
            !showNavbar && "min-h-screen",
            // Responsive sidebar margins based on screen size and sidebar state
            showSidebar && [
              'ml-0', // Small screens: no margin (mobile sheet overlay)
              'lg:ml-64', // Large screens: default full sidebar width
              // Dynamic margin based on sidebar state
              sidebarOpen ? 'lg:ml-64' : 'lg:ml-[70px]'
            ],
            className
          )}
        >
          <div className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
