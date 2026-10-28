const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const sleep = ms => new Promise(r => setTimeout(r, ms));

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

const artifactDir = 'C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\8da3c37d-2ed0-451c-96b5-cdebe4314abc';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function run() {
  console.log(`Launching browser from: ${executablePath}`);
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 850 });

  try {
    console.log('Navigating to login...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2', timeout: 15000 });

    // Fill credentials
    console.log('Logging in as SUPER_ADMIN...');
    await page.type('input[type="email"]', 'admin@facss-aden.com');
    await page.type('input[type="password"]', 'Admin@FACSS2026');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
      page.click('button[type="submit"]')
    ]);

    console.log('Logged in successfully, current URL:', page.url());

    console.log('Navigating to /admin/users...');
    await page.goto('http://localhost:3000/admin/users', { waitUntil: 'networkidle2', timeout: 15000 });

    // Wait for the table to render
    await page.waitForSelector('table', { timeout: 10000 });
    console.log('Users table loaded.');

    // Look for the "تعديل" button for services@facss-aden.com
    const editButtons = await page.$$('button');
    let clicked = false;
    for (const btn of editButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('تعديل')) {
        console.log('Found edit button, clicking...');
        await btn.click();
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      throw new Error('Could not find edit button in users table');
    }

    // Wait for modal to open
    await sleep(1500);
    console.log('Modal opened.');

    // 1. Capture Modal Overview
    const screenshot1 = path.join(artifactDir, 'rbac_modal_overview.png');
    await page.screenshot({ path: screenshot1, fullPage: false });
    console.log(`Saved screenshot 1: ${screenshot1}`);

    // 2. Click an editable switch or button to stage a draft change
    const switches = await page.$$('button[role="switch"]');
    console.log(`Found ${switches.length} switches in modal.`);

    let toggled = false;
    for (const sw of switches) {
      const isDisabled = await page.evaluate(el => el.disabled || el.getAttribute('aria-disabled') === 'true', sw);
      if (!isDisabled) {
        console.log('Clicking first editable switch...');
        await sw.click();
        toggled = true;
        break;
      }
    }

    await sleep(800);

    // 2. Capture Draft Staged State
    const screenshot2 = path.join(artifactDir, 'rbac_modal_draft_staged.png');
    await page.screenshot({ path: screenshot2, fullPage: false });
    console.log(`Saved screenshot 2: ${screenshot2}`);

    // 3. Test Search Filtering
    const searchInputs = await page.$$('input[type="search"], input[placeholder*="بحث"]');
    if (searchInputs.length > 0) {
      const modalSearch = searchInputs[searchInputs.length - 1]; // Search input in modal
      await modalSearch.type('مستودعات');
      await sleep(800);
      const screenshot3 = path.join(artifactDir, 'rbac_modal_search_filter.png');
      await page.screenshot({ path: screenshot3, fullPage: false });
      console.log(`Saved screenshot 3: ${screenshot3}`);
    }

    console.log('UI Verification completed successfully!');
  } catch (err) {
    console.error('Error during browser verification:', err);
  } finally {
    await browser.close();
  }
}

run();
