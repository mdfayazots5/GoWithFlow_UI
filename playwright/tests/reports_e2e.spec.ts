import { test, expect } from '@playwright/test';

test.describe('Reports Module & Playback (Session Review) E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Admin
    await page.goto('/');
    
    // Check if we are on login page
    const loginTitle = page.locator('h1:has-text("Go With Flow")');
    await expect(loginTitle).toBeVisible({ timeout: 10000 });

    // Use Demo Login (Admin)
    const adminDemoBtn = page.locator('button:has-text("Admin Demo")');
    if (await adminDemoBtn.isVisible()) {
      await adminDemoBtn.click();
    }
  });

  test('Reports Overview & User Detail (Desktop)', async ({ page }) => {
    // Navigate to Admin Reports - the link is in AdminLayout or Sidebar
    // Let's go directly to the URL to be safe, or find the link
    await page.goto('/admin/reports');
    
    // Headers in ReportsOverview.tsx are h3 for "User Performance Report"
    // and there is no h1 in ReportsOverview.tsx, but AdminLayout might have a sidebar
    await expect(page.locator('h3:has-text("User Performance Report")')).toBeVisible();

    // Check Summary Stats
    await expect(page.locator('text=Avg Fluency Score')).toBeVisible();
    await expect(page.locator('text=Total Sessions (MTD)')).toBeVisible();

    // Find Priya Kumar and click View Full Report
    // Based on ReportsOverview.tsx, the button text is "View Full Report"
    const priyaRow = page.locator('tr:has-text("Priya Kumar")');
    await priyaRow.locator('button:has-text("View Full Report")').click();

    // Should be on User Detail Report page
    await expect(page.getByRole('heading', { name: 'Priya Kumar' })).toBeVisible();
    await expect(page.locator('text=Recent Sessions')).toBeVisible();

    // Click on a Session Detail (ChevronRight in the table)
    // The button has title="View Session Report"
    await page.locator('button[title="View Session Report"]').first().click();

    // Should be on Session Report page
    // Wait for the URL to change
    await page.waitForURL(/session\/report/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /Session Complete/i })).toBeVisible();
  });

  test('Reports & Session Detail (Mobile)', async ({ page }) => {
    // Set viewport to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to Admin Reports
    await page.goto('/admin/reports');
    
    // Check if key elements are visible
    await expect(page.locator('h3:has-text("User Performance Report")')).toBeVisible();
    
    // Check user detail
    const priyaRow = page.locator('tr:has-text("Priya Kumar")');
    await priyaRow.locator('button:has-text("View Full Report")').click();
    
    await expect(page.getByRole('heading', { name: 'Priya Kumar' })).toBeVisible();
    
    // Use a specific session ID that exists in dummy data for reliability
    // DUMMY_SESSIONS has ID like 'S001', 'S002'
    await page.goto('/session/report/S001');
    
    // Check Session Report for mobile correctness
    // SessionReport.tsx has h1: "Session Complete! ✓"
    await expect(page.getByRole('heading', { name: /Session Complete/i })).toBeVisible();
    
    // Look for "Detailed Report" button in SessionReport.tsx
    // It links to /user/sessions/:id (SessionDetail.tsx)
    const detailedReportBtn = page.locator('button:has-text("Detailed Report")');
    await detailedReportBtn.click();
    
    // SessionDetail.tsx has h1: "Sync Analysis"
    await expect(page.getByRole('heading', { name: /Sync Analysis/i })).toBeVisible();
  });

  test('Mistake Repractice Flow (Mobile)', async ({ page }) => {
    // Set viewport to mobile
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to My Mistakes
    await page.goto('/user/mistakes');
    await expect(page.locator('h1')).toContainText('Refinement Lab');

    // Start Practice
    await page.click('button:has-text("Start Sync Round")');
    
    // Should be in RepracticeRound.tsx
    await expect(page.locator('span:has-text("Correction Round")')).toBeVisible();
    
    // Check if major UI elements are visible on small screen
    await expect(page.locator('button:has-text("Ready when you are")').or(page.locator('button >> svg.lucide-mic'))).toBeVisible();
  });
});
