import { test, expect } from '@playwright/test';

test.describe('Users Module E2E', () => {

  test('Admin: User Management & Detailed Reporting', async ({ page }) => {
    test.setTimeout(60000);
    // 1. Login as Admin
    await page.goto('/login');
    const adminDemoBtn = page.getByRole('button', { name: /Admin Demo/i }).first();
    await adminDemoBtn.click();
    await page.waitForURL(/.*admin/);

    // 2. Navigate to User Management
    await page.goto('/admin/users');
    await expect(page.getByRole('heading', { name: /Users/i, level: 2 })).toBeVisible();
    
    // 3. Search for a specific user
    const searchInput = page.getByPlaceholder(/Search by name or mobile/i);
    await searchInput.fill('Priya');
    await expect(page.locator('td').filter({ hasText: /Priya Kumar/i })).toBeVisible();

    // 4. View User Profile (Report)
    const viewReportBtn = page.locator('button[title="View Full Report"]').first();
    await viewReportBtn.click();
    
    // 5. Verify User Detail Report Screen
    await page.waitForURL(/.*admin\/reports\/user\/U/i);
    await expect(page.locator('h2').filter({ hasText: /Priya/i })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: /Recent Sessions/i }).first()).toBeVisible();
  });

  test('User: Personal Progress & Profile Management', async ({ page }) => {
    test.setTimeout(60000);
    // 1. Login as User
    await page.goto('/login');
    const userDemoBtn = page.getByRole('button', { name: /User Demo/i }).first();
    await userDemoBtn.click();
    await page.waitForURL(/.*dashboard/);

    // 2. Navigate to Progress Dashboard
    await page.goto('/user/progress');
    await expect(page.locator('h1')).toContainText(/Fluency Lab/i);
    await expect(page.locator('h2').filter({ hasText: /Milestones|Sync Logs/i }).first()).toBeVisible();

    // 3. Navigate to Improvement Tracker (or similar)
    await page.goto('/user/mistakes');
    await expect(page.locator('h1')).toContainText(/Refinement Lab|Mistakes/i);

    // 4. Profile and Settings
    await page.goto('/user/profile');
    // Ravi Kumar
    await expect(page.locator('h2').filter({ hasText: /Ravi/i }).first()).toBeVisible();

    await page.goto('/user/settings');
    await expect(page.locator('h1')).toContainText(/Settings/i);
    
    // Test a setting toggle or input if possible
    const nameInput = page.locator('input[type="text"]').first();
    await expect(nameInput).toBeVisible();
  });
});
