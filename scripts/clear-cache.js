#!/usr/bin/env node

/**
 * Clear Cache Script
 * Clears all Next.js, Node.js, and browser-related caches
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Function to safely remove directory
function removeDirectory(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      if (process.platform === 'win32') {
        execSync(`rmdir /s /q "${dirPath}"`, { stdio: 'inherit' });
      } else {
        execSync(`rm -rf "${dirPath}"`, { stdio: 'inherit' });
      }
      logSuccess(`Removed ${dirPath}`);
      return true;
    } else {
      logWarning(`Directory ${dirPath} does not exist`);
      return false;
    }
  } catch (error) {
    logError(`Failed to remove ${dirPath}: ${error.message}`);
    return false;
  }
}

// Function to safely remove file
function removeFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logSuccess(`Removed ${filePath}`);
      return true;
    } else {
      logWarning(`File ${filePath} does not exist`);
      return false;
    }
  } catch (error) {
    logError(`Failed to remove ${filePath}: ${error.message}`);
    return false;
  }
}

// Main cache clearing function
async function clearAllCaches() {
  logInfo('🧹 Starting comprehensive cache clearing...\n');

  let clearedCount = 0;
  let totalAttempts = 0;

  // 1. Clear Next.js cache
  logInfo('1. Clearing Next.js caches...');
  const nextjsCaches = ['.next', 'out', 'dist', '.next/cache'];
  
  nextjsCaches.forEach(cache => {
    totalAttempts++;
    if (removeDirectory(cache)) {
      clearedCount++;
    }
  });

  // 2. Clear Node.js cache
  logInfo('\n2. Clearing Node.js caches...');
  const nodeCaches = ['node_modules/.cache', '.npm', '.yarn/cache'];
  
  nodeCaches.forEach(cache => {
    totalAttempts++;
    if (removeDirectory(cache)) {
      clearedCount++;
    }
  });

  // 3. Clear package manager lock files (optional)
  logInfo('\n3. Clearing package manager files...');
  const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
  
  lockFiles.forEach(file => {
    totalAttempts++;
    if (removeFile(file)) {
      clearedCount++;
    }
  });

  // 4. Clear TypeScript cache
  logInfo('\n4. Clearing TypeScript cache...');
  const tsCaches = ['tsconfig.tsbuildinfo', '.tsbuildinfo'];
  
  tsCaches.forEach(cache => {
    totalAttempts++;
    if (removeFile(cache)) {
      clearedCount++;
    }
  });

  // 5. Clear ESLint cache
  logInfo('\n5. Clearing ESLint cache...');
  totalAttempts++;
  if (removeFile('.eslintcache')) {
    clearedCount++;
  }

  // 6. Clear Webpack cache
  logInfo('\n6. Clearing Webpack cache...');
  const webpackCaches = ['node_modules/.cache/webpack'];
  
  webpackCaches.forEach(cache => {
    totalAttempts++;
    if (removeDirectory(cache)) {
      clearedCount++;
    }
  });

  // 7. Clear npm cache (if npm is available)
  logInfo('\n7. Clearing npm cache...');
  try {
    execSync('npm cache clean --force', { stdio: 'inherit' });
    logSuccess('npm cache cleared');
    clearedCount++;
  } catch (error) {
    logWarning('npm cache clean failed or npm not available');
  }
  totalAttempts++;

  // 8. Clear yarn cache (if yarn is available)
  logInfo('\n8. Clearing yarn cache...');
  try {
    execSync('yarn cache clean', { stdio: 'inherit' });
    logSuccess('yarn cache cleared');
    clearedCount++;
  } catch (error) {
    logWarning('yarn cache clean failed or yarn not available');
  }
  totalAttempts++;

  // Summary
  console.log('\n' + '='.repeat(50));
  logInfo('🎯 Cache Clearing Summary');
  console.log('='.repeat(50));
  
  logSuccess(`Successfully cleared: ${clearedCount}/${totalAttempts} items`);
  
  if (clearedCount === totalAttempts) {
    logSuccess('🎉 All caches cleared successfully!');
  } else if (clearedCount > 0) {
    logWarning(`⚠️  Some caches couldn't be cleared (${totalAttempts - clearedCount} items)`);
  } else {
    logError('❌ No caches were cleared');
  }

  console.log('\n💡 Next steps:');
  console.log('1. Run: npm install (or yarn install)');
  console.log('2. Run: npm run dev (or yarn dev)');
  console.log('3. Clear browser cache and hard refresh (Ctrl+Shift+R)');
  
  console.log('\n🔧 If webpack errors persist:');
  console.log('1. Restart your IDE/editor');
  console.log('2. Check for circular dependencies');
  console.log('3. Verify all imports are correct');
  console.log('4. Check for missing dependencies in package.json');
}

// Run the cache clearing
clearAllCaches().catch(error => {
  logError(`Cache clearing failed: ${error.message}`);
  process.exit(1);
});
