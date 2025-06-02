'use client';

import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { toast } from 'sonner';

/**
 * Robust navigation utility that handles router failures gracefully
 */
export class NavigationUtils {
  private static retryCount = 0;
  private static maxRetries = 3;
  private static retryDelay = 1000; // 1 second

  /**
   * Navigate to a path with fallback mechanisms
   */
  static async navigateTo(
    router: AppRouterInstance,
    path: string,
    options: {
      replace?: boolean;
      showToast?: boolean;
      toastMessage?: string;
      fallbackToWindow?: boolean;
    } = {}
  ): Promise<boolean> {
    const {
      replace = false,
      showToast = false,
      toastMessage,
      fallbackToWindow = true
    } = options;

    try {
      // Reset retry count for new navigation
      this.retryCount = 0;
      
      // Show toast if requested
      if (showToast && toastMessage) {
        toast.success(toastMessage);
      }

      // Attempt navigation with Next.js router
      // Using router.push/replace directly without await, as they don't return a Promise
      // that resolves on navigation completion, but rather on initiating the navigation.
      if (replace) {
        await router.replace(path);
      } else {
        await router.push(path);
      }

      // Assume success for now, as Next.js router handles actual navigation asynchronously.
      // Errors during navigation (e.g., network issues) are typically handled by Next.js's
      // error boundaries or global error handling, not directly caught here.
      return true;
    } catch (error) {
      console.error('Unexpected error during Next.js router navigation initiation:', error);
      
      // Try fallback navigation if an unexpected error occurs during initiation
      if (fallbackToWindow) {
        return this.fallbackNavigation(path, replace);
      }
      
      return false;
    }
  }

  /**
   * Retry navigation with exponential backoff
   */
  static async retryNavigation(
    router: AppRouterInstance,
    path: string,
    replace: boolean = false
  ): Promise<boolean> {
    for (let i = 0; i < this.maxRetries; i++) {
      this.retryCount = i + 1; // Update retry count
      const delay = this.retryDelay * Math.pow(2, i); // Exponential backoff
      
      console.log(`Retrying navigation (attempt ${this.retryCount}/${this.maxRetries}) after ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      try {
        if (replace) {
          await router.replace(path);
        } else {
          await router.push(path);
        }
        return true; // Assume success if no immediate error
      } catch (error) {
        console.error(`Navigation retry ${this.retryCount} failed:`, error);
      }
    }
    
    console.error('Max navigation retries exceeded. Falling back to window.location.');
    return this.fallbackNavigation(path, replace);
  }

  /**
   * Fallback to window.location when router fails
   */
  static fallbackNavigation(path: string, replace: boolean = false): boolean {
    try {
      console.log('Using window.location fallback for navigation to:', path);
      
      if (replace) {
        window.location.replace(path);
      } else {
        window.location.href = path;
      }
      
      return true;
    } catch (error) {
      console.error('Fallback navigation also failed:', error);
      toast.error('Navigation failed. Please try refreshing the page.');
      return false;
    }
  }

  /**
   * Navigate with loading state management
   */
  static async navigateWithLoading(
    router: AppRouterInstance,
    path: string,
    setLoading: (loading: boolean) => void,
    options: {
      replace?: boolean;
      successMessage?: string;
      errorMessage?: string;
    } = {}
  ): Promise<boolean> {
    const {
      replace = false,
      successMessage,
      errorMessage = 'Navigation failed. Please try again.'
    } = options;

    try {
      setLoading(true);
      
      // Use a Promise to simulate completion for the loading state
      const navigationPromise = new Promise<boolean>(async (resolve) => {
        const success = await this.navigateTo(router, path, {
          replace,
          showToast: !!successMessage,
          toastMessage: successMessage,
          fallbackToWindow: true // Always allow fallback for navigateWithLoading
        });
        resolve(success);
      });

      const success = await navigationPromise;

      if (!success) {
        toast.error(errorMessage);
      }

      return success;
    } catch (error) {
      console.error('Navigation with loading failed:', error);
      toast.error(errorMessage);
      return false;
    } finally {
      // Small delay to prevent UI flashing, then set loading to false
      setTimeout(() => setLoading(false), 100); // Reduced delay for faster perceived transitions
    }
  }

  /**
   * Get appropriate dashboard path for user role
   */
  static getDashboardPath(userRole: string): string {
    switch (userRole) {
      case 'admin':
        return '/admin/dashboard';
      case 'donor':
        return '/donor/dashboard';
      case 'recipient':
        return '/recipient/dashboard';
      default:
        return '/';
    }
  }

  /**
   * Navigate to user's appropriate dashboard
   */
  static async navigateToDashboard(
    router: AppRouterInstance,
    userRole: string,
    setLoading?: (loading: boolean) => void
  ): Promise<boolean> {
    const dashboardPath = this.getDashboardPath(userRole);
    
    if (setLoading) {
      return this.navigateWithLoading(router, dashboardPath, setLoading, {
        successMessage: `Welcome to your ${userRole} dashboard!`
      });
    }
    
    return this.navigateTo(router, dashboardPath, {
      showToast: true,
      toastMessage: `Welcome to your ${userRole} dashboard!`,
      fallbackToWindow: true // Ensure fallback for dashboard navigation
    });
  }

  /**
   * Check if current path matches any of the provided patterns
   */
  static isCurrentPath(currentPath: string, patterns: string[]): boolean {
    return patterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return regex.test(currentPath);
      }
      return currentPath === pattern;
    });
  }

  /**
   * Safe navigation that prevents navigation loops
   */
  static async safeNavigate(
    router: AppRouterInstance,
    targetPath: string,
    currentPath: string,
    options: {
      replace?: boolean;
      preventLoop?: boolean;
    } = {}
  ): Promise<boolean> {
    const { replace = false, preventLoop = true } = options;

    // Prevent navigation loops
    if (preventLoop && currentPath === targetPath) {
      console.log('Preventing navigation loop to same path:', targetPath);
      return true;
    }

    return this.navigateTo(router, targetPath, { replace });
  }
}

/**
 * Hook-like utility for navigation with error handling
 */
export const useNavigationUtils = () => {
  return {
    navigateTo: NavigationUtils.navigateTo,
    retryNavigation: NavigationUtils.retryNavigation,
    fallbackNavigation: NavigationUtils.fallbackNavigation,
    navigateWithLoading: NavigationUtils.navigateWithLoading,
    getDashboardPath: NavigationUtils.getDashboardPath,
    navigateToDashboard: NavigationUtils.navigateToDashboard,
    isCurrentPath: NavigationUtils.isCurrentPath,
    safeNavigate: NavigationUtils.safeNavigate
  };
};
