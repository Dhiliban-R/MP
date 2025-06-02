import { NextRequest, NextResponse } from 'next/server';
import { clearAllRateLimits, getRateLimitStats } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { identifier } = body;

    // Get stats before clearing
    const statsBefore = getRateLimitStats();

    if (identifier) {
      // Clear rate limits for specific identifier
      clearAllRateLimits(identifier);
    } else {
      // Clear all rate limits by clearing all identifiers
      // We'll need to get all unique identifiers first
      const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        'unknown';
      
      clearAllRateLimits(clientIP);
      clearAllRateLimits('localhost');
      clearAllRateLimits('127.0.0.1');
      clearAllRateLimits('unknown');
    }

    const statsAfter = getRateLimitStats();

    return NextResponse.json({
      success: true,
      message: identifier 
        ? `Cleared rate limits for identifier: ${identifier}`
        : 'Cleared all rate limits',
      stats: {
        before: statsBefore,
        after: statsAfter
      }
    });

  } catch (error) {
    console.error('Error clearing rate limits:', error);
    return NextResponse.json(
      { 
        error: 'Failed to clear rate limits',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  try {
    const stats = getRateLimitStats();
    
    return NextResponse.json({
      success: true,
      stats,
      message: 'Rate limit statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting rate limit stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get rate limit statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
