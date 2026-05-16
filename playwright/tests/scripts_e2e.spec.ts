import { test, expect } from '@playwright/test';

test.describe('Scripts Module E2E', () => {

  test('User Script Library Flow', async ({ page }) => {
    test.setTimeout(60000);
    // 1. Login as User
    await page.goto('/login');
    const userDemoBtn = page.getByRole('button', { name: /User Demo/i }).first();
    await userDemoBtn.click();
    await page.waitForURL(/.*dashboard/);

    // 2. Navigate to Script Library
    // Assuming there's a way from dashboard or direct URL
    await page.goto('/scripts');
    await expect(page.getByPlaceholder(/Search synchronizable scripts/i)).toBeVisible();

    // 3. Filter scripts
    const allBtn = page.getByRole('button', { name: 'All' });
    await allBtn.click();
    
    // 4. Search scripts
    await page.getByPlaceholder(/Search synchronizable scripts/i).fill('Office');
    await expect(page.locator('h3').filter({ hasText: /Office Conversation/i })).toBeVisible();

    // 5. Select a script to start session
    const syncNowBtn = page.locator('button').filter({ hasText: /Office Conversation/i }).first();
    await syncNowBtn.click();

    // 6. Verify Session Create Page
    await page.waitForURL(/.*session\/create/);
    await expect(page.locator('h1')).toContainText(/Create Room|Create Practice Session/i);
  });

  test('Admin Script Management Flow', async ({ page }) => {
    test.setTimeout(60000);
    // 1. Login as Admin
    await page.goto('/login');
    const adminDemoBtn = page.getByRole('button', { name: /Admin Demo/i }).first();
    await adminDemoBtn.click();
    await page.waitForURL(/.*admin/);

    // 2. Navigate to Script Management
    await page.goto('/admin/scripts');
    await expect(page.getByRole('heading', { name: /Script Management/i })).toBeVisible();
    
    // 3. Check stats are visible
    await expect(page.locator('p').filter({ hasText: /Total Scenarios/i })).toBeVisible();

    // 4. Navigate to Upload
    const uploadBtn = page.getByRole('button', { name: /Upload New Script/i });
    await uploadBtn.click();
    await page.waitForURL(/.*admin\/scripts\/upload/);

    // 5. Verify Script Upload Steps
    await expect(page.getByText(/Drag & drop Excel file here/i)).toBeVisible();
    
    // 6. Test Download Template
    const downloadBtn = page.getByRole('button', { name: /Download Sample Template/i });
    await expect(downloadBtn).toBeVisible();
    // (Actual download testing is tricky in headless shell without more setup)
  });
});
