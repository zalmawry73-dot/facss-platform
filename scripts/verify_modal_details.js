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
  await page.setViewport({ width: 1366, height: 850 });

  try {
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2', timeout: 15000 });
    await page.type('input[type="email"]', 'admin@facss-aden.com');
    await page.type('input[type="password"]', 'Admin@FACSS2026');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
      page.click('button[type="submit"]')
    ]);

    await page.goto('http://localhost:3000/admin/users', { waitUntil: 'networkidle2', timeout: 15000 });
    await page.waitForSelector('table', { timeout: 10000 });

    // 1. Open research manager modal
    console.log('Finding research@facss-aden.com...');
    const rows = await page.$$('tbody tr');
    let researchBtn = null;
    for (const row of rows) {
      const text = await page.evaluate(el => el.textContent, row);
      if (text && text.includes('research@facss-aden.com')) {
        const btns = await row.$$('button');
        for (const b of btns) {
          const bText = await page.evaluate(el => el.textContent, b);
          if (bText && bText.includes('تعديل')) {
            researchBtn = b;
            break;
          }
        }
        if (researchBtn) break;
      }
    }

    if (researchBtn) {
      console.log('Opening research manager modal...');
      await researchBtn.click();
      await sleep(1500);

      // Search for something inside the modal
      const searchInputs = await page.$$('input[placeholder*="بحث"]');
      if (searchInputs.length > 0) {
        console.log('Typing in modal search...');
        await searchInputs[searchInputs.length - 1].type('دراسات');
        await sleep(500);
      }

      const ssResearch = path.join(artifactDir, 'rbac_research_modal_search.png');
      await page.screenshot({ path: ssResearch, fullPage: false });
      console.log(`Saved screenshot: ${ssResearch}`);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

run();
