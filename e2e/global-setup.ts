import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global E2E test setup...');
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for the application to be ready
    console.log('⏳ Waiting for application to be ready...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Verify critical pages are accessible
    const criticalPages = [
      '/',
      '/auth/login',
      '/auth/register',
      '/about',
      '/contact'
    ];
    
    for (const path of criticalPages) {
      console.log(`✅ Checking ${path}...`);
      await page.goto(`http://localhost:3000${path}`);
      await page.waitForLoadState('networkidle');
      
      // Check for error indicators
      const errorElements = await page.locator('[data-testid="error"], .error, [role="alert"]').count();
      if (errorElements > 0) {
        console.warn(`⚠️  Warning: Found ${errorElements} error elements on ${path}`);
      }
    }
    
    // Setup test data if needed
    console.log('📝 Setting up test data...');
    
    // Create test users in Firebase (if using Firebase Auth)
    // This would typically involve calling Firebase Admin SDK
    // For now, we'll just log that this step would happen
    console.log('👤 Test users would be created here');
    
    console.log('✅ Global setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
