import { test, expect } from '@playwright/test';

test.describe('Sessions Module E2E', () => {

  test('User Session Flow: List and Detail', async ({ page }) => {
    test.setTimeout(60000);
    // 1. Login as User
    await page.goto('/login');
    const userDemoBtn = page.getByRole('button', { name: /User Demo/i }).first();
    await userDemoBtn.click();
    await page.waitForURL(/.*dashboard/);

    // 2. Navigate to Session List
    // Checking dashboard first to find a way to navigate
    const joinSessionBtn = page.getByRole('button', { name: /Join Session/i }).first();
    await joinSessionBtn.click();
    await page.waitForURL(/.*session\/join/);

    // There might be a "Session History" or similar. Let's try to go to dashboard and look for active sessions
    await page.goto('/user/dashboard');
    await expect(page.locator('h2').filter({ hasText: /Recent Sync Cycles/i }).first()).toBeVisible({ timeout: 10000 });
    
    // Click on a session in the dashboard "Recent Sync Cycles" list
    // User U001 has "Family Dinner Drill" and "Bedtime Stories" as completed
    const sessionCard = page.locator('button').filter({ hasText: /Family Dinner Drill|Bedtime Stories|Weekend Grocery/i }).first();
    await expect(sessionCard).toBeVisible();
    await sessionCard.click();
    
    // 3. Verify Session Detail Page
    await page.waitForURL(/.*user\/sessions\/S/i); 
    await expect(page.locator('h2').first()).toBeVisible();
    await expect(page.locator('p').filter({ hasText: /Performance Summary/i })).toBeVisible();
    
    // Check if back button works - It has a Link back usually or we can use navigate(-1)
    await page.goBack();
    await page.waitForURL(/.*dashboard/);
  });

  test('Admin Session Management Flow', async ({ page }) => {
    test.setTimeout(60000);
    // 1. Login as Admin
    await page.goto('/login');
    const adminDemoBtn = page.getByRole('button', { name: /Admin Demo/i }).first();
    await adminDemoBtn.click();
    await page.waitForURL(/.*admin/);

    // 2. Navigate to Session Management
    await page.goto('/admin/sessions');
    await expect(page.getByRole('heading', { name: /Session Management/i })).toBeVisible();
    
    // 3. Search for a session
    const searchInput = page.getByPlaceholder(/Search session or script/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Coffee'); // Dummy session S008 is "Coffee Shop Order"
    
    // Verify results
    await expect(page.locator('td').filter({ hasText: /Coffee Shop Order/i })).toBeVisible();
    
    // 4. Click details
    const detailsBtn = page.getByRole('button', { name: /Details/i }).first();
    await detailsBtn.click();
    
    // 5. Verify Session Report (Admin view)
    await page.waitForURL(/.*session\/report\/S/i);
    await expect(page.locator('h2').first()).toBeVisible();
  });
});
