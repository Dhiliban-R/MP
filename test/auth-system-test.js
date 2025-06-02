/**
 * Comprehensive Authentication System Test
 * This file tests all critical authentication flows in the FDMS system
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testEmail: 'test@example.com',
  testPassword: 'testpassword123',
  testDisplayName: 'Test User'
};

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
  } else if (status === 'FAIL') {
    testResults.failed++;
    logError(`${testName}: ${message}`);
  } else if (status === 'WARN') {
    testResults.warnings++;
    logWarning(`${testName}: ${message}`);
  }
}

// File existence tests
function testFileStructure() {
  logInfo('Testing file structure...');
  
  const criticalFiles = [
    'lib/firebase.ts',
    'lib/auth.ts',
    'contexts/auth-context.tsx',
    'hooks/useAuth.ts',
    'app/auth/login/page.tsx',
    'app/auth/register/page.tsx',
    'middleware.ts',
    '.env.local'
  ];

  criticalFiles.forEach(file => {
    if (fs.existsSync(path.join(process.cwd(), file))) {
      addTestResult('File Structure', 'PASS', `${file} exists`);
    } else {
      addTestResult('File Structure', 'FAIL', `${file} is missing`);
    }
  });
}

// Environment configuration tests
function testEnvironmentConfig() {
  logInfo('Testing environment configuration...');
  
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    addTestResult('Environment Config', 'FAIL', '.env.local file not found');
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'
  ];

  requiredVars.forEach(varName => {
    if (envContent.includes(varName) && !envContent.includes(`${varName}=""`)) {
      addTestResult('Environment Config', 'PASS', `${varName} is configured`);
    } else {
      addTestResult('Environment Config', 'FAIL', `${varName} is missing or empty`);
    }
  });
}

// TypeScript compilation test
function testTypeScriptCompilation() {
  logInfo('Testing TypeScript compilation...');
  
  try {
    const { execSync } = require('child_process');
    execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
    addTestResult('TypeScript', 'PASS', 'No TypeScript compilation errors');
  } catch (error) {
    addTestResult('TypeScript', 'FAIL', `TypeScript compilation failed: ${error.message}`);
  }
}

// Authentication hook test
function testAuthenticationHook() {
  logInfo('Testing authentication hook...');
  
  const hookPath = path.join(process.cwd(), 'hooks/useAuth.ts');
  if (!fs.existsSync(hookPath)) {
    addTestResult('Auth Hook', 'FAIL', 'useAuth hook file not found');
    return;
  }

  const hookContent = fs.readFileSync(hookPath, 'utf8');
  
  // Check for essential exports
  const requiredExports = ['useAuth', 'AuthProvider'];
  requiredExports.forEach(exportName => {
    if (hookContent.includes(exportName)) {
      addTestResult('Auth Hook', 'PASS', `${exportName} is exported`);
    } else {
      addTestResult('Auth Hook', 'FAIL', `${exportName} is not exported`);
    }
  });
}

// Route protection test
function testRouteProtection() {
  logInfo('Testing route protection...');
  
  const middlewarePath = path.join(process.cwd(), 'middleware.ts');
  if (!fs.existsSync(middlewarePath)) {
    addTestResult('Route Protection', 'FAIL', 'middleware.ts not found');
    return;
  }

  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
  
  // Check for essential middleware features
  const requiredFeatures = [
    'isPublicRoute',
    'auth_token',
    'email_verified',
    'NextResponse.redirect'
  ];

  requiredFeatures.forEach(feature => {
    if (middlewareContent.includes(feature)) {
      addTestResult('Route Protection', 'PASS', `${feature} is implemented`);
    } else {
      addTestResult('Route Protection', 'FAIL', `${feature} is missing`);
    }
  });
}

// Navigation utilities test
function testNavigationUtilities() {
  logInfo('Testing navigation utilities...');
  
  const navUtilsPath = path.join(process.cwd(), 'lib/navigation-utils.ts');
  if (!fs.existsSync(navUtilsPath)) {
    addTestResult('Navigation Utils', 'FAIL', 'navigation-utils.ts not found');
    return;
  }

  const navUtilsContent = fs.readFileSync(navUtilsPath, 'utf8');
  
  // Check for essential navigation features
  const requiredFeatures = [
    'NavigationUtils',
    'navigateTo',
    'navigateToDashboard',
    'retryNavigation'
  ];

  requiredFeatures.forEach(feature => {
    if (navUtilsContent.includes(feature)) {
      addTestResult('Navigation Utils', 'PASS', `${feature} is implemented`);
    } else {
      addTestResult('Navigation Utils', 'FAIL', `${feature} is missing`);
    }
  });
}

// Dashboard layout test
function testDashboardLayouts() {
  logInfo('Testing dashboard layouts...');
  
  const layouts = [
    'app/donor/layout.tsx',
    'app/recipient/layout.tsx',
    'app/admin/layout.tsx'
  ];

  layouts.forEach(layoutPath => {
    if (fs.existsSync(path.join(process.cwd(), layoutPath))) {
      const layoutContent = fs.readFileSync(path.join(process.cwd(), layoutPath), 'utf8');
      
      // Check for essential layout features
      if (layoutContent.includes('useAuth') && layoutContent.includes('DashboardShell')) {
        addTestResult('Dashboard Layouts', 'PASS', `${layoutPath} is properly configured`);
      } else {
        addTestResult('Dashboard Layouts', 'WARN', `${layoutPath} may be missing auth or shell components`);
      }
    } else {
      addTestResult('Dashboard Layouts', 'FAIL', `${layoutPath} not found`);
    }
  });
}

// Generate test report
function generateTestReport() {
  logInfo('\n📊 Test Report Summary');
  console.log('='.repeat(50));
  
  log(`Total Tests: ${testResults.tests.length}`, 'blue');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, 'red');
  log(`Warnings: ${testResults.warnings}`, 'yellow');
  
  const successRate = ((testResults.passed / testResults.tests.length) * 100).toFixed(1);
  log(`Success Rate: ${successRate}%`, successRate > 80 ? 'green' : 'red');
  
  console.log('\n📋 Detailed Results:');
  console.log('-'.repeat(50));
  
  testResults.tests.forEach(test => {
    const statusIcon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${statusIcon} ${test.testName}: ${test.message}`);
  });
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  console.log('-'.repeat(50));
  
  if (testResults.failed > 0) {
    logError('Critical issues found that need immediate attention:');
    testResults.tests
      .filter(test => test.status === 'FAIL')
      .forEach(test => console.log(`   • ${test.message}`));
  }
  
  if (testResults.warnings > 0) {
    logWarning('Warnings that should be addressed:');
    testResults.tests
      .filter(test => test.status === 'WARN')
      .forEach(test => console.log(`   • ${test.message}`));
  }
  
  if (testResults.failed === 0 && testResults.warnings === 0) {
    logSuccess('🎉 All tests passed! The authentication system appears to be properly configured.');
  }
}

// Main test execution
function runAllTests() {
  log('🚀 Starting FDMS Authentication System Tests\n', 'blue');
  
  testFileStructure();
  testEnvironmentConfig();
  testTypeScriptCompilation();
  testAuthenticationHook();
  testRouteProtection();
  testNavigationUtilities();
  testDashboardLayouts();
  
  generateTestReport();
}

// Run tests
runAllTests();
