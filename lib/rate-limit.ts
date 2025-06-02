// Simple in-memory rate limiting for development
// In production, use Redis or similar distributed cache

interface RateLimitConfig {
  requests: number;
  window: string; // e.g., '15m', '1h', '1d'
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Parse time window string to milliseconds
function parseTimeWindow(window: string): number {
  const match = window.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid time window format: ${window}`);
  }
  
  const [, amount, unit] = match;
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };
  
  return parseInt(amount) * multipliers[unit as keyof typeof multipliers];
}

// Clean up expired entries
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Rate limit function
export async function rateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<{
  success: boolean;
  remaining?: number;
  resetTime?: number;
  retryAfter?: number;
}> {
  // Clean up expired entries periodically
  if (Math.random() < 0.01) { // 1% chance to cleanup
    cleanupExpiredEntries();
  }
  
  const windowMs = parseTimeWindow(config.window);
  const key = `${identifier}:${endpoint}`;
  const now = Date.now();
  
  let entry = rateLimitStore.get(key);
  
  // If no entry exists or it's expired, create a new one
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + windowMs
    };
    rateLimitStore.set(key, entry);
    
    return {
      success: true,
      remaining: config.requests - 1,
      resetTime: entry.resetTime
    };
  }
  
  // If within the window, increment count
  if (entry.count >= config.requests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000)
    };
  }
  
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return {
    success: true,
    remaining: config.requests - entry.count,
    resetTime: entry.resetTime
  };
}

// Get current rate limit status
export function getRateLimitStatus(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): {
  remaining: number;
  resetTime: number;
  isLimited: boolean;
} {
  const key = `${identifier}:${endpoint}`;
  const entry = rateLimitStore.get(key);
  const now = Date.now();
  
  if (!entry || now > entry.resetTime) {
    return {
      remaining: config.requests,
      resetTime: now + parseTimeWindow(config.window),
      isLimited: false
    };
  }
  
  return {
    remaining: Math.max(0, config.requests - entry.count),
    resetTime: entry.resetTime,
    isLimited: entry.count >= config.requests
  };
}

// Clear rate limit for a specific identifier and endpoint
export function clearRateLimit(identifier: string, endpoint: string): void {
  const key = `${identifier}:${endpoint}`;
  rateLimitStore.delete(key);
}

// Clear all rate limits for an identifier
export function clearAllRateLimits(identifier: string): void {
  for (const key of rateLimitStore.keys()) {
    if (key.startsWith(`${identifier}:`)) {
      rateLimitStore.delete(key);
    }
  }
}

// Get rate limit statistics
export function getRateLimitStats(): {
  totalEntries: number;
  activeEntries: number;
  expiredEntries: number;
} {
  const now = Date.now();
  let activeEntries = 0;
  let expiredEntries = 0;
  
  for (const entry of rateLimitStore.values()) {
    if (now > entry.resetTime) {
      expiredEntries++;
    } else {
      activeEntries++;
    }
  }
  
  return {
    totalEntries: rateLimitStore.size,
    activeEntries,
    expiredEntries
  };
}
