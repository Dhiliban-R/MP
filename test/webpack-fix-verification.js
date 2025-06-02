/**
 * Webpack Fix Verification Script
 * This script verifies that all webpack module loading issues have been resolved
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

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function addTestResult(testName, status, message) {
  testResults.tests.push({ testName, status, message });
  if (status === 'PASS') {
    testResults.passed++;
    logSuccess(`${testName}: ${message}`);
  } else {
    testResults.failed++;
    logError(`${testName}: ${message}`);
  }
}

// Test import consistency
function testImportConsistency() {
  logInfo('Testing import consistency...');
  
  const filesToCheck = [
    'components/ui/notification-bell.tsx',
    'hooks/useNotifications.ts',
    'store/store.ts',
    'lib/notification-service.ts'
  ];

  filesToCheck.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for correct notification import
      if (content.includes("from '@/lib/types/notification.types'")) {
        addTestResult('Import Consistency', 'PASS', `${filePath} uses correct notification import`);
      } else if (content.includes("from '@/lib/types'") && content.includes('Notification')) {
        addTestResult('Import Consistency', 'FAIL', `${filePath} uses old notification import`);
      } else {
        addTestResult('Import Consistency', 'PASS', `${filePath} doesn't import Notification directly`);
      }
    } else {
      addTestResult('Import Consistency', 'FAIL', `${filePath} not found`);
    }
  });
}

// Test for duplicate type definitions
function testDuplicateTypes() {
  logInfo('Testing for duplicate type definitions...');
  
  const mainTypesPath = path.join(process.cwd(), 'lib/types.ts');
  const notificationTypesPath = path.join(process.cwd(), 'lib/types/notification.types.ts');
  
  if (fs.existsSync(mainTypesPath) && fs.existsSync(notificationTypesPath)) {
    const mainTypesContent = fs.readFileSync(mainTypesPath, 'utf8');
    const notificationTypesContent = fs.readFileSync(notificationTypesPath, 'utf8');
    
    // Check if main types file has duplicate Notification interface
    if (mainTypesContent.includes('export interface Notification {')) {
      addTestResult('Duplicate Types', 'FAIL', 'Duplicate Notification interface found in lib/types.ts');
    } else if (mainTypesContent.includes("export type { Notification }")) {
      addTestResult('Duplicate Types', 'PASS', 'lib/types.ts correctly re-exports Notification type');
    } else {
      addTestResult('Duplicate Types', 'PASS', 'No duplicate Notification interface in lib/types.ts');
    }
    
    // Check if notification types file exists and has the interface
    if (notificationTypesContent.includes('export interface Notification {')) {
      addTestResult('Duplicate Types', 'PASS', 'Notification interface exists in notification.types.ts');
    } else {
      addTestResult('Duplicate Types', 'FAIL', 'Notification interface missing from notification.types.ts');
    }
  } else {
    addTestResult('Duplicate Types', 'FAIL', 'Required type files not found');
  }
}

// Test authentication hook imports
function testAuthHookImports() {
  logInfo('Testing authentication hook imports...');
  
  const filesToCheck = [
    'hooks/use-chat.ts',
    'lib/middleware/auth-middleware.tsx'
  ];

  filesToCheck.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for correct useAuth import
      if (content.includes("from './useAuth'") || content.includes("from '@/hooks/useAuth'")) {
        addTestResult('Auth Hook Imports', 'PASS', `${filePath} uses correct useAuth import`);
      } else if (content.includes("from './use-auth'") || content.includes("from '@/hooks/use-auth'")) {
        addTestResult('Auth Hook Imports', 'FAIL', `${filePath} uses old useAuth import`);
      } else {
        addTestResult('Auth Hook Imports', 'PASS', `${filePath} doesn't import useAuth`);
      }
    } else {
      addTestResult('Auth Hook Imports', 'PASS', `${filePath} not found (optional)`);
    }
  });
}

// Test TypeScript ref types
function testTypeScriptRefs() {
  logInfo('Testing TypeScript ref types...');
  
  const chatHookPath = path.join(process.cwd(), 'hooks/use-chat.ts');
  if (fs.existsSync(chatHookPath)) {
    const content = fs.readFileSync(chatHookPath, 'utf8');
    
    // Check for correct useRef types
    if (content.includes('useRef<(() => void) | undefined>(undefined)')) {
      addTestResult('TypeScript Refs', 'PASS', 'useRef types are correctly defined');
    } else if (content.includes('useRef<() => void | undefined>()')) {
      addTestResult('TypeScript Refs', 'FAIL', 'useRef types need fixing');
    } else {
      addTestResult('TypeScript Refs', 'PASS', 'No problematic useRef types found');
    }
  } else {
    addTestResult('TypeScript Refs', 'PASS', 'use-chat.ts not found (optional)');
  }
}

// Test server status
async function testServerStatus() {
  logInfo('Testing server status...');
  
  try {
    const response = await fetch('http://localhost:3000/api/health');
    if (response.ok) {
      addTestResult('Server Status', 'PASS', 'Development server is responding');
    } else {
      addTestResult('Server Status', 'FAIL', `Server responded with status: ${response.status}`);
    }
  } catch (error) {
    addTestResult('Server Status', 'FAIL', `Server is not responding: ${error.message}`);
  }
}

// Test page loading
async function testPageLoading() {
  logInfo('Testing page loading...');
  
  const pagesToTest = [
    '/',
    '/auth/login',
    '/auth/register'
  ];

  for (const page of pagesToTest) {
    try {
      const response = await fetch(`http://localhost:3000${page}`);
      if (response.ok) {
        addTestResult('Page Loading', 'PASS', `${page} loads successfully`);
      } else {
        addTestResult('Page Loading', 'FAIL', `${page} failed to load: ${response.status}`);
      }
    } catch (error) {
      addTestResult('Page Loading', 'FAIL', `${page} failed to load: ${error.message}`);
    }
  }
}

// Generate test report
function generateTestReport() {
  logInfo('\n📊 Webpack Fix Verification Report');
  console.log('='.repeat(50));
  
  log(`Total Tests: ${testResults.tests.length}`, 'blue');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, 'red');
  
  const successRate = ((testResults.passed / testResults.tests.length) * 100).toFixed(1);
  log(`Success Rate: ${successRate}%`, successRate > 90 ? 'green' : 'red');
  
  console.log('\n📋 Detailed Results:');
  console.log('-'.repeat(50));
  
  testResults.tests.forEach(test => {
    const statusIcon = test.status === 'PASS' ? '✅' : '❌';
    console.log(`${statusIcon} ${test.testName}: ${test.message}`);
  });
  
  // Summary
  console.log('\n💡 Summary:');
  console.log('-'.repeat(50));
  
  if (testResults.failed === 0) {
    logSuccess('🎉 All webpack module loading issues have been resolved!');
    logSuccess('🚀 The application should now work without JavaScript errors.');
  } else {
    logError(`${testResults.failed} issues still need to be addressed.`);
  }
}

// Main test execution
async function runAllTests() {
  log('🚀 Starting Webpack Fix Verification Tests\n', 'blue');
  
  testImportConsistency();
  testDuplicateTypes();
  testAuthHookImports();
  testTypeScriptRefs();
  await testServerStatus();
  await testPageLoading();
  
  generateTestReport();
}

// Run tests
runAllTests().catch(console.error);
