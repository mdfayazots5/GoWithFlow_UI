import { test, expect } from '@playwright/test';

const DUMMY_USER = {
  id: 'U002',
  fullName: 'Priya Reddy',
  mobileNumber: '9876543210',
  email: 'priya@example.com',
  ageGroup: 'Adult (18+)',
  preferredHintLanguage: 'Telugu',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
  role: 'USER',
  dailyStreakCount: 5,
  totalSessionsPlayed: 12,
  active: true,
  registrationDate: '2023-10-01T10:00:00Z',
};

test.describe('Batch 1 Detailed Screen Verification', () => {

  test('Batch 1: Integrated Screen Flow', async ({ page }) => {
    test.setTimeout(60000);
    // 1. Login via Demo
    await page.goto('/login');
    const userDemoBtn = page.getByRole('button', { name: /User Demo/i }).first();
    await expect(userDemoBtn).toBeVisible();
    await userDemoBtn.click();
    await page.waitForURL(/.*dashboard/);

    // 1. Dashboard Verification
    await expect(page.locator('h1')).toContainText(/Good Morning/i);
    await expect(page.getByRole('button', { name: /Join Session/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Session/i }).first()).toBeVisible();

    // 5. Create Session Verification
    await page.goto('/session/create');
    await page.getByPlaceholder(/e.g., Weekend Family Chat/i).fill('Test Session');
    await expect(page.getByRole('button', { name: /SYNC NOW/i })).toBeVisible();

    // 6. Join Session Verification
    await page.goto('/session/join');
    await expect(page.getByPlaceholder('000 000')).toBeVisible();
    await page.getByPlaceholder('000 000').fill('ABC123');
    await expect(page.getByRole('button', { name: /LOCATE ROOM/i })).toBeVisible();

    // 10. Progress Verification
    await page.goto('/user/progress');
    await expect(page.locator('h2').first()).toContainText(/Grammar Mastery|Recent Progress|Achievements|Fluency/i);
    await expect(page.locator('p').filter({ hasText: /Avg Fluency|Mistakes Fixed|Syncs Fixed/i }).first()).toBeVisible();
  });
});
