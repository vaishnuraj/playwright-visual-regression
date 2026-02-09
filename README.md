# Visual Regression Testing with Playwright

Automatically detect UI changes by comparing screenshots using Playwright + pixelmatch.

---

## How It Works

```
1. First Run   -->  Takes screenshot  -->  Saves as BASELINE (expected UI)
2. Second Run  -->  Takes screenshot  -->  Saves as CURRENT (actual UI)
3. Compare     -->  Compares pixels   -->  Generates DIFF image + HTML report
```

Red pixels in the diff = areas that changed between runs.

---

## Folder Structure

```
visual-regression-testing/
+-- tests/visual.spec.js     # Takes screenshots
+-- compare.js                # Compares images + generates report
+-- playwright.config.js      # Browser settings
+-- baseline/                 # Expected screenshots
+-- current/                  # Latest screenshots
+-- diff/                     # Difference images (red = changed)
+-- reports/                  # HTML report
```

---

## Setup

```bash
npm install
npx playwright install chromium
```

---

## How to Run

### Step 1 - Capture baseline (run once)

```bash
npx playwright test
```

Saves screenshot to `baseline/home.png`.

### Step 2 - Capture current (run again)

```bash
npx playwright test
```

Saves screenshot to `current/home.png`.

### Step 3 - Compare and generate report

```bash
node compare.js
```

Creates `diff/home-diff.png` and opens `reports/visual-report.html`.

### Or run everything at once

```bash
npm run test:visual
```

---

## Change the Target URL

Edit `tests/visual.spec.js`:

```javascript
const pages = [
  { name: 'home', url: 'https://your-website.com' },
];
```

After changing the URL, reset the baseline first:

```bash
npm run baseline:reset
npx playwright test
```

---

## Add More Pages

```javascript
const pages = [
  { name: 'home', url: 'https://your-website.com' },
  { name: 'about', url: 'https://your-website.com/about' },
  { name: 'login', url: 'https://your-website.com/login' },
];
```

Each page gets its own baseline, current, diff, and report section.

---

## Commands

| Command | What it does |
|---------|-------------|
| `npx playwright test` | Take screenshots |
| `node compare.js` | Compare + generate HTML report |
| `npm run test:visual` | Both of the above in one command |
| `npm run baseline:reset` | Delete all images and reports (start fresh) |

---

## Show Browser While Running

In `playwright.config.js`, set `headless: false` to see the browser open:

```javascript
use: {
  headless: false,   // true = hidden, false = visible
},
```

---

## Tech Stack

| Package | Purpose |
|---------|---------|
| Playwright | Opens browser and takes screenshots |
| pixelmatch | Compares two images pixel by pixel |
| pngjs | Reads and writes PNG files |
| Node.js | Runs everything |

<img width="1865" height="841" alt="image" src="https://github.com/user-attachments/assets/dd4396dc-ef1a-4b2d-9903-0b1cd1fb84d5" />

