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

const adminRoutes = [
  { name: 'dashboard_overview', path: '/admin' },
  { name: 'service_requests', path: '/admin/requests' },
  { name: 'field_incidents', path: '/admin/incidents' },
  { name: 'field_alerts', path: '/admin/alerts' },
  { name: 'risk_register', path: '/admin/risks' },
  { name: 'services_catalog', path: '/admin/services' },
  { name: 'equipment_inventory', path: '/admin/equipment' },
  { name: 'training_academy', path: '/admin/training' },
  { name: 'research_studies', path: '/admin/research' },
  { name: 'users_rbac', path: '/admin/users' },
  { name: 'messages_inquiries', path: '/admin/messages' },
  { name: 'content_cms', path: '/admin/content' },
  { name: 'system_settings', path: '/admin/settings' },
  { name: 'audit_logs', path: '/admin/logs' },
  { name: 'operations_hub', path: '/admin/system' }
];

const viewports = [
  { name: 'desktop_1366', width: 1366, height: 768 },
  { name: 'laptop_1024', width: 1024, height: 768 },
  { name: 'tablet_768', width: 768, height: 1024 },
  { name: 'mobile_375', width: 375, height: 667 }
];

async function runAudit() {
  console.log(`Starting Phase 4 Headless Audit using ${executablePath}...`);
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  // Step 1: Login via UI
  console.log('Logging in as super admin...');
  await page.setViewport({ width: 1366, height: 768 });
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2', timeout: 30000 });

  await page.type('input[type="email"], input[name="email"]', 'admin@facss-aden.com');
  await page.type('input[type="password"], input[name="password"]', 'Admin@FACSS2026');
  
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => null),
    page.click('button[type="submit"]')
  ]);

  console.log('Login attempt complete. Current URL:', page.url());

  const auditResults = [];

  // Step 2: Audit each route across viewports
  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    console.log(`\n================ Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ================`);

    for (const route of adminRoutes) {
      const url = `http://localhost:3000${route.path}`;
      const consoleErrors = [];
      const errorHandler = msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      };
      page.on('console', errorHandler);

      try {
        const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        const status = response ? response.status() : 'unknown';

        // Wait a brief moment for dynamic client components
        await new Promise(r => setTimeout(r, 600));

        // Evaluate horizontal overflow
        const overflow = await page.evaluate(() => {
          return {
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
            bodyScrollWidth: document.body.scrollWidth,
            title: document.title
          };
        });

        // Screenshot for primary views (desktop and mobile) or key views
        let screenshotFilename = null;
        if (vp.width === 1366 || vp.width === 375 || route.name === 'dashboard_overview') {
          screenshotFilename = `phase4_${route.name}_${vp.name}.png`;
          const screenshotPath = path.join(artifactDir, screenshotFilename);
          await page.screenshot({ path: screenshotPath, fullPage: false });
        }

        const resItem = {
          route: route.name,
          path: route.path,
          viewport: vp.name,
          width: vp.width,
          height: vp.height,
          status,
          hasOverflow: overflow.hasOverflow,
          scrollWidth: overflow.scrollWidth,
          clientWidth: overflow.clientWidth,
          consoleErrorsCount: consoleErrors.length,
          consoleErrors: consoleErrors.slice(0, 3),
          screenshot: screenshotFilename
        };

        auditResults.push(resItem);
        console.log(`[${vp.name}] ${route.path} -> Status: ${status} | Overflow: ${overflow.hasOverflow ? 'FAIL (' + overflow.scrollWidth + ' > ' + overflow.clientWidth + ')' : 'PASS'} | Errors: ${consoleErrors.length}`);

      } catch (err) {
        console.error(`[${vp.name}] ERROR on ${route.path}:`, err.message);
        auditResults.push({
          route: route.name,
          path: route.path,
          viewport: vp.name,
          error: err.message
        });
      } finally {
        page.off('console', errorHandler);
      }
    }
  }

  await browser.close();

  // Save audit results JSON
  const resultsPath = path.join(artifactDir, 'scratch', 'phase4_audit_results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(auditResults, null, 2), 'utf8');
  console.log(`\nAudit successfully completed! Results saved to ${resultsPath}`);
}

runAudit().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
