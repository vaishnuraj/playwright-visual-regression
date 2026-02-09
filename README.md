# Visual Regression Testing with Playwright

Visual regression testing framework to detect UI layout changes automatically using **Playwright** and **pixelmatch**. It captures screenshots of web pages, compares them against saved baselines, highlights pixel-level differences, and generates a styled HTML diff report.

---

## Table of Contents

- [How It Works](#how-it-works)
- [Project Architecture](#project-architecture)
- [Folder Structure](#folder-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
  - [Step 1 - Capture Baseline](#step-1---capture-baseline)
  - [Step 2 - Capture Current State](#step-2---capture-current-state)
  - [Step 3 - Compare and Generate Report](#step-3---compare-and-generate-report)
  - [One Command Run](#one-command-run)
- [How Each File Works](#how-each-file-works)
- [Understanding the Output](#understanding-the-output)
- [Configuration](#configuration)
- [Adding More Pages](#adding-more-pages)
- [Resetting Baselines](#resetting-baselines)
- [Use Cases](#use-cases)
- [Tech Stack](#tech-stack)

---

## How It Works

The framework follows a **baseline comparison workflow** in three phases:

```
Phase 1: BASELINE CAPTURE
  Playwright opens the target URL in a headless browser
  Takes a full-page screenshot
  Saves it to the baseline/ folder
  This becomes the "expected" appearance

Phase 2: CURRENT STATE CAPTURE
  On the next test run, Playwright detects a baseline already exists
  Takes a new full-page screenshot
  Saves it to the current/ folder
  This is the "actual" appearance to compare against

Phase 3: PIXEL COMPARISON + REPORT
  compare.js reads both baseline and current PNGs
  pixelmatch compares them pixel by pixel
  Differences are highlighted in red on a diff image saved to diff/
  An HTML report is generated in reports/ showing all three images side by side
```

### Visual Flow

```
 [Web Page]
     |
     v
 Playwright (headless browser)
     |
     +---> First run:  saves to baseline/home.png
     |
     +---> Next runs:  saves to current/home.png
                            |
                            v
                    compare.js (pixelmatch)
                            |
              +-------------+-------------+
              |             |             |
         baseline/     current/       diff/
         home.png      home.png     home-diff.png
              |             |             |
              +-------------+-------------+
                            |
                            v
                   reports/visual-report.html
```

---

## Project Architecture

```
                    +-------------------+
                    |  Playwright Test   |
                    |  (visual.spec.js)  |
                    +--------+----------+
                             |
                    Launches headless browser
                    Navigates to target URL
                    Takes full-page screenshot
                             |
               +-------------+-------------+
               |                           |
        No baseline exists?         Baseline exists?
               |                           |
               v                           v
        Save to baseline/           Save to current/
               |                           |
               |                           v
               |                  +------------------+
               |                  |   compare.js     |
               |                  +--------+---------+
               |                           |
               |                  Reads both PNGs
               |                  pixelmatch comparison
               |                           |
               |                  +--------+---------+
               |                  |                  |
               |                  v                  v
               |           diff/home-diff.png   reports/
               |           (red highlighted     visual-report.html
               |            differences)        (side-by-side view)
               |
        Baseline captured.
        Run the test again to compare.
```

---

## Folder Structure

```
playwright-visual-regression/
|
+-- package.json            # Project config and npm scripts
+-- playwright.config.js    # Playwright test runner configuration
+-- compare.js              # Pixel comparison engine + HTML report generator
+-- .gitignore              # Ignores node_modules, current/, diff/, reports/
|
+-- tests/
|   +-- visual.spec.js      # Playwright test that captures screenshots
|
+-- baseline/               # Baseline (expected) screenshots - committed to git
|   +-- home.png
|
+-- current/                # Current (actual) screenshots - gitignored
|   +-- home.png
|
+-- diff/                   # Diff images with highlighted changes - gitignored
|   +-- home-diff.png
|
+-- reports/                # Generated HTML diff reports - gitignored
|   +-- visual-report.html
|
+-- node_modules/           # Dependencies
```

---

## Prerequisites

- **Node.js** v16 or higher
- **npm** v7 or higher

---

## Installation

```bash
# Clone or navigate to the project
cd playwright-visual-regression

# Install dependencies
npm install

# Install Playwright browsers (Chromium)
npx playwright install chromium
```

### What gets installed

| Package           | Purpose                                          |
| ----------------- | ------------------------------------------------ |
| `playwright`      | Browser automation - opens pages, takes screenshots |
| `@playwright/test`| Playwright test runner framework                 |
| `pixelmatch`      | Pixel-level image comparison algorithm           |
| `pngjs`           | Read/write PNG files in Node.js                  |
| `fs-extra`        | Enhanced file system utilities                   |

---

## Usage

### Step 1 - Capture Baseline

Run the test for the first time. Since no baseline exists, the screenshot is saved as the baseline.

```bash
npx playwright test
```

**What happens internally:**
1. Playwright launches a headless Chromium browser
2. Navigates to `https://example.com` (configured in `tests/visual.spec.js`)
3. Waits for network to be idle (all resources loaded)
4. Takes a full-page screenshot
5. Checks if `baseline/home.png` exists - it does NOT
6. Saves the screenshot to `baseline/home.png`

**Output:**
```
Running 1 test using 1 worker
  PASSED  Visual regression - home
  Baseline screenshot saved: ...\baseline\home.png
```

### Step 2 - Capture Current State

Run the test again. This time a baseline exists, so the new screenshot is saved as the current version.

```bash
npx playwright test
```

**What happens internally:**
1. Same browser launch and navigation as Step 1
2. Takes a full-page screenshot
3. Checks if `baseline/home.png` exists - it DOES
4. Saves the screenshot to `current/home.png` instead

**Output:**
```
Running 1 test using 1 worker
  PASSED  Visual regression - home
  Current screenshot saved: ...\current\home.png
```

### Step 3 - Compare and Generate Report

Run the comparison script to analyze differences between baseline and current screenshots.

```bash
node compare.js
```

**What happens internally:**
1. Scans the `baseline/` directory for all `.png` files
2. For each baseline image, looks for a matching `current/` image
3. Reads both PNGs into memory using `pngjs`
4. Handles size differences by normalizing to the larger dimensions
5. Runs `pixelmatch` with a threshold of `0.1` (10% color sensitivity)
6. Creates a diff image where mismatched pixels are highlighted in red
7. Saves the diff to `diff/home-diff.png`
8. Calculates mismatch percentage
9. Generates a styled HTML report at `reports/visual-report.html`

**Output (no changes):**
```
===========================================
  Visual Regression Comparison
===========================================

[PASS] home - 0.00% different (0 pixels)

HTML report generated: reports/visual-report.html

Overall: ALL TESTS PASSED
```

**Output (with changes):**
```
===========================================
  Visual Regression Comparison
===========================================

[FAIL] home - 2.45% different (22,540 pixels)

HTML report generated: reports/visual-report.html

Overall: SOME TESTS FAILED
```

### One Command Run

Run both the test and comparison in sequence:

```bash
npm run test:visual
```

This executes `npx playwright test && node compare.js` - captures the current screenshot, then immediately compares it.

---

## How Each File Works

### `tests/visual.spec.js`

The Playwright test file. It contains an array of page configurations:

```javascript
const pages = [
  { name: 'home', url: 'https://example.com' },
];
```

For each page entry, it:
1. Opens the URL in a headless browser
2. Uses `waitUntil: 'networkidle'` to ensure all assets load
3. Checks if a baseline screenshot exists for that page name
4. If no baseline: saves screenshot to `baseline/{name}.png`
5. If baseline exists: saves screenshot to `current/{name}.png`

### `compare.js`

The comparison engine. It has three main functions:

- **`compareImages(imageName)`** - Reads baseline and current PNGs, normalizes sizes, runs pixelmatch, writes the diff image, and returns a result object with match statistics.

- **`generateHTMLReport(results)`** - Takes all comparison results and generates a single HTML report with:
  - Summary cards (total/passed/failed counts)
  - Per-page sections showing baseline, current, and diff images side-by-side
  - Mismatch pixel count and percentage
  - Pass/fail badges

- **Main execution block** - Scans the baseline directory, runs comparisons for each image, prints results to the console, generates the HTML report, and exits with code `1` if any test failed (useful for CI/CD pipelines).

### `playwright.config.js`

Configures the Playwright test runner:
- Test directory: `./tests`
- Timeout: 30 seconds per test
- Headless mode: enabled (no visible browser window)
- Viewport: 1280x720 pixels
- Browser: Chromium

---

## Understanding the Output

### Diff Image (`diff/home-diff.png`)

The diff image is the same dimensions as the compared screenshots. It visualizes differences as:
- **Red/magenta pixels** = areas where the baseline and current differ
- **Transparent/faded pixels** = areas that match
- The more red you see, the more the UI has changed

### HTML Report (`reports/visual-report.html`)

Open this file in any browser. It shows:
- **Header** with generation timestamp
- **Summary bar** with total, passed, and failed counts
- **Per-page comparison cards** with:
  - Page name and PASS/FAIL badge
  - Resolution and mismatch statistics
  - Three images side-by-side: Baseline | Current | Diff

### Exit Codes

| Code | Meaning                     |
| ---- | ----------------------------|
| `0`  | All comparisons passed      |
| `1`  | One or more comparisons failed or no baselines found |

---

## Configuration

### Adjusting Comparison Sensitivity

In `compare.js`, the `pixelmatch` options control comparison behavior:

```javascript
pixelmatch(baseline.data, current.data, diff.data, width, height, {
  threshold: 0.1,      // 0 = exact match, 1 = very tolerant
  includeAA: false,     // Ignore anti-aliasing differences
  alpha: 0.3,           // Opacity of unchanged pixels in the diff
});
```

| Option      | Default | Description |
| ----------- | ------- | ----------- |
| `threshold` | `0.1`   | Color distance threshold (0-1). Lower = stricter matching. |
| `includeAA` | `false` | Whether to count anti-aliased pixels as differences. Set to `false` to reduce noise from font rendering. |
| `alpha`     | `0.3`   | Blending factor of unchanged pixels in the diff image. |

### Adjusting Browser Viewport

In `playwright.config.js`:

```javascript
use: {
  viewport: { width: 1280, height: 720 },
},
```

Change these values to test different screen sizes (e.g., mobile: `375x812`, tablet: `768x1024`).

---

## Adding More Pages

Edit the `pages` array in `tests/visual.spec.js`:

```javascript
const pages = [
  { name: 'home', url: 'https://example.com' },
  { name: 'about', url: 'https://example.com/about' },
  { name: 'login', url: 'https://your-app.com/login' },
];
```

Each entry generates its own baseline, current, and diff images, and appears as a separate section in the HTML report. The `name` is used as the filename (e.g., `about.png`).

---

## Resetting Baselines

When the UI intentionally changes and you want to accept the new state as the new baseline:

```bash
# Remove all generated images and reports
npm run baseline:reset

# Run the test to capture fresh baselines
npx playwright test
```

Or manually replace a specific baseline:

```bash
# Accept current as the new baseline for a specific page
cp current/home.png baseline/home.png
```

---

## Use Cases

- **Pre-deployment checks** - Run before deploying to catch unintended UI changes
- **CSS refactoring** - Verify that style changes don't break other pages
- **Cross-browser testing** - Add more Playwright projects (Firefox, WebKit) to compare rendering
- **Design system updates** - Ensure component library changes don't affect downstream pages
- **CI/CD integration** - The script exits with code `1` on failure, compatible with any CI pipeline

---

## Tech Stack

| Technology  | Role                                    |
| ----------- | --------------------------------------- |
| Playwright  | Headless browser automation and testing |
| pixelmatch  | Pixel-by-pixel image comparison         |
| pngjs       | PNG image reading and writing           |
| fs-extra    | File system operations                  |
| Node.js     | Runtime environment                     |

---

## NPM Scripts Reference

| Command               | Description                                         |
| --------------------- | --------------------------------------------------- |
| `npm test`            | Run Playwright tests (capture screenshots)          |
| `npm run compare`     | Run pixel comparison and generate HTML report       |
| `npm run test:visual` | Run tests + comparison in sequence                  |
| `npm run baseline:reset` | Delete all baselines, current, diff, and reports |
