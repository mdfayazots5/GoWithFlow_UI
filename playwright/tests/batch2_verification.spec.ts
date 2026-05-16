import { test, expect } from '@playwright/test';

test.describe('Batch 2: User & Admin Management', () => {

test('Batch 2: Integrated User & Admin Management Flow', async ({ page }) => {
    test.setTimeout(60000);
    // 1. Login via Demo
    await page.goto('/login');
    const userDemoBtn = page.getByRole('button', { name: /User Demo/i }).first();
    await expect(userDemoBtn).toBeVisible();
    await userDemoBtn.click();
    await page.waitForURL(/.*dashboard/);

    // 11. My Mistakes Verification
    await page.goto('/user/mistakes');
    await expect(page.locator('h1')).toContainText(/Correction Lab|Mistakes|Refinement Lab/i);
    await expect(page.locator('p').filter({ hasText: /Total|Resolved|Pending/i }).first().or(page.locator('p').filter({ hasText: /Syncs/i }).first())).toBeVisible();

    // 12. Profile Verification
    await page.goto('/user/profile');
    await expect(page.locator('h1')).toContainText(/Identity/i);

    // 16. User Settings Verification
    await page.goto('/user/settings');
    await expect(page.locator('h1')).toContainText(/Settings/i);

    // 17. Script Library Verification
    await page.goto('/scripts');
    const scriptCard = page.locator('.card-base').first();
    const emptyScripts = page.locator('p').filter({ hasText: /No scripts found/i });
    await expect(scriptCard.or(emptyScripts)).toBeVisible();

    // RESTRICTED AREA: Admin Flow
    await page.goto('/user/profile');
    await page.getByRole('button', { name: /Logout/i }).click();
    await page.goto('/login');

    const adminDemoBtn = page.getByRole('button', { name: /Admin Demo/i }).first();
    await expect(adminDemoBtn).toBeVisible();
    await adminDemoBtn.click();
    await page.waitForURL(/.*admin/);

    // 18. Admin Dashboard
    await expect(page.locator('p').filter({ hasText: /Total Users/i }).first()).toBeVisible();

    // 19. Reports Overview
    await page.goto('/admin/reports');
    await expect(page.getByRole('button', { name: /Export Excel/i })).toBeVisible();
    
    // 30. Admin User Details (Batch 4)
    const viewButton = page.getByRole('button', { name: /View Full Report/i }).first();
    await viewButton.click();
    await page.waitForURL(/.*user/);
    await expect(page.locator('h2').filter({ hasText: /Kumar/i })).toBeVisible();
    await expect(page.locator('h3').first()).toContainText(/Recent Sessions/i);

    // 20. Script Management
    await page.goto('/admin/scripts');
    await expect(page.getByRole('button', { name: /Upload New Script/i })).toBeVisible();

    // 31. Admin Script Details / Upload (Batch 4)
    await page.getByRole('button', { name: /Upload New Script/i }).click();
    await page.waitForURL(/.*upload/);
    await expect(page.locator('h2').filter({ hasText: /Upload/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Download Sample Template/i })).toBeVisible();
  });
});
