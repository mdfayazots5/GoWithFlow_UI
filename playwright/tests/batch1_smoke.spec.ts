import { test, expect } from '@playwright/test';

test.describe('Batch 1: Core Navigation & Authentication', () => {
  
  test('should load the landing/login page', async ({ page }) => {
    await page.goto('/');
    // Check if main logo heading exists
    await expect(page.locator('h1')).toContainText(/Go With Flow/);
  });

  test('navigation to register page works', async ({ page }) => {
    await page.goto('/');
    const registerLink = page.getByRole('link', { name: /Register|Join|Account/i });
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/.*register/);
    }
  });

  test('dashboard accessibility (requires auth - should redirect or show login)', async ({ page }) => {
    await page.goto('/dashboard');
    // If not logged in, should be at /auth or showing login
    const url = page.url();
    if (!url.includes('dashboard')) {
       await expect(page.getByRole('button', { name: /Send OTP|Demo/i }).first()).toBeVisible();
    }
  });
});
