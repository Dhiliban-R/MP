'use client';

/**
 * Performance monitoring and optimization utilities
 */

// Web Vitals monitoring
export interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

// Performance thresholds based on Google's recommendations
const PERFORMANCE_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 },   // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }  // Time to First Byte
};

// Rate metric performance
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = PERFORMANCE_THRESHOLDS[name as keyof typeof PERFORMANCE_THRESHOLDS];
  if (!thresholds) return 'good';
  
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

// Web Vitals tracking
export function trackWebVitals(onMetric: (metric: WebVitalsMetric) => void) {
  if (typeof window === 'undefined') return;

  // Track Core Web Vitals
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(onMetric);
    getFID(onMetric);
    getFCP(onMetric);
    getLCP(onMetric);
    getTTFB(onMetric);
  }).catch(console.error);
}

// Performance observer for custom metrics
export class PerformanceTracker {
  private static instance: PerformanceTracker;
  private metrics: Map<string, number[]> = new Map();
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }

  constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.setupObservers();
    }
  }

  private setupObservers() {
    // Navigation timing
    const navObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          this.recordMetric('domContentLoaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart);
          this.recordMetric('loadComplete', navEntry.loadEventEnd - navEntry.loadEventStart);
        }
      }
    });

    // Resource timing
    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          this.recordMetric(`resource_${resourceEntry.name}`, resourceEntry.duration);
        }
      }
    });

    // Long tasks
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'longtask') {
          this.recordMetric('longTask', entry.duration);
          console.warn(`Long task detected: ${entry.duration}ms`);
        }
      }
    });

    try {
      navObserver.observe({ entryTypes: ['navigation'] });
      resourceObserver.observe({ entryTypes: ['resource'] });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      
      this.observers.push(navObserver, resourceObserver, longTaskObserver);
    } catch (error) {
      console.warn('Performance observers not supported:', error);
    }
  }

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  getMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    for (const [name, values] of this.metrics.entries()) {
      if (values.length > 0) {
        result[name] = {
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length
        };
      }
    }
    
    return result;
  }

  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Image optimization utilities
export function optimizeImage(src: string, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
} = {}): string {
  const { width, height, quality = 75, format = 'webp' } = options;
  
  // For Next.js Image optimization
  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  params.set('q', quality.toString());
  params.set('f', format);
  
  return `/_next/image?url=${encodeURIComponent(src)}&${params.toString()}`;
}

// Lazy loading utility
export function createLazyLoader() {
  if (typeof window === 'undefined') return null;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          
          // Load images
          if (element.tagName === 'IMG') {
            const img = element as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
          }
          
          // Load background images
          if (element.dataset.bgSrc) {
            element.style.backgroundImage = `url(${element.dataset.bgSrc})`;
            element.removeAttribute('data-bg-src');
          }
          
          observer.unobserve(element);
        }
      });
    },
    {
      rootMargin: '50px 0px',
      threshold: 0.01
    }
  );

  return {
    observe: (element: HTMLElement) => observer.observe(element),
    unobserve: (element: HTMLElement) => observer.unobserve(element),
    disconnect: () => observer.disconnect()
  };
}

// Bundle size analyzer
export function analyzeBundleSize() {
  if (typeof window === 'undefined') return;

  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  
  console.group('Bundle Analysis');
  console.log(`Scripts: ${scripts.length}`);
  console.log(`Stylesheets: ${styles.length}`);
  
  scripts.forEach((script, index) => {
    const src = (script as HTMLScriptElement).src;
    console.log(`Script ${index + 1}: ${src}`);
  });
  
  styles.forEach((style, index) => {
    const href = (style as HTMLLinkElement).href;
    console.log(`Stylesheet ${index + 1}: ${href}`);
  });
  
  console.groupEnd();
}

// Memory usage monitoring
export function monitorMemoryUsage() {
  if (typeof window === 'undefined' || !('memory' in performance)) return null;

  const memory = (performance as any).memory;
  
  return {
    used: Math.round(memory.usedJSHeapSize / 1048576), // MB
    total: Math.round(memory.totalJSHeapSize / 1048576), // MB
    limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
    percentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
  };
}

// Performance budget checker
export function checkPerformanceBudget() {
  const budget = {
    maxBundleSize: 250, // KB
    maxImageSize: 100,  // KB
    maxFonts: 2,
    maxThirdPartyScripts: 3
  };

  const violations: string[] = [];
  
  // Check bundle size (simplified)
  const scripts = document.querySelectorAll('script[src]');
  if (scripts.length > budget.maxThirdPartyScripts) {
    violations.push(`Too many scripts: ${scripts.length} (max: ${budget.maxThirdPartyScripts})`);
  }

  // Check fonts
  const fonts = document.querySelectorAll('link[rel="preload"][as="font"]');
  if (fonts.length > budget.maxFonts) {
    violations.push(`Too many fonts: ${fonts.length} (max: ${budget.maxFonts})`);
  }

  return {
    passed: violations.length === 0,
    violations
  };
}
