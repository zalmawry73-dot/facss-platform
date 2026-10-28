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
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900 });

  try {
    console.log('Logging in as SUPER_ADMIN...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2', timeout: 15000 });
    await page.type('input[type="email"]', 'admin@facss-aden.com');
    await page.type('input[type="password"]', 'Admin@FACSS2026');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
      page.click('button[type="submit"]')
    ]);

    console.log('Navigating to /admin/services...');
    await page.goto('http://localhost:3000/admin/services', { waitUntil: 'networkidle2', timeout: 15000 });
    await page.waitForSelector('table', { timeout: 10000 });

    // 1. Screenshot of Services Catalog with the "+ إضافة خدمة جديدة" button
    const ss1 = path.join(artifactDir, 'admin_services_catalog_overview.png');
    await page.screenshot({ path: ss1, fullPage: false });
    console.log(`Saved screenshot 1: ${ss1}`);

    // 2. Click "تعديل" on the first service (Field Guarding)
    console.log('Finding and clicking تعديل for first service...');
    const allButtons = await page.$$('button');
    let editBtn = null;
    for (const b of allButtons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.trim() === 'تعديل') {
        editBtn = b;
        break;
      }
    }

    if (editBtn) {
      await editBtn.click();
      await sleep(1200);

      const ss2 = path.join(artifactDir, 'admin_service_edit_detailed_modal.png');
      await page.screenshot({ path: ss2, fullPage: false });
      console.log(`Saved screenshot 2: ${ss2}`);

      // Scroll inside modal to see dynamic details
      await page.evaluate(() => {
        const modalBody = document.querySelector('.admin-modal-body');
        if (modalBody) modalBody.scrollTop = 550;
      });
      await sleep(800);

      const ss3 = path.join(artifactDir, 'admin_service_edit_modal_scrolled_details.png');
      await page.screenshot({ path: ss3, fullPage: false });
      console.log(`Saved screenshot 3: ${ss3}`);

      // Close edit modal
      const closeButtons = await page.$$('.admin-modal-close-btn');
      if (closeButtons.length > 0) {
        await closeButtons[0].click();
        await sleep(600);
      }

      // Click "+ إضافة خدمة جديدة"
      console.log('Opening create service modal...');
      const createButtons = await page.$$('button');
      for (const b of createButtons) {
        const text = await page.evaluate(el => el.textContent, b);
        if (text && text.includes('إضافة خدمة جديدة')) {
          await b.click();
          break;
        }
      }
      await sleep(1000);

      const ss4 = path.join(artifactDir, 'admin_service_create_modal.png');
      await page.screenshot({ path: ss4, fullPage: false });
      console.log(`Saved screenshot 4: ${ss4}`);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

run();
