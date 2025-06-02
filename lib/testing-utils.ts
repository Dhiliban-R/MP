'use client';

/**
 * Testing utilities for cross-browser compatibility and user testing
 */

// Browser detection
export function detectBrowser(): {
  name: string;
  version: string;
  engine: string;
  platform: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
} {
  if (typeof window === 'undefined') {
    return {
      name: 'unknown',
      version: 'unknown',
      engine: 'unknown',
      platform: 'unknown',
      isMobile: false,
      isTablet: false,
      isDesktop: true
    };
  }

  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  
  // Browser detection
  let name = 'unknown';
  let version = 'unknown';
  let engine = 'unknown';

  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    name = 'Chrome';
    version = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'unknown';
    engine = 'Blink';
  } else if (userAgent.includes('Firefox')) {
    name = 'Firefox';
    version = userAgent.match(/Firefox\/(\d+)/)?.[1] || 'unknown';
    engine = 'Gecko';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    name = 'Safari';
    version = userAgent.match(/Version\/(\d+)/)?.[1] || 'unknown';
    engine = 'WebKit';
  } else if (userAgent.includes('Edg')) {
    name = 'Edge';
    version = userAgent.match(/Edg\/(\d+)/)?.[1] || 'unknown';
    engine = 'Blink';
  }

  // Device detection
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android(?=.*Tablet)|Tablet/i.test(userAgent);
  const isDesktop = !isMobile && !isTablet;

  return {
    name,
    version,
    engine,
    platform,
    isMobile,
    isTablet,
    isDesktop
  };
}

// Feature detection
export function detectFeatures(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};

  return {
    // Storage
    localStorage: 'localStorage' in window,
    sessionStorage: 'sessionStorage' in window,
    indexedDB: 'indexedDB' in window,
    
    // APIs
    geolocation: 'geolocation' in navigator,
    notifications: 'Notification' in window,
    serviceWorker: 'serviceWorker' in navigator,
    webGL: !!document.createElement('canvas').getContext('webgl'),
    webGL2: !!document.createElement('canvas').getContext('webgl2'),
    
    // CSS Features
    cssGrid: CSS.supports('display', 'grid'),
    cssFlexbox: CSS.supports('display', 'flex'),
    cssCustomProperties: CSS.supports('--custom', 'property'),
    cssClipPath: CSS.supports('clip-path', 'circle()'),
    
    // JavaScript Features
    es6Modules: 'noModule' in document.createElement('script'),
    asyncAwait: (async () => {})().constructor === (async function(){}).constructor,
    fetch: 'fetch' in window,
    intersectionObserver: 'IntersectionObserver' in window,
    resizeObserver: 'ResizeObserver' in window,
    
    // Media
    webP: (() => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    })(),
    
    // Touch
    touchEvents: 'ontouchstart' in window,
    pointerEvents: 'onpointerdown' in window,
    
    // Network
    onLine: 'onLine' in navigator,
    connection: 'connection' in navigator,
  };
}

// Performance testing
export function runPerformanceTests(): Promise<{
  renderTime: number;
  scriptLoadTime: number;
  imageLoadTime: number;
  memoryUsage?: number;
  networkSpeed?: string;
}> {
  return new Promise((resolve) => {
    const startTime = performance.now();
    
    // Test render time
    requestAnimationFrame(() => {
      const renderTime = performance.now() - startTime;
      
      // Test script load time
      const scriptStart = performance.now();
      const script = document.createElement('script');
      script.src = 'data:text/javascript,';
      script.onload = () => {
        const scriptLoadTime = performance.now() - scriptStart;
        
        // Test image load time
        const imageStart = performance.now();
        const img = new Image();
        img.onload = () => {
          const imageLoadTime = performance.now() - imageStart;
          
          // Get memory usage if available
          const memoryUsage = (performance as any).memory?.usedJSHeapSize;
          
          // Get network speed if available
          const connection = (navigator as any).connection;
          const networkSpeed = connection?.effectiveType;
          
          resolve({
            renderTime,
            scriptLoadTime,
            imageLoadTime,
            memoryUsage,
            networkSpeed
          });
        };
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      };
      document.head.appendChild(script);
    });
  });
}

// Accessibility testing
export function runAccessibilityTests(): {
  issues: Array<{
    type: string;
    element: string;
    description: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  score: number;
} {
  const issues: Array<{
    type: string;
    element: string;
    description: string;
    severity: 'error' | 'warning' | 'info';
  }> = [];

  if (typeof document === 'undefined') {
    return { issues, score: 100 };
  }

  // Check for missing alt attributes
  const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
  imagesWithoutAlt.forEach((img, index) => {
    issues.push({
      type: 'missing_alt',
      element: `img[${index}]`,
      description: 'Image missing alt attribute',
      severity: 'error'
    });
  });

  // Check for missing form labels
  const inputsWithoutLabels = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
  inputsWithoutLabels.forEach((input, index) => {
    const id = input.getAttribute('id');
    const hasLabel = id && document.querySelector(`label[for="${id}"]`);
    if (!hasLabel) {
      issues.push({
        type: 'missing_label',
        element: `input[${index}]`,
        description: 'Form input missing label',
        severity: 'error'
      });
    }
  });

  // Check for heading hierarchy
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let previousLevel = 0;
  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1));
    if (level > previousLevel + 1) {
      issues.push({
        type: 'heading_hierarchy',
        element: `${heading.tagName.toLowerCase()}[${index}]`,
        description: 'Heading levels should not skip',
        severity: 'warning'
      });
    }
    previousLevel = level;
  });

  // Check for color contrast (simplified)
  const elementsWithColor = document.querySelectorAll('[style*="color"]');
  elementsWithColor.forEach((element, index) => {
    issues.push({
      type: 'color_contrast',
      element: `element[${index}]`,
      description: 'Manual color contrast check needed',
      severity: 'info'
    });
  });

  // Calculate score
  const errorCount = issues.filter(issue => issue.severity === 'error').length;
  const warningCount = issues.filter(issue => issue.severity === 'warning').length;
  const score = Math.max(0, 100 - (errorCount * 10) - (warningCount * 5));

  return { issues, score };
}

// User testing utilities
export function createUserTestingSession(): {
  startSession: () => void;
  endSession: () => void;
  recordAction: (action: string, element?: string) => void;
  getSessionData: () => any;
} {
  let sessionData: any = {
    startTime: null,
    endTime: null,
    actions: [],
    browser: detectBrowser(),
    features: detectFeatures(),
    viewport: typeof window !== 'undefined' ? {
      width: window.innerWidth,
      height: window.innerHeight
    } : null
  };

  return {
    startSession: () => {
      sessionData.startTime = new Date().toISOString();
      console.log('User testing session started');
    },
    
    endSession: () => {
      sessionData.endTime = new Date().toISOString();
      sessionData.duration = sessionData.endTime - sessionData.startTime;
      console.log('User testing session ended', sessionData);
    },
    
    recordAction: (action: string, element?: string) => {
      sessionData.actions.push({
        action,
        element,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : null
      });
    },
    
    getSessionData: () => sessionData
  };
}

// Cross-browser compatibility checker
export function checkCompatibility(): {
  compatible: boolean;
  issues: string[];
  recommendations: string[];
} {
  const browser = detectBrowser();
  const features = detectFeatures();
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check browser versions
  const minVersions = {
    Chrome: 90,
    Firefox: 88,
    Safari: 14,
    Edge: 90
  };

  const browserVersion = parseInt(browser.version);
  const minVersion = minVersions[browser.name as keyof typeof minVersions];

  if (minVersion && browserVersion < minVersion) {
    issues.push(`${browser.name} ${browser.version} is outdated. Minimum version: ${minVersion}`);
    recommendations.push(`Please update ${browser.name} to the latest version`);
  }

  // Check critical features
  const criticalFeatures = ['localStorage', 'fetch', 'cssFlexbox'];
  criticalFeatures.forEach(feature => {
    if (!features[feature]) {
      issues.push(`Missing critical feature: ${feature}`);
      recommendations.push(`This browser doesn't support ${feature}`);
    }
  });

  // Check optional but recommended features
  const recommendedFeatures = ['serviceWorker', 'intersectionObserver', 'webP'];
  recommendedFeatures.forEach(feature => {
    if (!features[feature]) {
      recommendations.push(`Consider enabling ${feature} for better experience`);
    }
  });

  return {
    compatible: issues.length === 0,
    issues,
    recommendations
  };
}
