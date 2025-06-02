'use client';

/**
 * Analytics and tracking utilities for FDMS
 */

// Google Analytics 4 configuration
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Analytics events interface
interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

// User properties interface
interface UserProperties {
  user_type?: 'donor' | 'recipient' | 'admin';
  organization_type?: string;
  location?: string;
  registration_date?: string;
}

class Analytics {
  private static instance: Analytics;
  private isInitialized = false;
  private debugMode = process.env.NODE_ENV === 'development';

  static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  // Initialize Google Analytics
  initialize(measurementId: string) {
    if (this.isInitialized || typeof window === 'undefined') return;

    // Load Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };

    // Configure Google Analytics
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      page_title: document.title,
      page_location: window.location.href,
      debug_mode: this.debugMode,
      send_page_view: true
    });

    this.isInitialized = true;

    if (this.debugMode) {
      console.log('Analytics initialized with ID:', measurementId);
    }
  }

  // Track page views
  trackPageView(url: string, title?: string) {
    if (!this.isInitialized) return;

    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
      page_path: url,
      page_title: title || document.title,
    });

    if (this.debugMode) {
      console.log('Page view tracked:', { url, title });
    }
  }

  // Track custom events
  trackEvent(event: AnalyticsEvent) {
    if (!this.isInitialized) return;

    const { action, category, label, value, custom_parameters } = event;

    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      ...custom_parameters
    });

    if (this.debugMode) {
      console.log('Event tracked:', event);
    }
  }

  // Track user properties
  setUserProperties(properties: UserProperties) {
    if (!this.isInitialized) return;

    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
      custom_map: properties
    });

    if (this.debugMode) {
      console.log('User properties set:', properties);
    }
  }

  // Track conversions
  trackConversion(conversionId: string, value?: number, currency = 'USD') {
    if (!this.isInitialized) return;

    window.gtag('event', 'conversion', {
      send_to: conversionId,
      value: value,
      currency: currency
    });

    if (this.debugMode) {
      console.log('Conversion tracked:', { conversionId, value, currency });
    }
  }

  // Track errors
  trackError(error: Error, context?: string) {
    if (!this.isInitialized) return;

    this.trackEvent({
      action: 'exception',
      category: 'error',
      label: context || 'unknown',
      custom_parameters: {
        description: error.message,
        fatal: false,
        stack: error.stack
      }
    });

    if (this.debugMode) {
      console.log('Error tracked:', { error, context });
    }
  }

  // Track performance metrics
  trackPerformance(metric: string, value: number, unit = 'ms') {
    if (!this.isInitialized) return;

    this.trackEvent({
      action: 'timing_complete',
      category: 'performance',
      label: metric,
      value: Math.round(value),
      custom_parameters: {
        metric_unit: unit
      }
    });

    if (this.debugMode) {
      console.log('Performance tracked:', { metric, value, unit });
    }
  }
}

// Predefined event tracking functions
export const analytics = Analytics.getInstance();

// Common event trackers
export const trackUserRegistration = (userType: 'donor' | 'recipient', method: 'email' | 'google') => {
  analytics.trackEvent({
    action: 'sign_up',
    category: 'engagement',
    label: userType,
    custom_parameters: {
      method,
      user_type: userType
    }
  });
};

export const trackUserLogin = (userType: 'donor' | 'recipient' | 'admin', method: 'email' | 'google') => {
  analytics.trackEvent({
    action: 'login',
    category: 'engagement',
    label: userType,
    custom_parameters: {
      method,
      user_type: userType
    }
  });
};

export const trackDonationCreated = (category: string, quantity: number) => {
  analytics.trackEvent({
    action: 'donation_created',
    category: 'donation',
    label: category,
    value: quantity,
    custom_parameters: {
      donation_category: category
    }
  });
};

export const trackDonationClaimed = (donationId: string, category: string) => {
  analytics.trackEvent({
    action: 'donation_claimed',
    category: 'donation',
    label: category,
    custom_parameters: {
      donation_id: donationId,
      donation_category: category
    }
  });
};

export const trackMapInteraction = (action: 'view' | 'search' | 'filter', details?: string) => {
  analytics.trackEvent({
    action: `map_${action}`,
    category: 'map',
    label: details,
    custom_parameters: {
      interaction_type: action
    }
  });
};

export const trackSearchQuery = (query: string, resultsCount: number) => {
  analytics.trackEvent({
    action: 'search',
    category: 'engagement',
    label: query,
    value: resultsCount,
    custom_parameters: {
      search_term: query,
      results_count: resultsCount
    }
  });
};

export const trackFormSubmission = (formName: string, success: boolean, errors?: string[]) => {
  analytics.trackEvent({
    action: success ? 'form_submit_success' : 'form_submit_error',
    category: 'form',
    label: formName,
    custom_parameters: {
      form_name: formName,
      errors: errors?.join(', ')
    }
  });
};

export const trackPagePerformance = (pageName: string, loadTime: number) => {
  analytics.trackPerformance(`page_load_${pageName}`, loadTime);
};

// Initialize analytics if measurement ID is available
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
  analytics.initialize(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);
}

export default analytics;
