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

    console.log('Navigating to /admin/users...');
    await page.goto('http://localhost:3000/admin/users', { waitUntil: 'networkidle2', timeout: 15000 });
    await page.waitForSelector('table', { timeout: 10000 });

    // Find the row containing services@facss-aden.com
    console.log('Searching for services@facss-aden.com row...');
    const rows = await page.$$('tbody tr');
    let targetButton = null;

    for (const row of rows) {
      const text = await page.evaluate(el => el.textContent, row);
      if (text && text.includes('services@facss-aden.com')) {
        const rowButtons = await row.$$('button');
        for (const b of rowButtons) {
          const bText = await page.evaluate(el => el.textContent, b);
          if (bText && bText.includes('تعديل')) {
            targetButton = b;
            break;
          }
        }
        if (targetButton) break;
      }
    }

    if (!targetButton) {
      console.log('Could not find specific row for services@facss-aden.com, looking for button with تعديل');
      const allButtons = await page.$$('button');
      for (const btn of allButtons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('تعديل')) {
          targetButton = btn;
          break;
        }
      }
    }

    console.log('Clicking edit button for service manager...');
    await targetButton.click();
    await sleep(1500);

    // 1. Screenshot of Services Manager Modal Overview (showing inherited vs assigned)
    const ss1 = path.join(artifactDir, 'rbac_services_modal_overview.png');
    await page.screenshot({ path: ss1, fullPage: false });
    console.log(`Saved screenshot 1: ${ss1}`);

    // 2. Toggle an editable switch inside the modal
    console.log('Finding editable toggle switch...');
    const switches = await page.$$('button[role="switch"]');
    console.log(`Found ${switches.length} switches in modal.`);

    let toggled = false;
    for (const sw of switches) {
      const disabled = await page.evaluate(el => el.disabled, sw);
      if (!disabled) {
        console.log('Toggling editable switch...');
        await sw.click();
        toggled = true;
        break;
      }
    }

    await sleep(600);

    // 2. Screenshot of Draft Staged State (shows Unsaved Changes = 1, pending badge, discard button)
    const ss2 = path.join(artifactDir, 'rbac_services_modal_draft_staged.png');
    await page.screenshot({ path: ss2, fullPage: false });
    console.log(`Saved screenshot 2: ${ss2}`);

    // 3. Click Discard Changes button or Close button to trigger confirmation modal
    console.log('Clicking cancel / discard button...');
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && (text.trim() === 'إلغاء' || text.includes('إلغاء التعديلات') || text.includes('إغلاق'))) {
        await b.click();
        break;
      }
    }

    await sleep(600);

    // 3. Screenshot of Discard Confirmation Dialog
    const ss3 = path.join(artifactDir, 'rbac_discard_confirmation.png');
    await page.screenshot({ path: ss3, fullPage: false });
    console.log(`Saved screenshot 3: ${ss3}`);

    console.log('All detailed screenshots captured successfully!');
  } catch (err) {
    console.error('Error in verification:', err);
  } finally {
    await browser.close();
  }
}

run();
