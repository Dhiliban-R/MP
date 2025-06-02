import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const checks: Record<string, any> = {};
    let overallStatus = 'healthy';
    
    // Check Firebase connectivity
    try {
      const healthDoc = doc(db, 'system', 'health');
      await setDoc(healthDoc, {
        lastCheck: serverTimestamp(),
        status: 'healthy'
      }, { merge: true });
      
      const docSnap = await getDoc(healthDoc);
      checks.firebase = {
        status: 'healthy',
        connected: docSnap.exists(),
        latency: Date.now() - startTime
      };
    } catch (error) {
      checks.firebase = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        connected: false
      };
      overallStatus = 'unhealthy';
    }
    
    // Check environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    checks.environment = {
      status: missingEnvVars.length === 0 ? 'healthy' : 'unhealthy',
      missing_variables: missingEnvVars
    };
    
    if (missingEnvVars.length > 0) {
      overallStatus = 'degraded';
    }
    
    // Check system resources (basic)
    checks.system = {
      status: 'healthy',
      uptime: process.uptime(),
      memory_usage: process.memoryUsage(),
      node_version: process.version
    };
    
    // Check external dependencies
    checks.external_apis = {
      status: 'healthy',
      google_maps: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'configured' : 'not_configured'
    };
    
    const responseTime = Date.now() - startTime;
    
    const healthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      response_time_ms: responseTime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks
    };
    
    // Return appropriate HTTP status code
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;
    
    return NextResponse.json(healthResponse, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      response_time_ms: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      checks: {}
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}

// Optional: Add a more detailed health check endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { detailed = false } = body;
    
    if (!detailed) {
      // Return basic health check
      return GET(request);
    }
    
    // Detailed health check
    const startTime = Date.now();
    const checks: Record<string, any> = {};
    
    // Test database operations
    try {
      const testDoc = doc(db, 'health', 'detailed-check');
      const testData = {
        timestamp: serverTimestamp(),
        test: true
      };
      
      await setDoc(testDoc, testData);
      const readDoc = await getDoc(testDoc);
      
      checks.database_operations = {
        status: 'healthy',
        write_test: 'passed',
        read_test: readDoc.exists() ? 'passed' : 'failed',
        latency: Date.now() - startTime
      };
    } catch (error) {
      checks.database_operations = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    // Check collections
    try {
      const collections = ['users', 'donations', 'reservations', 'notifications'];
      const collectionChecks: Record<string, any> = {};
      
      for (const collectionName of collections) {
        try {
          const testDoc = doc(db, collectionName, 'health-check');
          await getDoc(testDoc); // Just test read access
          collectionChecks[collectionName] = 'accessible';
        } catch (error) {
          collectionChecks[collectionName] = 'error';
        }
      }
      
      checks.collections = {
        status: Object.values(collectionChecks).every(status => status === 'accessible') ? 'healthy' : 'degraded',
        details: collectionChecks
      };
    } catch (error) {
      checks.collections = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    
    const responseTime = Date.now() - startTime;
    const overallStatus = Object.values(checks).every(check => check.status === 'healthy') ? 'healthy' : 'degraded';
    
    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      response_time_ms: responseTime,
      detailed: true,
      checks
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      detailed: true
    }, { status: 500 });
  }
}
