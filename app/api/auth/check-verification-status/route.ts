import { NextRequest, NextResponse } from 'next/server';

// For development, we'll use a simplified approach that doesn't require Firebase Admin SDK
// In production, you should set up Firebase Admin SDK with proper service account credentials

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For development, we'll return a simplified response that doesn't break the flow
    // In production, you should implement proper Firebase Admin SDK verification
    if (process.env.NODE_ENV === 'development') {
      // In development, we'll return a neutral response that allows client-side handling
      // The client-side Firebase SDK will handle the actual verification check
      return NextResponse.json({
        emailVerified: true, // Return true to avoid blocking development flow
        message: 'Development mode: Client-side verification handling enabled'
      }, { status: 200 });
    }

    // For production, you would implement Firebase Admin SDK verification here
    return NextResponse.json({
      error: 'Firebase Admin SDK not configured. Please set up service account credentials.'
    }, { status: 500 });

  } catch (error: any) {
    console.error('Error checking email verification status:', error);
    return NextResponse.json({ error: 'Failed to check email verification status.' }, { status: 500 });
  }
}