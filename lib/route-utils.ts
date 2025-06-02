// Public routes that don't require email verification
export const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/profile/verify-email',
  '/terms',
  '/privacy',
  '/about',
  '/help',
  '/contact',
];

// API routes that don't require email verification
export const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-email',
  '/api/auth/resend-verification',
  '/api/auth/forgot-password',
  '/api/health',
  '/api/dev/', // Development endpoints
  '/api/auth/check-verification-status', // Added for explicit check
];

/**
 * Check if a route is public and doesn't require email verification
 */
export function isPublicRoute(path: string): boolean {
  // Check exact matches
  if (PUBLIC_ROUTES.includes(path)) {
    return true;
  }

  // Check API routes with startsWith for exact matches and regex for wildcards
  if (path.startsWith('/api/')) {
    return PUBLIC_API_ROUTES.some(route => {
      if (route.endsWith('/')) { // Handle wildcard API routes like /api/dev/
        return path.startsWith(route);
      }
      return path === route; // Exact match for API routes
    });
  }

  // Check wildcard patterns for static assets
  const wildcardPatterns = [
    '/static/*',
    '/_next/*',
    '/favicon*',
    '/manifest*',
    '/images/*',
  ];

  return wildcardPatterns.some(pattern => {
    const regexPattern = pattern.replace('*', '.*');
    return new RegExp(`^${regexPattern}$`).test(path);
  });
}