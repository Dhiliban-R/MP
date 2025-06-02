import { initializeApp, getApps, getApp } from 'firebase/app';

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
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);