import { test, expect } from '@playwright/test';

test.describe('Donation Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication for testing
    await page.goto('/');
    
    // This would typically involve setting up a test user session
    // For now, we'll navigate to the donor dashboard directly
    await page.goto('/donor/dashboard');
  });

  test('should display donation dashboard correctly', async ({ page }) => {
    await expect(page).toHaveURL('/donor/dashboard');
    
    // Check for key dashboard elements
    await expect(page.locator('text=My Donations')).toBeVisible();
    await expect(page.locator('text=Create New Donation')).toBeVisible();
    await expect(page.locator('[data-testid="donation-stats"]')).toBeVisible();
  });

  test('should create a new donation successfully', async ({ page }) => {
    await page.goto('/donor/create');
    
    // Fill out donation form
    await page.fill('input[name="title"]', 'Test Donation - Fresh Vegetables');
    await page.fill('textarea[name="description"]', 'Fresh vegetables from our garden including tomatoes, lettuce, and carrots.');
    await page.selectOption('select[name="category"]', 'Fresh Produce');
    await page.fill('input[name="quantity"]', '10');
    await page.selectOption('select[name="unit"]', 'kg');
    
    // Set expiry date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    await page.fill('input[name="expiryDate"]', tomorrowString);
    
    // Fill location
    await page.fill('input[name="pickupLocation"]', '123 Test Street, Test City');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard with success message
    await expect(page).toHaveURL('/donor/dashboard');
    await expect(page.locator('text=Donation created successfully')).toBeVisible();
  });

  test('should validate donation form inputs', async ({ page }) => {
    await page.goto('/donor/create');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('text=Title is required')).toBeVisible();
    await expect(page.locator('text=Description is required')).toBeVisible();
    await expect(page.locator('text=Category is required')).toBeVisible();
    await expect(page.locator('text=Quantity is required')).toBeVisible();
  });

  test('should edit existing donation', async ({ page }) => {
    await page.goto('/donor/dashboard');
    
    // Click edit on first donation (assuming there's at least one)
    await page.click('[data-testid="edit-donation"]');
    
    // Should navigate to edit page
    await expect(page.url()).toContain('/donor/edit/');
    
    // Update title
    await page.fill('input[name="title"]', 'Updated Donation Title');
    
    // Save changes
    await page.click('button[type="submit"]');
    
    // Should redirect back to dashboard
    await expect(page).toHaveURL('/donor/dashboard');
    await expect(page.locator('text=Donation updated successfully')).toBeVisible();
  });

  test('should delete donation with confirmation', async ({ page }) => {
    await page.goto('/donor/dashboard');
    
    // Click delete on first donation
    await page.click('[data-testid="delete-donation"]');
    
    // Should show confirmation dialog
    await expect(page.locator('text=Are you sure you want to delete this donation?')).toBeVisible();
    
    // Confirm deletion
    await page.click('button:has-text("Delete")');
    
    // Should show success message
    await expect(page.locator('text=Donation deleted successfully')).toBeVisible();
  });

  test('should filter donations by status', async ({ page }) => {
    await page.goto('/donor/dashboard');
    
    // Click on different status filters
    await page.click('text=Active');
    await expect(page.locator('[data-testid="donation-card"][data-status="active"]')).toBeVisible();
    
    await page.click('text=Reserved');
    await expect(page.locator('[data-testid="donation-card"][data-status="reserved"]')).toBeVisible();
    
    await page.click('text=Completed');
    await expect(page.locator('[data-testid="donation-card"][data-status="completed"]')).toBeVisible();
  });

  test('should search donations', async ({ page }) => {
    await page.goto('/donor/dashboard');
    
    // Use search functionality
    await page.fill('input[placeholder*="Search"]', 'vegetables');
    await page.keyboard.press('Enter');
    
    // Should filter results
    await expect(page.locator('[data-testid="donation-card"]')).toContainText('vegetables');
  });

  test('should handle image upload for donations', async ({ page }) => {
    await page.goto('/donor/create');
    
    // Fill basic form fields
    await page.fill('input[name="title"]', 'Test Donation with Image');
    await page.fill('textarea[name="description"]', 'Test description');
    await page.selectOption('select[name="category"]', 'Fresh Produce');
    
    // Upload image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test/fixtures/test-image.jpg');
    
    // Should show image preview
    await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();
    
    // Complete form and submit
    await page.fill('input[name="quantity"]', '5');
    await page.selectOption('select[name="unit"]', 'kg');
    await page.fill('input[name="pickupLocation"]', '123 Test Street');
    
    await page.click('button[type="submit"]');
    
    // Should create donation successfully
    await expect(page.locator('text=Donation created successfully')).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/donor/dashboard');
    
    // Check that dashboard is usable on mobile
    await expect(page.locator('text=My Donations')).toBeVisible();
    
    // Check that donation cards stack properly
    const donationCards = page.locator('[data-testid="donation-card"]');
    const firstCard = donationCards.first();
    const boundingBox = await firstCard.boundingBox();
    
    if (boundingBox) {
      expect(boundingBox.width).toBeLessThanOrEqual(375);
    }
  });

  test('should handle donation expiry notifications', async ({ page }) => {
    await page.goto('/donor/dashboard');
    
    // Look for expiry warnings on donations
    const expiringDonations = page.locator('[data-testid="expiry-warning"]');
    
    if (await expiringDonations.count() > 0) {
      await expect(expiringDonations.first()).toContainText('expires');
    }
  });
});
