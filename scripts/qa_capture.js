const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, '..', '.temp_chrome_qa');
const brainDir = 'C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\5d59c63d-e3cc-43cd-bbc0-878f6f3b6c71';
const localEvidenceDir = path.join(__dirname, '..', 'qa_evidence');

if (!fs.existsSync(localEvidenceDir)) {
  fs.mkdirSync(localEvidenceDir, { recursive: true });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sendCDP(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 100000);
    const msg = JSON.stringify({ id, method, params });
    const onMessage = (data) => {
      const resp = JSON.parse(data.toString());
      if (resp.id === id) {
        ws.off('message', onMessage);
        if (resp.error) reject(resp.error);
        else resolve(resp.result);
      }
    };
    ws.on('message', onMessage);
    ws.send(msg);
  });
}

async function run() {
  console.log('Launching headless Chrome with debugging port 9222...');
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
  ]);

  await wait(2500);

  // Get WebSocket debugger URL
  const listResp = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json/list', (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const pageTarget = listResp.find((t) => t.type === 'page') || listResp[0];
  const wsUrl = pageTarget.webSocketDebuggerUrl;
  console.log('Target WebSocket:', wsUrl);

  const WebSocket = require('next/dist/compiled/ws');
  const ws = new WebSocket(wsUrl);

  await new Promise((res) => ws.on('open', res));
  console.log('Connected to CDP.');

  await sendCDP(ws, 'Page.enable');
  await sendCDP(ws, 'Network.enable');

  async function capture({ url, width, height, locale, scrollY, filename, clickSelector }) {
    console.log(`\n--- Capturing: ${filename} (${width}x${height}, locale=${locale}) ---`);
    
    // Set device metrics
    await sendCDP(ws, 'Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 768,
    });

    // Set cookie
    await sendCDP(ws, 'Network.setCookie', {
      name: 'facss_locale',
      value: locale,
      domain: 'localhost',
      path: '/',
    });

    // Navigate
    await sendCDP(ws, 'Page.navigate', { url });
    await wait(2000);

    // Click if requested
    if (clickSelector) {
      await sendCDP(ws, 'Runtime.evaluate', {
        expression: `document.querySelector('${clickSelector}')?.click()`,
      });
      await wait(800);
    }

    // Scroll if requested
    if (scrollY) {
      await sendCDP(ws, 'Runtime.evaluate', {
        expression: `window.scrollTo(0, ${scrollY})`,
      });
      await wait(800);
    }

    // Capture screenshot
    const shot = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(shot.data, 'base64');

    const localPath = path.join(localEvidenceDir, `${filename}.png`);
    fs.writeFileSync(localPath, buffer);

    const brainPath = path.join(brainDir, `${filename}.png`);
    fs.writeFileSync(brainPath, buffer);

    console.log(`Saved: ${filename}.png (${buffer.length} bytes)`);
  }

  // 1. Desktop 1440px - Arabic Homepage
  await capture({
    url: 'http://localhost:3000',
    width: 1440,
    height: 900,
    locale: 'ar',
    scrollY: 0,
    filename: 'desktop_homepage_1440_ar',
  });

  // 2. Desktop 1440px - Arabic Scrolled to Activity Fields
  await capture({
    url: 'http://localhost:3000',
    width: 1440,
    height: 900,
    locale: 'ar',
    scrollY: 1350,
    filename: 'desktop_fields_1440_ar',
  });

  // 3. Desktop 1440px - Arabic About Page Header
  await capture({
    url: 'http://localhost:3000/about',
    width: 1440,
    height: 900,
    locale: 'ar',
    scrollY: 0,
    filename: 'desktop_about_1440_ar',
  });

  // 4. Desktop 1440px - Arabic About Page Org Structure & Lifecycle
  await capture({
    url: 'http://localhost:3000/about',
    width: 1440,
    height: 900,
    locale: 'ar',
    scrollY: 1950,
    filename: 'desktop_about_structure_1440_ar',
  });

  // 5. Desktop 1440px - English Homepage
  await capture({
    url: 'http://localhost:3000',
    width: 1440,
    height: 900,
    locale: 'en',
    scrollY: 0,
    filename: 'desktop_homepage_1440_en',
  });

  // 6. Desktop 1440px - English About Page
  await capture({
    url: 'http://localhost:3000/about',
    width: 1440,
    height: 900,
    locale: 'en',
    scrollY: 0,
    filename: 'desktop_about_1440_en',
  });

  // 7. Viewport 1180px - Arabic Header
  await capture({
    url: 'http://localhost:3000',
    width: 1180,
    height: 800,
    locale: 'ar',
    scrollY: 0,
    filename: 'viewport_1180_header_ar',
  });

  // 8. Viewport 1180px - English Header
  await capture({
    url: 'http://localhost:3000',
    width: 1180,
    height: 800,
    locale: 'en',
    scrollY: 0,
    filename: 'viewport_1180_header_en',
  });

  // 9. Viewport 1024px - Arabic Tablet (with Drawer open)
  await capture({
    url: 'http://localhost:3000',
    width: 1024,
    height: 768,
    locale: 'ar',
    scrollY: 0,
    clickSelector: '#mobile-toggle-btn',
    filename: 'viewport_1024_drawer_open_ar',
  });

  // 10. Viewport 768px - Tablet Portrait
  await capture({
    url: 'http://localhost:3000',
    width: 768,
    height: 900,
    locale: 'ar',
    scrollY: 0,
    filename: 'viewport_768_header_ar',
  });

  // 11. Mobile 390px - Arabic Homepage
  await capture({
    url: 'http://localhost:3000',
    width: 390,
    height: 844,
    locale: 'ar',
    scrollY: 0,
    filename: 'mobile_homepage_390_ar',
  });

  // 12. Mobile 390px - Arabic Drawer Open
  await capture({
    url: 'http://localhost:3000',
    width: 390,
    height: 844,
    locale: 'ar',
    scrollY: 0,
    clickSelector: '#mobile-toggle-btn',
    filename: 'mobile_drawer_390_ar',
  });

  // 13. Mobile 390px - Arabic About Page
  await capture({
    url: 'http://localhost:3000/about',
    width: 390,
    height: 844,
    locale: 'ar',
    scrollY: 0,
    filename: 'mobile_about_390_ar',
  });

  // 14. Mobile 390px - Arabic Contact Page
  await capture({
    url: 'http://localhost:3000/contact',
    width: 390,
    height: 844,
    locale: 'ar',
    scrollY: 0,
    filename: 'mobile_contact_390_ar',
  });

  console.log('\nAll 14 QA screenshots captured successfully!');
  ws.close();
  chrome.kill();
  process.exit(0);
}

run().catch((e) => {
  console.error('Fatal QA error:', e);
  process.exit(1);
});
