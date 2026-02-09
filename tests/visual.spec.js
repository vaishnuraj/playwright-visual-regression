const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASELINE_DIR = path.join(__dirname, '..', 'baseline');
const CURRENT_DIR = path.join(__dirname, '..', 'current');

const pages = [
  { name: 'home', url: 'https://www.flipkart.com/' },
  // Add more pages here to test multiple URLs:
  // { name: 'about', url: 'https://example.com/about' },
];

for (const { name, url } of pages) {
  test(`Visual regression - ${name}`, async ({ page }) => {
    await page.goto(url, { waitUntil: 'networkidle' });

    const baselinePath = path.join(BASELINE_DIR, `${name}.png`);
    const currentPath = path.join(CURRENT_DIR, `${name}.png`);

    if (!fs.existsSync(baselinePath)) {
      // First run: save as baseline
      await page.screenshot({ path: baselinePath, fullPage: true });
      console.log(`Baseline screenshot saved: ${baselinePath}`);
    } else {
      // Subsequent runs: save as current for comparison
      await page.screenshot({ path: currentPath, fullPage: true });
      console.log(`Current screenshot saved: ${currentPath}`);
    }
  });
}
