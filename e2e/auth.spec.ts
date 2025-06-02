import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page correctly', async ({ page }) => {
    await page.click('text=Login');
    await expect(page).toHaveURL('/auth/login');
    
    // Check for essential form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check for Google sign-in option
    await expect(page.locator('text=Sign in with Google')).toBeVisible();
  });

  test('should display registration page correctly', async ({ page }) => {
    await page.click('text=Register');
    await expect(page).toHaveURL('/auth/register');
    
    // Check for essential form elements
    await expect(page.locator('input[name="displayName"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('select[name="role"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for invalid login', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should show validation errors for invalid registration', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Fill invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', '123'); // Too short
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('text=Please enter a valid email')).toBeVisible();
    await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible();
  });

  test('should navigate between login and register pages', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Go to register page
    await page.click('text=Create an account');
    await expect(page).toHaveURL('/auth/register');
    
    // Go back to login page
    await page.click('text=Already have an account?');
    await expect(page).toHaveURL('/auth/login');
  });

  test('should handle forgot password flow', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Click forgot password link
    await page.click('text=Forgot password?');
    await expect(page).toHaveURL('/auth/forgot-password');
    
    // Check for email input
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/auth/login');
    
    // Check that form is still usable on mobile
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check that elements don't overflow
    const formContainer = page.locator('form').first();
    const boundingBox = await formContainer.boundingBox();
    expect(boundingBox?.width).toBeLessThanOrEqual(375);
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check for proper labels
    await expect(page.locator('label[for="email"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();
    
    // Check for proper ARIA attributes
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('aria-label');
    
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toHaveAttribute('aria-label');
    
    // Check for proper heading structure
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Tab through form elements
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="email"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="password"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('button[type="submit"]')).toBeFocused();
  });
});
