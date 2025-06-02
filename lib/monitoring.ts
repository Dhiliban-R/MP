'use client';

import * as Sentry from '@sentry/nextjs';

// Initialize Sentry for error tracking
export const initSentry = () => {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      debug: process.env.NODE_ENV === 'development',
      integrations: [
        new Sentry.BrowserTracing({
          tracePropagationTargets: [
            'localhost',
            /^https:\/\/fdms-e94f8\.web\.app/,
            /^https:\/\/fdms-e94f8\.firebaseapp\.com/
          ],
        }),
        new Sentry.Replay({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  }
};

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Track page load times
  trackPageLoad(pageName: string) {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const loadTime = navigation.loadEventEnd - navigation.fetchStart;
      
      this.metrics.set(`page_load_${pageName}`, loadTime);
      
      // Send to analytics
      this.sendMetric('page_load_time', loadTime, { page: pageName });
      
      // Alert if load time is too high
      if (loadTime > 3000) {
        console.warn(`Slow page load detected: ${pageName} took ${loadTime}ms`);
        Sentry.addBreadcrumb({
          message: `Slow page load: ${pageName}`,
          level: 'warning',
          data: { loadTime, pageName }
        });
      }
    }
  }

  // Track API response times
  trackApiCall(endpoint: string, duration: number, status: number) {
    this.metrics.set(`api_${endpoint}`, duration);
    
    this.sendMetric('api_response_time', duration, {
      endpoint,
      status: status.toString()
    });

    // Alert on slow API calls
    if (duration > 5000) {
      console.warn(`Slow API call: ${endpoint} took ${duration}ms`);
      Sentry.addBreadcrumb({
        message: `Slow API call: ${endpoint}`,
        level: 'warning',
        data: { duration, endpoint, status }
      });
    }

    // Alert on API errors
    if (status >= 400) {
      Sentry.captureMessage(`API Error: ${endpoint} returned ${status}`, 'error');
    }
  }

  // Track user interactions
  trackUserAction(action: string, details?: Record<string, any>) {
    this.sendMetric('user_action', 1, {
      action,
      ...details
    });

    Sentry.addBreadcrumb({
      message: `User action: ${action}`,
      level: 'info',
      data: details
    });
  }

  // Track errors
  trackError(error: Error, context?: Record<string, any>) {
    console.error('Application error:', error);
    
    Sentry.captureException(error, {
      tags: {
        component: context?.component || 'unknown',
        action: context?.action || 'unknown'
      },
      extra: context
    });

    this.sendMetric('error_count', 1, {
      error_type: error.name,
      error_message: error.message,
      ...context
    });
  }

  // Send metrics to analytics service
  private sendMetric(name: string, value: number, labels?: Record<string, string>) {
    // Send to Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', name, {
        value,
        custom_parameter_1: JSON.stringify(labels)
      });
    }

    // Send to custom analytics endpoint
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metric: name,
          value,
          labels,
          timestamp: Date.now()
        })
      }).catch(err => {
        console.warn('Failed to send metric:', err);
      });
    }
  }

  // Get current metrics
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  // Clear metrics
  clearMetrics() {
    this.metrics.clear();
  }
}

// Health check utilities
export class HealthCheck {
  static async checkSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, boolean>;
    timestamp: number;
  }> {
    const checks: Record<string, boolean> = {};
    
    try {
      // Check Firebase connection
      checks.firebase = await this.checkFirebase();
      
      // Check external APIs
      checks.maps_api = await this.checkMapsAPI();
      
      // Check local storage
      checks.local_storage = this.checkLocalStorage();
      
      // Check network connectivity
      checks.network = navigator.onLine;
      
      // Determine overall status
      const failedChecks = Object.values(checks).filter(check => !check).length;
      let status: 'healthy' | 'degraded' | 'unhealthy';
      
      if (failedChecks === 0) {
        status = 'healthy';
      } else if (failedChecks <= 2) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }
      
      return {
        status,
        checks,
        timestamp: Date.now()
      };
      
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        checks,
        timestamp: Date.now()
      };
    }
  }

  private static async checkFirebase(): Promise<boolean> {
    try {
      // Simple Firebase connectivity check
      const { db } = await import('./firebase');
      const { doc, getDoc } = await import('firebase/firestore');
      
      // Try to read a document (this will fail gracefully if offline)
      await getDoc(doc(db, 'health', 'check'));
      return true;
    } catch (error) {
      return false;
    }
  }

  private static async checkMapsAPI(): Promise<boolean> {
    try {
      if (typeof window !== 'undefined' && (window as any).google) {
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  private static checkLocalStorage(): boolean {
    try {
      const testKey = '__health_check__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// User analytics
export class UserAnalytics {
  static trackPageView(page: string) {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
        page_title: page,
        page_location: window.location.href
      });
    }

    PerformanceMonitor.getInstance().trackUserAction('page_view', { page });
  }

  static trackEvent(eventName: string, parameters?: Record<string, any>) {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, parameters);
    }

    PerformanceMonitor.getInstance().trackUserAction(eventName, parameters);
  }

  static trackConversion(conversionType: string, value?: number) {
    this.trackEvent('conversion', {
      conversion_type: conversionType,
      value
    });
  }

  static setUserProperties(properties: Record<string, any>) {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
        custom_map: properties
      });
    }

    Sentry.setUser(properties);
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Initialize monitoring
if (typeof window !== 'undefined') {
  initSentry();
}
