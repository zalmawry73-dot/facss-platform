const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const edgePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
];

let executablePath = edgePaths.find(p => fs.existsSync(p));
if (!executablePath) {
  console.error('No Edge or Chrome browser executable found!');
  process.exit(1);
}

const artifactDir = 'C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\27d77ed7-2c9a-4acc-acb8-be355b0d4ada';

const routes = [
  { name: 'auth_login', path: '/login', requiresAuth: false },
  { name: 'auth_register', path: '/register', requiresAuth: false },
  { name: 'public_verify_index', path: '/verify', requiresAuth: false },
  { name: 'public_verify_detail', path: '/verify/FACSS-SEC-8921', requiresAuth: false },
  { name: 'system_not_found', path: '/non-existent-path-for-testing-404', requiresAuth: false },
  { name: 'trainee_certificates', path: '/portal/trainee/certificates', requiresAuth: true }
];

const viewports = [
  { name: 'desktop_1366', width: 1366, height: 768 },
  { name: 'laptop_1024', width: 1024, height: 768 },
  { name: 'tablet_768', width: 768, height: 1024 },
  { name: 'mobile_375', width: 375, height: 667 }
];

async function runAudit() {
  console.log(`Starting Phase 6 Final UI & Document Audit using ${executablePath}...`);
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  // Step 1: Login to get authenticated cookie for protected routes
  console.log('Logging in to test authenticated views...');
  await page.setViewport({ width: 1366, height: 768 });
  try {
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2', timeout: 15000 });
    await page.type('input[type="email"]', 'trainee@facss-aden.com');
    await page.type('input[type="password"]', 'Trainee@123456');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
    console.log('Login attempt completed.');
  } catch (err) {
    console.log('Notice during login:', err.message);
  }

  const results = [];

  for (const r of routes) {
    console.log(`\nTesting route: ${r.name} (${r.path})`);
    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      const consoleErrors = [];
      const onConsole = msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      };
      page.on('console', onConsole);

      try {
        await page.goto(`http://localhost:3000${r.path}`, { waitUntil: 'networkidle2', timeout: 15000 });
        await new Promise(res => setTimeout(res, 800));

        // Evaluate layout, overflow, title, RTL
        const metrics = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
          const clientWidth = docEl.clientWidth;
          const hasHorizontalOverflow = scrollWidth > clientWidth + 2; // allowance of 2px
          const dir = docEl.getAttribute('dir') || body.getAttribute('dir') || 'rtl';
          const title = document.title;
          const hasLogo = !!document.querySelector('img[src*="logo"]');

          return {
            scrollWidth,
            clientWidth,
            hasHorizontalOverflow,
            dir,
            title,
            hasLogo
          };
        });

        const screenshotFileName = `phase6_${r.name}_${vp.name}.png`;
        const screenshotPath = path.join(artifactDir, screenshotFileName);
        await page.screenshot({ path: screenshotPath, fullPage: false });

        results.push({
          route: r.name,
          path: r.path,
          viewport: vp.name,
          width: vp.width,
          metrics,
          consoleErrorsCount: consoleErrors.length,
          consoleErrors,
          screenshot: screenshotFileName,
          status: metrics.hasHorizontalOverflow ? 'OVERFLOW_FAIL' : 'PASS'
        });

        console.log(`  [${vp.name}] ${metrics.hasHorizontalOverflow ? 'FAIL (Overflow)' : 'PASS'} - scrollWidth: ${metrics.scrollWidth}, clientWidth: ${metrics.clientWidth}, dir: ${metrics.dir}`);
      } catch (e) {
        console.error(`  [${vp.name}] ERROR:`, e.message);
        results.push({
          route: r.name,
          path: r.path,
          viewport: vp.name,
          width: vp.width,
          error: e.message,
          status: 'ERROR'
        });
      } finally {
        page.off('console', onConsole);
      }
    }
  }

  // Keyboard navigation & tab focus test on Login
  console.log('\nTesting keyboard navigation on /login...');
  await page.setViewport({ width: 1366, height: 768 });
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2', timeout: 10000 });
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const activeTagName = await page.evaluate(() => document.activeElement ? document.activeElement.tagName : 'NONE');
  console.log(`Keyboard tab target: <${activeTagName}>`);

  // Write audit results
  const outPath = path.join(__dirname, 'phase6_audit_results.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\nPhase 6 Audit complete! Results saved to ${outPath}`);

  await browser.close();
}

runAudit().catch(err => {
  console.error('Audit run failed:', err);
  process.exit(1);
});
