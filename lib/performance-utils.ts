'use client';

/**
 * Performance optimization utilities for smooth page transitions and loading states
 */

// Debounce utility for search and input optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility for scroll and resize events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Preload critical resources
export function preloadRoute(href: string): void {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  }
}

// Optimize image loading with lazy loading
export function createImageLoader() {
  if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        }
      });
    });

    return imageObserver;
  }
  return null;
}

// Smooth scroll utility
export function smoothScrollTo(element: HTMLElement | string, offset: number = 0): void {
  const target = typeof element === 'string' ? document.querySelector(element) : element;
  if (target) {
    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
  }
}

// Page transition optimization
export class PageTransitionManager {
  private static isTransitioning = false;
  private static transitionTimeout: NodeJS.Timeout | null = null;

  static startTransition(): void {
    this.isTransitioning = true;
    document.body.classList.add('page-transitioning');
    
    // Auto-clear transition state after 3 seconds as fallback
    this.transitionTimeout = setTimeout(() => {
      this.endTransition();
    }, 3000);
  }

  static endTransition(): void {
    this.isTransitioning = false;
    document.body.classList.remove('page-transitioning');
    
    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
      this.transitionTimeout = null;
    }
  }

  static isInTransition(): boolean {
    return this.isTransitioning;
  }
}

// Memory optimization for large lists
export function virtualizeList<T>(
  items: T[],
  containerHeight: number,
  itemHeight: number,
  scrollTop: number
): { visibleItems: T[]; startIndex: number; endIndex: number } {
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 1, items.length);
  
  return {
    visibleItems: items.slice(startIndex, endIndex),
    startIndex,
    endIndex
  };
}

// Performance monitoring
export class PerformanceMonitor {
  private static metrics: Map<string, number> = new Map();

  static startMeasure(name: string): void {
    if (typeof window !== 'undefined' && window.performance) {
      this.metrics.set(name, performance.now());
    }
  }

  static endMeasure(name: string): number | null {
    if (typeof window !== 'undefined' && window.performance) {
      const startTime = this.metrics.get(name);
      if (startTime !== undefined) {
        const duration = performance.now() - startTime;
        this.metrics.delete(name);
        
        // Log slow operations in development
        if (process.env.NODE_ENV === 'development' && duration > 100) {
          console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
        }
        
        return duration;
      }
    }
    return null;
  }

  static measureAsync<T>(name: string, asyncFn: () => Promise<T>): Promise<T> {
    this.startMeasure(name);
    return asyncFn().finally(() => {
      this.endMeasure(name);
    });
  }
}

// Component loading optimization
export function createComponentLoader() {
  const loadedComponents = new Set<string>();
  
  return {
    isLoaded: (componentName: string) => loadedComponents.has(componentName),
    markAsLoaded: (componentName: string) => loadedComponents.add(componentName),
    preloadComponent: async (componentName: string, loader: () => Promise<any>) => {
      if (!loadedComponents.has(componentName)) {
        try {
          await loader();
          loadedComponents.add(componentName);
        } catch (error) {
          console.error(`Failed to preload component ${componentName}:`, error);
        }
      }
    }
  };
}

// Network optimization
export function optimizeNetworkRequests() {
  // Implement request deduplication
  const pendingRequests = new Map<string, Promise<any>>();
  
  return {
    dedupedFetch: async (url: string, options?: RequestInit): Promise<Response> => {
      const key = `${url}-${JSON.stringify(options)}`;
      
      if (pendingRequests.has(key)) {
        return pendingRequests.get(key)!;
      }
      
      const request = fetch(url, options);
      pendingRequests.set(key, request);
      
      try {
        const response = await request;
        return response;
      } finally {
        pendingRequests.delete(key);
      }
    }
  };
}
