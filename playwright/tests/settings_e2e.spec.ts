import { test, expect } from '@playwright/test';

test.describe('Settings Module E2E', () => {

  test('User Settings Flow', async ({ page }) => {
    test.setTimeout(60000);
    // 1. Login as User
    await page.goto('/login');
    const userDemoBtn = page.getByRole('button', { name: /User Demo/i }).first();
    await userDemoBtn.click();
    await page.waitForURL(/.*dashboard/);

    // 2. Navigate to Settings
    await page.goto('/user/settings');
    await expect(page.getByRole('heading', { name: /^Settings$/i })).toBeVisible();
    
    // 3. Verify fields
    await expect(page.getByText(/Full Name/i)).toBeVisible();
    await expect(page.getByText(/Preferences/i)).toBeVisible();
    await expect(page.getByText(/System/i)).toBeVisible();

    // 4. Test Update Name
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.clear();
    await nameInput.fill('Fayaz Updated');
    
    const saveBtn = page.getByRole('button', { name: /SAVE CHANGES/i });
    await saveBtn.click();
    
    // 5. Verify Success State (UI shows SAVED SUCCESSFULLY)
    await expect(page.getByText(/SAVED SUCCESSFULLY/i)).toBeVisible({ timeout: 10000 });
  });

  test('Admin Settings Flow', async ({ page }) => {
    test.setTimeout(60000);
    // 1. Login as Admin
    await page.goto('/login');
    const adminDemoBtn = page.getByRole('button', { name: /Admin Demo/i }).first();
    await adminDemoBtn.click();
    await page.waitForURL(/.*admin/);

    // 2. Navigate to System Settings
    await page.goto('/admin/settings');
    await expect(page.getByRole('heading', { name: /System Settings/i })).toBeVisible();
    
    // 3. Verify Sections
    await expect(page.getByText(/Platform Configuration/i)).toBeVisible();
    await expect(page.getByText(/Security & Access/i)).toBeVisible();

    // 4. Verify Toggle (2FA)
    const tfaToggle = page.locator('button').filter({ has: page.locator('div') }).last(); // Based on how the toggle is implemented in AdminSettings.tsx
    await expect(tfaToggle).toBeVisible();
    
    // 5. Save Button check
    const saveBtn = page.getByRole('button', { name: /Save Configuration/i });
    await expect(saveBtn).toBeEnabled();
  });
});
