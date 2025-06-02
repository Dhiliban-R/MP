import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from './lib/rate-limit';
import { isPublicRoute } from './lib/route-utils'; // Import from new utility

// Grace period configuration in milliseconds
const GRACE_PERIOD_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Security headers
const securityHeaders = {
  'X-XSS-Protection': '1; mode=block',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com https://www.googletagmanager.com https://apis.google.com https://www.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net wss://*.firebaseio.com https://accounts.google.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com",
    "frame-src 'self' https://www.google.com https://accounts.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ')
};

// Rate limiting configuration - more lenient in development
const rateLimitConfig = process.env.NODE_ENV === 'development' ? {
  '/api/': { requests: 2000, window: '15m' },
  '/api/auth/': { requests: 200, window: '15m' },
  '/api/donations/create': { requests: 100, window: '1h' },
  '/api/reservations/create': { requests: 200, window: '1h' },
  '/auth/login': { requests: 500, window: '15m' },
  '/auth/register': { requests: 100, window: '15m' },
  '/auth/forgot-password': { requests: 50, window: '15m' },
  '/contact': { requests: 50, window: '1h' },
  '/api/contact': { requests: 50, window: '1h' }
} : {
  '/api/': { requests: 100, window: '15m' },
  '/api/auth/': { requests: 10, window: '15m' },
  '/api/donations/create': { requests: 5, window: '1h' },
  '/api/reservations/create': { requests: 10, window: '1h' },
  '/auth/login': { requests: 20, window: '15m' },
  '/auth/register': { requests: 5, window: '15m' },
  '/auth/forgot-password': { requests: 3, window: '15m' },
  '/contact': { requests: 3, window: '1h' },
  '/api/contact': { requests: 3, window: '1h' }
};

/**
 * Check if user is within grace period for email verification
 * @param creationTimeStr Account creation time from cookies
 * @returns Boolean indicating if user is in grace period
 */
function isInGracePeriod(creationTimeStr: string | undefined): boolean {
  if (!creationTimeStr) return false;
  
  try {
    const creationTime = new Date(creationTimeStr);
    const timeSinceCreation = Date.now() - creationTime.getTime();
    return timeSinceCreation < GRACE_PERIOD_DURATION;
  } catch (e) {
    console.error('Error parsing account creation time:', e);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Handle static files with proper MIME types
  if (path.endsWith('.svg')) {
    const response = NextResponse.next();
    response.headers.set('Content-Type', 'image/svg+xml');
    response.headers.set('Cache-Control', 'public, max-age=86400');
    return response;
  }

  if (path.endsWith('.js') || path.includes('firebase-messaging-sw.js')) {
    const response = NextResponse.next();
    response.headers.set('Content-Type', 'application/javascript; charset=utf-8');
    if (path.includes('firebase-messaging-sw.js')) {
      response.headers.set('Service-Worker-Allowed', '/');
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    return response;
  }

  if (path.endsWith('.css')) {
    const response = NextResponse.next();
    response.headers.set('Content-Type', 'text/css; charset=utf-8');
    return response;
  }

  // Create response with security headers
  const response = NextResponse.next();

  // Apply security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add HSTS header for HTTPS
  if (request.nextUrl.protocol === 'https:') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Get client IP for rate limiting
  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  // Apply rate limiting (skip in development for localhost)
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isLocalhost = request.nextUrl.hostname === 'localhost' || request.nextUrl.hostname === '127.0.0.1';

  if (!isDevelopment || !isLocalhost) {
    const rateLimitRule = Object.entries(rateLimitConfig).find(([rulePath]) =>
      path.startsWith(rulePath)
    );

    if (rateLimitRule) {
      const [, config] = rateLimitRule;
      const rateLimitResult = await rateLimit(clientIP, path, config);

      if (!rateLimitResult.success) {
        return new NextResponse(
          JSON.stringify({
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: rateLimitResult.retryAfter
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': rateLimitResult.retryAfter?.toString() || '900',
              'X-RateLimit-Limit': config.requests.toString(),
              'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0',
              'X-RateLimit-Reset': rateLimitResult.resetTime?.toString() || '',
              ...Object.fromEntries(Object.entries(securityHeaders))
            }
          }
        );
      }

      // Add rate limit headers to successful responses
      if (rateLimitResult.remaining !== undefined) {
        response.headers.set('X-RateLimit-Limit', config.requests.toString());
        response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      }
      if (rateLimitResult.resetTime) {
        response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
      }
    }
  }

  // Skip auth middleware for public routes
  if (isPublicRoute(path)) {
    return response;
  }

  // TEMPORARILY DISABLE AUTH MIDDLEWARE FOR URGENT SUBMISSION
  // TODO: Re-enable after submission
  return response;

  // Check for auth token in cookies
  const authCookie = request.cookies.get('auth_token')?.value;
  const emailVerifiedCookie = request.cookies.get('email_verified')?.value;
  const accountCreationTime = request.cookies.get('account_creation_time')?.value;
  
  // If no auth token, redirect to login
  if (!authCookie) {
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('from', path);
    return NextResponse.redirect(url);
  }
  
  // Get feature-specific requirements
  const pathSegments = path.split('/').filter(Boolean);
  const isFeaturePath = pathSegments.length >= 2;
  const featureCategory = isFeaturePath ? pathSegments[0] : '';
  
  // Features with strict verification requirements even during grace period
  const strictVerificationFeatures = ['donate', 'chat', 'reserve'];
  const requiresStrictVerification = strictVerificationFeatures.includes(featureCategory);
  
  // If auth token exists but email is not verified
  if (authCookie && emailVerifiedCookie === 'false') { // Explicitly check for 'false'
    // Check if the user is in grace period
    const inGracePeriod = isInGracePeriod(accountCreationTime);
    
    // For strict verification features, always require verification
    if (requiresStrictVerification) {
      // Don't redirect if already on the verification page
      if (path === '/profile/verify-email') {
        return NextResponse.next();
      }
      
      const url = new URL('/profile/verify-email', request.url);
      url.searchParams.set('feature', featureCategory);
      url.searchParams.set('from', path);
      return NextResponse.redirect(url);
    }
    
    // Allow access during grace period for non-strict features
    if (inGracePeriod && !requiresStrictVerification) {
      // Add grace period warning header to existing response
      response.headers.set('X-Verification-Status', 'grace-period');
      if (accountCreationTime) {
        const creationTime = new Date(accountCreationTime);
        if (!isNaN(creationTime.getTime())) { // Validate date
          response.headers.set('X-Grace-Period-Expires',
                              new Date(creationTime.getTime() + GRACE_PERIOD_DURATION).toISOString());
        }
      }
      return response;
    }
    
    // Outside grace period or strict feature - redirect to verification page
    // Don't redirect if already on the verification page
    if (path === '/profile/verify-email') {
      return NextResponse.next();
    }
    
    const url = new URL('/profile/verify-email', request.url);
    url.searchParams.set('from', path);
    if (featureCategory) {
      url.searchParams.set('feature', featureCategory);
    }
    return NextResponse.redirect(url);
  }
  
  // Otherwise, continue to the protected route
  // Add verification status header for client-side awareness

  // Add verified status to response headers for client-side awareness
  if (emailVerifiedCookie === 'true') {
    response.headers.set('X-Verification-Status', 'verified');
  } else {
    const inGracePeriod = isInGracePeriod(accountCreationTime);
    response.headers.set('X-Verification-Status', inGracePeriod ? 'grace-period' : 'unverified');

    if (inGracePeriod && accountCreationTime) {
      const creationTime = new Date(accountCreationTime);
      if (!isNaN(creationTime.getTime())) { // Validate date
        response.headers.set('X-Grace-Period-Expires',
                            new Date(creationTime.getTime() + GRACE_PERIOD_DURATION).toISOString());
      }
    }
  }
  
  return response;
}

// Configure middleware to run on specific paths
export const config = {
  // Apply middleware to all routes except static files and Next.js internals
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public directory (e.g., /public/images, /public/manifest.json)
     * - specific static assets like logo.svg, manifest.json
     * - firebase-messaging-sw.js (handled separately)
     * - Any files with extensions like .png, .jpg, .jpeg, .gif, .webp, .json, .xml, .txt, .pdf, .mp4, .webm, .ogg, .mp3, .wav, .flac, .aac
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|logo.svg|manifest.json|firebase-messaging-sw.js|.*\\.(?:png|jpg|jpeg|gif|webp|json|xml|txt|pdf|mp4|webm|ogg|mp3|wav|flac|aac)$).*)',
  ],
};
