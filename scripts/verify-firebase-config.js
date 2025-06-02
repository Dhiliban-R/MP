#!/usr/bin/env node

/**
 * Firebase Configuration Verification Script
 * This script verifies that all Firebase environment variables are properly set
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'
];

const optionalEnvVars = [
  'NEXT_PUBLIC_FIREBASE_VAPID_KEY'
];

console.log('🔥 Firebase Configuration Verification\n');

// Load environment variables manually
const fs = require('fs');
const path = require('path');

try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key.trim()] = value.trim();
      }
    }
  });
} catch (error) {
  console.error('Error reading .env.local file:', error.message);
}

let allValid = true;

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`✅ ${envVar}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${envVar}: NOT SET`);
    allValid = false;
  }
});

console.log('\n📋 Optional Variables:');
optionalEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`✅ ${envVar}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`⚪ ${envVar}: NOT SET (optional)`);
  }
});

console.log('\n' + '='.repeat(50));

if (allValid) {
  console.log('🎉 All required Firebase environment variables are properly configured!');
  console.log('🚀 Your Firebase configuration is ready for use.');

  // Check for VAPID key specifically
  if (!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) {
    console.log('\n⚠️  Note: VAPID key is not set. This is required for push notifications.');
    console.log('📝 Run: node scripts/generate-vapid-key.js for instructions.');
  }
} else {
  console.log('⚠️  Some required Firebase environment variables are missing.');
  console.log('📝 Please check your .env.local file.');
  process.exit(1);
}

// Verify Firebase config object structure
try {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  };

  console.log('\n📋 Firebase Configuration Object:');
  console.log(JSON.stringify(firebaseConfig, null, 2));
  
} catch (error) {
  console.error('❌ Error creating Firebase config object:', error);
  process.exit(1);
}
