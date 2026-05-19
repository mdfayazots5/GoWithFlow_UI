import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:4200/auth/login', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'screenshot.png' });
  const box = await page.locator('.login-page').boundingBox();
  console.log('Login Page Box:', box);
  const appShellBox = await page.locator('.app-shell').boundingBox();
  console.log('App Shell Box:', appShellBox);
  await browser.close();
})();