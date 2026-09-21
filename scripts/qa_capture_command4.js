const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Parse .env manually
try {
  const envContent = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value.trim();
    }
  });
} catch (e) {
  console.warn('Could not read .env file:', e.message);
}

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(__dirname, '..', '.temp_chrome_qa_cmd4');
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
  // Generate admin token directly with jose
  const { SignJWT } = require('jose');
  const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
  const adminToken = await new SignJWT({
    userId: 'cmu8owa3800007m7vp8ebnz5x',
    email: 'almawry@gmail.com',
    fullName: 'Zaid Almawry',
    role: 'SUPER_ADMIN',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
  console.log('Admin session token generated.');

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

  async function capture({ url, width, height, locale, scrollY, filename, auth = false }) {
    console.log(`\n--- Capturing: ${filename} (${width}x${height}, locale=${locale}, auth=${auth}) ---`);

    await sendCDP(ws, 'Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 768,
    });

    await sendCDP(ws, 'Network.setCookie', {
      name: 'facss_locale',
      value: locale,
      domain: 'localhost',
      path: '/',
    });

    if (auth) {
      await sendCDP(ws, 'Network.setCookie', {
        name: 'facss_session_token',
        value: adminToken,
        domain: 'localhost',
        path: '/',
      });
    } else {
      await sendCDP(ws, 'Network.deleteCookies', {
        name: 'facss_session_token',
        domain: 'localhost',
        path: '/',
      });
    }

    await sendCDP(ws, 'Page.navigate', { url });
    await wait(3000);

    // If on request-service page, wait up to 5s for services to finish loading
    if (url.includes('/request-service')) {
      for (let i = 0; i < 10; i++) {
        const evalRes = await sendCDP(ws, 'Runtime.evaluate', {
          expression: `!document.querySelector('select')?.disabled && (document.querySelectorAll('select option').length > 1 || !document.querySelector('select')?.innerText.includes('تحميل'))`,
          returnByValue: true,
        });
        if (evalRes?.result?.value) break;
        await wait(500);
      }
    }

    if (scrollY) {
      await sendCDP(ws, 'Runtime.evaluate', {
        expression: `window.scrollTo(0, ${scrollY})`,
      });
      await wait(800);
    }

    const shot = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(shot.data, 'base64');

    const localPath = path.join(localEvidenceDir, `${filename}.png`);
    fs.writeFileSync(localPath, buffer);

    const brainPath = path.join(brainDir, `${filename}.png`);
    fs.writeFileSync(brainPath, buffer);

    console.log(`Saved: ${filename}.png (${buffer.length} bytes)`);
  }

  // 1. Desktop 1440px - Services Catalog (Arabic)
  await capture({
    url: 'http://localhost:3000/services',
    width: 1440,
    height: 900,
    locale: 'ar',
    scrollY: 0,
    filename: 'desktop_services_catalog_1440_ar',
  });

  // 2. Desktop 1440px - Services Catalog Scrolled to Cards (Arabic)
  await capture({
    url: 'http://localhost:3000/services',
    width: 1440,
    height: 900,
    locale: 'ar',
    scrollY: 500,
    filename: 'desktop_services_cards_1440_ar',
  });

  // 3. Desktop 1440px - Services Catalog (English)
  await capture({
    url: 'http://localhost:3000/services',
    width: 1440,
    height: 900,
    locale: 'en',
    scrollY: 0,
    filename: 'desktop_services_catalog_1440_en',
  });

  // 4. Desktop 1440px - Service Details Page
  await capture({
    url: 'http://localhost:3000/services/humanitarian-access-risk-analysis',
    width: 1440,
    height: 900,
    locale: 'ar',
    scrollY: 0,
    filename: 'desktop_service_detail_1440_ar',
  });

  // 5. Desktop 1440px - Request Service Form (Arabic)
  await capture({
    url: 'http://localhost:3000/request-service',
    width: 1440,
    height: 900,
    locale: 'ar',
    scrollY: 0,
    filename: 'desktop_request_service_1440_ar',
  });

  // 6. Desktop 1440px - Request Service Form Scrolled (Arabic)
  await capture({
    url: 'http://localhost:3000/request-service',
    width: 1440,
    height: 900,
    locale: 'ar',
    scrollY: 400,
    filename: 'desktop_request_service_form_1440_ar',
  });

  // 7. Desktop 1440px - Admin Services Management Page
  await capture({
    url: 'http://localhost:3000/admin/services',
    width: 1440,
    height: 900,
    locale: 'ar',
    scrollY: 0,
    auth: true,
    filename: 'desktop_admin_services_1440_ar',
  });

  // 8. Mobile 390px - Services Catalog (Arabic)
  await capture({
    url: 'http://localhost:3000/services',
    width: 390,
    height: 844,
    locale: 'ar',
    scrollY: 0,
    filename: 'mobile_services_catalog_390_ar',
  });

  // 9. Mobile 390px - Request Service Form (Arabic)
  await capture({
    url: 'http://localhost:3000/request-service',
    width: 390,
    height: 844,
    locale: 'ar',
    scrollY: 0,
    filename: 'mobile_request_service_390_ar',
  });

  // 10. Mobile 390px - Admin Services Management (Arabic)
  await capture({
    url: 'http://localhost:3000/admin/services',
    width: 390,
    height: 844,
    locale: 'ar',
    scrollY: 0,
    auth: true,
    filename: 'mobile_admin_services_390_ar',
  });

  console.log('\nAll 10 Command 4 QA screenshots captured successfully!');
  ws.close();
  chrome.kill();
  process.exit(0);
}

run().catch((e) => {
  console.error('Fatal QA error:', e);
  process.exit(1);
});
