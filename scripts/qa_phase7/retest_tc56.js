const puppeteer = require('puppeteer-core');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

(async () => {
  console.log('=== RETEST: TC-056 (/register on 375px Mobile Viewport in English) ===');
  
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 667 });

  // Navigate to /register with English language
  const targetUrl = 'http://localhost:3100/register?lang=en';
  console.log('Navigating to:', targetUrl);

  const res = await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
  console.log('HTTP Status:', res.status());

  // Evaluate scrollWidth vs clientWidth
  const metrics = await page.evaluate(() => {
    const docElem = document.documentElement;
    const body = document.body;
    return {
      scrollWidth: Math.max(docElem.scrollWidth, body ? body.scrollWidth : 0),
      clientWidth: Math.max(docElem.clientWidth, body ? body.clientWidth : 0),
      innerWidth: window.innerWidth,
      overflowElements: Array.from(document.querySelectorAll('*'))
        .filter(el => el.getBoundingClientRect().right > window.innerWidth + 1)
        .map(el => ({
          tag: el.tagName,
          id: el.id,
          className: el.className,
          right: el.getBoundingClientRect().right,
          width: el.getBoundingClientRect().width
        }))
    };
  });

  console.log('Metrics:', {
    scrollWidth: metrics.scrollWidth,
    clientWidth: metrics.clientWidth,
    innerWidth: metrics.innerWidth,
    diff: metrics.scrollWidth - metrics.clientWidth,
    overflowingElementsCount: metrics.overflowElements.length
  });

  const isPass = metrics.scrollWidth <= metrics.clientWidth && metrics.overflowElements.length === 0;
  console.log('>>> TC-056 Retest Result:', isPass ? 'PASS' : 'FAIL');

  // Screenshot proof
  const shotPath = 'scripts/qa_phase7/out/shots/retest_tc56_register_375_en.png';
  await page.screenshot({ path: shotPath, fullPage: true });
  console.log('Saved screenshot proof to:', shotPath);

  await browser.close();

  console.log(JSON.stringify({
    test_id: 'TC-056',
    retest_date: new Date().toISOString(),
    status: isPass ? 'PASS' : 'FAIL',
    scrollWidth: metrics.scrollWidth,
    clientWidth: metrics.clientWidth,
    overflowDiff: metrics.scrollWidth - metrics.clientWidth,
    screenshot: shotPath
  }));
})();
