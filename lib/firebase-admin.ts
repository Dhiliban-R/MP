import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

let adminApp: App | null = null;

export const initAdminApp = (): App => {
  if (adminApp) {
    return adminApp;
  }

  // Check if admin app is already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  try {
    // Initialize Firebase Admin SDK
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    // Validate required environment variables
    if (!serviceAccount.projectId) {
      throw new Error('FIREBASE_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID is required');
    }

    // For development, we can use the default credentials or a simplified approach
    if (process.env.NODE_ENV === 'development' && (!serviceAccount.clientEmail || !serviceAccount.privateKey)) {
      console.warn('Firebase Admin SDK: Using default credentials for development');
      adminApp = initializeApp({
        projectId: serviceAccount.projectId,
      });
    } else {
      // Production configuration with service account
      if (!serviceAccount.clientEmail || !serviceAccount.privateKey) {
        console.warn('Firebase Admin SDK: Missing credentials, using default configuration');
        adminApp = initializeApp({
          projectId: serviceAccount.projectId,
        });
      } else {
        adminApp = initializeApp({
          credential: cert(serviceAccount),
          projectId: serviceAccount.projectId,
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
      }
    }

    console.log('Firebase Admin SDK initialized successfully');
    return adminApp;
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    throw error;
  }
};

// Export admin services
export const getAdminAuth = () => {
  const app = initAdminApp();
  return getAuth(app);
};

export const getAdminFirestore = () => {
  const app = initAdminApp();
  return getFirestore(app);
};

export const getAdminStorage = () => {
  const app = initAdminApp();
  return getStorage(app);
};

export default initAdminApp;
