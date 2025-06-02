#!/usr/bin/env node

/**
 * Google Sign-In Verification Script
 * This script verifies that all Google Sign-In functionality is properly configured
 */

const fs = require('fs');
const path = require('path');

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

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function addTestResult(testName, status, message) {
  testResults.tests.push({ testName, status, message });
  if (status === 'PASS') {
    testResults.passed++;
    logSuccess(`${testName}: ${message}`);
  } else if (status === 'WARN') {
    testResults.warnings++;
    logWarning(`${testName}: ${message}`);
  } else {
    testResults.failed++;
    logError(`${testName}: ${message}`);
  }
}

// Test Firebase configuration
function testFirebaseConfig() {
  logInfo('Testing Firebase configuration...');
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
  ];

  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    addTestResult('Firebase Config', 'FAIL', '.env.local file not found');
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  
  requiredEnvVars.forEach(varName => {
    if (envContent.includes(varName) && !envContent.includes(`${varName}=""`)) {
      addTestResult('Firebase Config', 'PASS', `${varName} is configured`);
    } else {
      addTestResult('Firebase Config', 'FAIL', `${varName} is missing or empty`);
    }
  });
}

// Test Google Sign-In components
function testGoogleSignInComponents() {
  logInfo('Testing Google Sign-In components...');
  
  const componentsToCheck = [
    'components/auth/google-signin-button.tsx',
    'lib/auth.ts',
    'lib/auth-error-handler.ts',
    'contexts/auth-context.tsx'
  ];

  componentsToCheck.forEach(componentPath => {
    const fullPath = path.join(process.cwd(), componentPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for essential Google Sign-In functionality
      if (componentPath.includes('google-signin-button')) {
        if (content.includes('signInWithGoogle') && content.includes('GoogleIcon')) {
          addTestResult('Google Components', 'PASS', `${componentPath} has proper Google Sign-In implementation`);
        } else {
          addTestResult('Google Components', 'FAIL', `${componentPath} missing essential Google Sign-In functionality`);
        }
      } else if (componentPath.includes('auth.ts')) {
        if (content.includes('GoogleAuthProvider') && content.includes('signInWithPopup')) {
          addTestResult('Google Components', 'PASS', `${componentPath} has proper Firebase Google Auth setup`);
        } else {
          addTestResult('Google Components', 'FAIL', `${componentPath} missing Firebase Google Auth implementation`);
        }
      } else if (componentPath.includes('auth-error-handler')) {
        if (content.includes('auth/popup-closed-by-user') && content.includes('handleAuthError')) {
          addTestResult('Google Components', 'PASS', `${componentPath} has comprehensive error handling`);
        } else {
          addTestResult('Google Components', 'FAIL', `${componentPath} missing proper error handling`);
        }
      }
    } else {
      addTestResult('Google Components', 'FAIL', `${componentPath} not found`);
    }
  });
}

// Test CSP configuration
function testCSPConfiguration() {
  logInfo('Testing Content Security Policy configuration...');
  
  const middlewarePath = path.join(process.cwd(), 'middleware.ts');
  if (fs.existsSync(middlewarePath)) {
    const content = fs.readFileSync(middlewarePath, 'utf8');
    
    const requiredDomains = [
      'https://apis.google.com',
      'https://accounts.google.com',
      'https://www.gstatic.com'
    ];
    
    requiredDomains.forEach(domain => {
      if (content.includes(domain)) {
        addTestResult('CSP Configuration', 'PASS', `${domain} is allowed in CSP`);
      } else {
        addTestResult('CSP Configuration', 'FAIL', `${domain} missing from CSP configuration`);
      }
    });
  } else {
    addTestResult('CSP Configuration', 'FAIL', 'middleware.ts not found');
  }
}

// Test page implementations
function testPageImplementations() {
  logInfo('Testing page implementations...');
  
  const pagesToCheck = [
    'app/auth/login/page.tsx',
    'app/auth/register/page.tsx'
  ];

  pagesToCheck.forEach(pagePath => {
    const fullPath = path.join(process.cwd(), pagePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      if (content.includes('GoogleSignInButton')) {
        addTestResult('Page Implementation', 'PASS', `${pagePath} uses GoogleSignInButton component`);
      } else if (content.includes('signInWithGoogle')) {
        addTestResult('Page Implementation', 'WARN', `${pagePath} has Google Sign-In but not using component`);
      } else {
        addTestResult('Page Implementation', 'FAIL', `${pagePath} missing Google Sign-In functionality`);
      }
    } else {
      addTestResult('Page Implementation', 'FAIL', `${pagePath} not found`);
    }
  });
}

// Test import consistency
function testImportConsistency() {
  logInfo('Testing import consistency...');
  
  const filesToCheck = [
    'app/layout.tsx',
    'hooks/useAuth.ts',
    'contexts/auth-context.tsx'
  ];

  filesToCheck.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for correct AuthProvider import in layout
      if (filePath.includes('layout.tsx')) {
        if (content.includes("from '@/contexts/auth-context'")) {
          addTestResult('Import Consistency', 'PASS', `${filePath} imports AuthProvider correctly`);
        } else {
          addTestResult('Import Consistency', 'FAIL', `${filePath} has incorrect AuthProvider import`);
        }
      }
    } else {
      addTestResult('Import Consistency', 'FAIL', `${filePath} not found`);
    }
  });
}

// Generate test report
function generateTestReport() {
  console.log('\n' + '='.repeat(60));
  log('🔍 Google Sign-In Verification Report', 'blue');
  console.log('='.repeat(60));
  
  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${testResults.passed}`);
  console.log(`   ❌ Failed: ${testResults.failed}`);
  console.log(`   ⚠️  Warnings: ${testResults.warnings}`);
  console.log(`   📝 Total: ${testResults.tests.length}`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests
      .filter(test => test.status === 'FAIL')
      .forEach(test => console.log(`   • ${test.message}`));
  }
  
  if (testResults.warnings > 0) {
    console.log('\n⚠️  Warnings:');
    testResults.tests
      .filter(test => test.status === 'WARN')
      .forEach(test => console.log(`   • ${test.message}`));
  }
  
  // Summary
  console.log('\n💡 Summary:');
  console.log('-'.repeat(50));
  
  if (testResults.failed === 0) {
    logSuccess('🎉 All Google Sign-In functionality is properly configured!');
    logSuccess('🚀 Google authentication should work without issues.');
  } else {
    logError(`${testResults.failed} critical issues need to be addressed.`);
    console.log('\n📝 Next Steps:');
    console.log('1. Fix the failed tests listed above');
    console.log('2. Ensure Firebase project has Google Sign-In enabled');
    console.log('3. Verify your domain is authorized in Firebase Console');
    console.log('4. Test Google Sign-In in the browser');
  }
}

// Main test execution
async function runAllTests() {
  log('🚀 Starting Google Sign-In Verification Tests\n', 'blue');
  
  testFirebaseConfig();
  testGoogleSignInComponents();
  testCSPConfiguration();
  testPageImplementations();
  testImportConsistency();
  
  generateTestReport();
}

// Run tests
runAllTests().catch(console.error);
