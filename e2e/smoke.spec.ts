import { expect, test } from '@playwright/test';

test('login page renders and is not blank', async ({ page }) => {
  const consoleProblems: string[] = [];
  const pageErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleProblems.push(`${msg.type()}: ${msg.text()}`);
    }
  });

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  await page.goto('/');
  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.getByRole('heading', { name: /gowithflow/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /send otp/i })).toBeVisible();
  await expect(page.locator('input[formcontrolname="mobileNumber"]')).toBeVisible();

  expect(pageErrors).toEqual([]);
  expect(consoleProblems).toEqual([]);
});
