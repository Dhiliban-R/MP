import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    // Read the service worker file from the public directory
    const swPath = join(process.cwd(), 'public', 'firebase-messaging-sw.js');
    const swContent = readFileSync(swPath, 'utf8');

    // Return the service worker with proper headers
    return new NextResponse(swContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Service-Worker-Allowed': '/',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error serving service worker:', error);
    return new NextResponse('Service worker not found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}
