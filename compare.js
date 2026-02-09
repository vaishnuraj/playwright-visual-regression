const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const BASELINE_DIR = './baseline';
const CURRENT_DIR = './current';
const DIFF_DIR = './diff';
const REPORTS_DIR = './reports';

// Ensure output directories exist
[DIFF_DIR, REPORTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function compareImages(imageName) {
  const pixelmatch = (await import('pixelmatch')).default;
  const baselinePath = path.join(BASELINE_DIR, `${imageName}.png`);
  const currentPath = path.join(CURRENT_DIR, `${imageName}.png`);
  const diffPath = path.join(DIFF_DIR, `${imageName}-diff.png`);

  if (!fs.existsSync(baselinePath)) {
    console.log(`No baseline found for "${imageName}". Run the test first to generate a baseline.`);
    return null;
  }

  if (!fs.existsSync(currentPath)) {
    console.log(`No current screenshot found for "${imageName}". Run the test again to capture the current state.`);
    return null;
  }

  const img1 = PNG.sync.read(fs.readFileSync(baselinePath));
  const img2 = PNG.sync.read(fs.readFileSync(currentPath));

  // Handle different image sizes
  const width = Math.max(img1.width, img2.width);
  const height = Math.max(img1.height, img2.height);

  // Create canvases of the same size
  const baseline = new PNG({ width, height });
  const current = new PNG({ width, height });

  PNG.bitblt(img1, baseline, 0, 0, img1.width, img1.height, 0, 0);
  PNG.bitblt(img2, current, 0, 0, img2.width, img2.height, 0, 0);

  const diff = new PNG({ width, height });

  const mismatchCount = pixelmatch(baseline.data, current.data, diff.data, width, height, {
    threshold: 0.1,
    includeAA: false,
    alpha: 0.3,
  });

  fs.writeFileSync(diffPath, PNG.sync.write(diff));

  const totalPixels = width * height;
  const mismatchPercent = ((mismatchCount / totalPixels) * 100).toFixed(2);

  return {
    name: imageName,
    width,
    height,
    totalPixels,
    mismatchCount,
    mismatchPercent,
    baselinePath,
    currentPath,
    diffPath,
    passed: mismatchCount === 0,
  };
}

function generateHTMLReport(results) {
  const timestamp = new Date().toLocaleString();
  const passCount = results.filter(r => r.passed).length;
  const failCount = results.filter(r => !r.passed).length;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Visual Regression Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px; }
    .header { text-align: center; padding: 30px; background: linear-gradient(135deg, #1e293b, #334155); border-radius: 12px; margin-bottom: 30px; }
    .header h1 { font-size: 2rem; color: #38bdf8; }
    .header p { color: #94a3b8; margin-top: 8px; }
    .summary { display: flex; gap: 20px; justify-content: center; margin: 20px 0; }
    .summary-card { padding: 15px 30px; border-radius: 8px; text-align: center; font-weight: bold; font-size: 1.2rem; }
    .summary-card.pass { background: #064e3b; color: #34d399; }
    .summary-card.fail { background: #7f1d1d; color: #f87171; }
    .summary-card.total { background: #1e293b; color: #38bdf8; }
    .result { background: #1e293b; border-radius: 12px; margin-bottom: 30px; overflow: hidden; border: 1px solid #334155; }
    .result-header { padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; }
    .result-header h2 { font-size: 1.2rem; }
    .badge { padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; }
    .badge.pass { background: #064e3b; color: #34d399; }
    .badge.fail { background: #7f1d1d; color: #f87171; }
    .stats { padding: 10px 20px; display: flex; gap: 20px; color: #94a3b8; font-size: 0.9rem; border-bottom: 1px solid #334155; }
    .images { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 15px; }
    .image-box { text-align: center; }
    .image-box p { font-size: 0.85rem; color: #94a3b8; margin-bottom: 8px; font-weight: 600; text-transform: uppercase; }
    .image-box img { width: 100%; border-radius: 6px; border: 1px solid #334155; }
    .footer { text-align: center; padding: 20px; color: #475569; font-size: 0.85rem; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Visual Regression Test Report</h1>
    <p>Generated on ${timestamp}</p>
  </div>

  <div class="summary">
    <div class="summary-card total">Total: ${results.length}</div>
    <div class="summary-card pass">Passed: ${passCount}</div>
    <div class="summary-card fail">Failed: ${failCount}</div>
  </div>

  ${results
    .map(
      (r) => `
  <div class="result">
    <div class="result-header">
      <h2>${r.name}</h2>
      <span class="badge ${r.passed ? 'pass' : 'fail'}">${r.passed ? 'PASSED' : 'FAILED'}</span>
    </div>
    <div class="stats">
      <span>Resolution: ${r.width} x ${r.height}</span>
      <span>Mismatched Pixels: ${r.mismatchCount.toLocaleString()}</span>
      <span>Difference: ${r.mismatchPercent}%</span>
    </div>
    <div class="images">
      <div class="image-box">
        <p>Baseline</p>
        <img src="../${r.baselinePath}" alt="Baseline">
      </div>
      <div class="image-box">
        <p>Current</p>
        <img src="../${r.currentPath}" alt="Current">
      </div>
      <div class="image-box">
        <p>Diff</p>
        <img src="../${r.diffPath}" alt="Diff">
      </div>
    </div>
  </div>`
    )
    .join('\n')}

  <div class="footer">
    <p>Visual Regression Testing Framework &mdash; Playwright + pixelmatch</p>
  </div>
</body>
</html>`;

  const reportPath = path.join(REPORTS_DIR, 'visual-report.html');
  fs.writeFileSync(reportPath, html);
  return reportPath;
}

// --- Main Execution ---
(async () => {
  console.log('===========================================');
  console.log('  Visual Regression Comparison');
  console.log('===========================================\n');

  // Auto-detect pages by scanning the baseline directory
  const baselineFiles = fs.readdirSync(BASELINE_DIR).filter(f => f.endsWith('.png'));
  const pageNames = baselineFiles.map(f => f.replace('.png', ''));

  if (pageNames.length === 0) {
    console.log('No baseline images found. Run the Playwright test first:');
    console.log('  npx playwright test');
    process.exit(1);
  }

  const results = [];
  for (const name of pageNames) {
    const result = await compareImages(name);
    if (result) {
      const status = result.passed ? 'PASS' : 'FAIL';
      console.log(`[${status}] ${result.name} - ${result.mismatchPercent}% different (${result.mismatchCount} pixels)`);
      results.push(result);
    }
  }

  if (results.length > 0) {
    const reportPath = generateHTMLReport(results);
    console.log(`\nHTML report generated: ${reportPath}`);

    const allPassed = results.every(r => r.passed);
    console.log(`\nOverall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

    if (!allPassed) {
      process.exit(1);
    }
  } else {
    console.log('\nNo comparisons were made. Ensure both baseline and current screenshots exist.');
  }
})();
