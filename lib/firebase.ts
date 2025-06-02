import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyBt01LvtM44Q0iFWnKlAuYC9V-mycCb5go",
  authDomain: "fdms-e94f8.firebaseapp.com",
  projectId: "fdms-e94f8",
  storageBucket: "fdms-e94f8.firebasestorage.app",
  messagingSenderId: "103517737213",
  appId: "1:103517737213:web:d3e57cd8f8afb1421dee94",
  measurementId: "G-QNZ1WLDTWC"
};

// Initialize Firebase
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
