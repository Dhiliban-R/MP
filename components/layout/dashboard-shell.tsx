'use client';

import React, { ReactNode, memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from './sidebar';
import { Navbar } from './navbar';
import { useAppStore } from '@/store/store';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { ErrorBoundary } from '@/components/ui/error-boundary';

interface DashboardShellProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

interface BreadcrumbData {
  label: string;
  href: string;
  isLast?: boolean;
}

export const DashboardShell = memo(function DashboardShell({
  children,
  className,
  title,
  description
}: DashboardShellProps) {
  const { sidebarOpen } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();

  const handleBackToHome = React.useCallback(() => {
    router.push('/');
  }, [router]);

  // Memoize breadcrumbs generation for performance
  const breadcrumbs = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbData[] = [];

    breadcrumbs.push({ label: 'Home', href: '/' });

    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;

      // Format segment name
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      breadcrumbs.push({
        label,
        href: currentPath,
        isLast
      });
    });

    return breadcrumbs;
  }, [pathname]);

  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Top Navigation Bar - Fixed */}
      <Navbar />

      {/* Content Area with Sidebar */}
      <div className="flex flex-1 pt-16"> {/* pt-16 to account for fixed navbar height */}
        {/* Sidebar - Fixed on the left */}
        <Sidebar />

        {/* Main Content - Takes remaining space and adjusts for sidebar */}
        <main
          className={cn(
            'flex-1 transition-all duration-300 ease-in-out w-full overflow-x-hidden min-h-[calc(100vh-4rem)]',
            // Responsive sidebar margins based on screen size and sidebar state
            'ml-0', // Small screens: no margin (mobile sheet overlay)
            'lg:ml-64', // Large screens: default full sidebar width
            // Dynamic margin based on sidebar state
            sidebarOpen ? 'lg:ml-64' : 'lg:ml-[70px]',
            className
          )}
        >
          {/* Enhanced header with breadcrumbs and back button */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
            <div className="p-4 md:p-6">
              {/* Back to Home Button - Centered */}
              <div className="flex justify-center mb-4">
                <Button
                  onClick={handleBackToHome}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white hover:shadow-md transition-all duration-200 border-gray-200/60"
                >
                  <Home className="h-4 w-4" />
                  <span>Back to Home</span>
                </Button>
              </div>

              {/* Breadcrumbs */}
              <div className="flex justify-center mb-4">
                <Breadcrumb>
                  <BreadcrumbList>
                    {breadcrumbs.map((crumb, index) => (
                      <div key={crumb.href} className="flex items-center">
                        {index > 0 && <BreadcrumbSeparator />}
                        <BreadcrumbItem>
                          {crumb.isLast ? (
                            <BreadcrumbPage className="text-primary font-medium">
                              {crumb.label}
                            </BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink
                              href={crumb.href}
                              className="text-muted-foreground hover:text-primary transition-colors"
                            >
                              {crumb.label}
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                      </div>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>

              {/* Page Title and Description */}
              {(title || description) && (
                <div className="text-center">
                  {title && (
                    <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-2">
                      {title}
                    </h1>
                  )}
                  {description && (
                    <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
                      {description}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Enhanced content area with better spacing and background */}
          <div className="w-full min-h-[calc(100vh-140px)] p-4 md:p-6 lg:p-8">
            <div className="w-full max-w-7xl mx-auto bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 p-6">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
});
