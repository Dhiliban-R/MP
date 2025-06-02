import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Check for critical Firebase configuration variables
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error(
    "CRITICAL: Firebase API Key or Project ID is not set in environment variables. " +
    "Firebase functionalities will be severely impacted or fail. " +
    "Please ensure NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID are correctly set."
  );
  // In a stricter setup, you might throw an error here, especially if not in a test environment.
  // throw new Error("Firebase configuration is missing critical environment variables.");
}


// Initialize Firebase
// Check if Firebase app has already been initialized to prevent re-initialization error
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Configure auth settings
if (typeof window !== 'undefined') {
  auth.useDeviceLanguage();
}

// Firebase emulator connections for development
if (typeof window !== 'undefined' && process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true") {
  try {
    connectFirestoreEmulator(db, "localhost", 8080);
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    connectStorageEmulator(storage, "localhost", 9199);
    connectFunctionsEmulator(functions, "localhost", 5001);
    console.log("Firebase emulators connected successfully");
  } catch (error) {
    console.warn("Failed to connect to Firebase emulators:", error);
  }
}

export { app, auth, db, storage, functions };
