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

const portalRoutes = [
  // Client Portal
  { portal: 'client', name: 'client_dashboard', path: '/portal/client' },
  { portal: 'client', name: 'client_requests', path: '/portal/client/requests' },
  { portal: 'client', name: 'client_profile', path: '/portal/client/profile' },
  { portal: 'client', name: 'client_research', path: '/portal/client/research' },
  
  // Trainee Portal
  { portal: 'trainee', name: 'trainee_dashboard', path: '/portal/trainee' },
  { portal: 'trainee', name: 'trainee_courses', path: '/portal/trainee/courses' },
  { portal: 'trainee', name: 'trainee_attendance', path: '/portal/trainee/attendance' },
  { portal: 'trainee', name: 'trainee_certificates', path: '/portal/trainee/certificates' },
  { portal: 'trainee', name: 'trainee_profile', path: '/portal/trainee/profile' },
  
  // Field Portal
  { portal: 'field', name: 'field_intake_terminal', path: '/portal/field/intake' },
  
  // Shared Portal Alerts
  { portal: 'alerts', name: 'portal_alerts', path: '/portal/alerts' }
];

const viewports = [
  { name: 'desktop_1366', width: 1366, height: 768 },
  { name: 'laptop_1024', width: 1024, height: 768 },
  { name: 'tablet_768', width: 768, height: 1024 },
  { name: 'mobile_375', width: 375, height: 667 }
];

async function runAudit() {
  console.log(`Starting Phase 5 Specialized Portals Headless Audit using ${executablePath}...`);
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  // Step 1: Login via UI
  console.log('Logging in as authorized session...');
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

  // Step 2: Audit each portal route across all viewports
  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    console.log(`\n================ Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ================`);

    for (const route of portalRoutes) {
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

        // Evaluate horizontal overflow & basic DOM state
        const evaluation = await page.evaluate(() => {
          return {
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
            bodyScrollWidth: document.body.scrollWidth,
            title: document.title
          };
        });

        // Screenshot key pages on Desktop and Mobile
        let screenshotFile = null;
        if (vp.name === 'desktop_1366' || vp.name === 'mobile_375') {
          const filename = `phase5_${route.name}_${vp.name}.png`;
          const filePath = path.join(artifactDir, filename);
          await page.screenshot({ path: filePath, fullPage: false });
          screenshotFile = filename;
        }

        const result = {
          portal: route.portal,
          name: route.name,
          path: route.path,
          viewport: vp.name,
          width: vp.width,
          status,
          hasOverflow: evaluation.hasOverflow,
          scrollWidth: evaluation.scrollWidth,
          clientWidth: evaluation.clientWidth,
          consoleErrorCount: consoleErrors.length,
          consoleErrors,
          title: evaluation.title,
          screenshot: screenshotFile,
          passed: status === 200 && !evaluation.hasOverflow && consoleErrors.length === 0
        };

        auditResults.push(result);
        const passIcon = result.passed ? '✅' : (evaluation.hasOverflow ? '⚠️ OVERFLOW' : '❌ ERROR');
        console.log(`  ${passIcon} [${route.portal.toUpperCase()}] ${route.path} -> ${status} | Overflow: ${evaluation.hasOverflow} (${evaluation.scrollWidth}/${evaluation.clientWidth}) | Errors: ${consoleErrors.length}`);

      } catch (err) {
        console.error(`  ❌ FAILED ${route.path} on ${vp.name}:`, err.message);
        auditResults.push({
          portal: route.portal,
          name: route.name,
          path: route.path,
          viewport: vp.name,
          width: vp.width,
          status: 'ERROR',
          error: err.message,
          passed: false
        });
      } finally {
        page.off('console', errorHandler);
      }
    }
  }

  await browser.close();

  // Save audit results
  const outputPath = path.join(__dirname, 'phase5_audit_results.json');
  fs.writeFileSync(outputPath, JSON.stringify(auditResults, null, 2), 'utf-8');
  console.log(`\nPhase 5 Audit complete. Full results written to ${outputPath}`);

  // Summary counts
  const total = auditResults.length;
  const passed = auditResults.filter(r => r.passed).length;
  const overflows = auditResults.filter(r => r.hasOverflow).length;
  const errors = auditResults.filter(r => !r.passed).length;

  console.log(`\nSummary: Total: ${total} | Passed: ${passed} | Overflows: ${overflows} | Issues: ${errors}`);
}

runAudit().catch(err => {
  console.error('Audit run failed:', err);
  process.exit(1);
});
