const puppeteer = require('puppeteer-core');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

(async () => {
  console.log('=== RETEST: TC-067 & TC-068 (/brand-preview Responsive Viewports in English) ===');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const tests = [
    { id: 'TC-067', width: 375, height: 667, shot: 'scripts/qa_phase7/out/shots/retest_tc67_brand_preview_375.png' },
    { id: 'TC-068', width: 1366, height: 768, shot: 'scripts/qa_phase7/out/shots/retest_tc68_brand_preview_1366.png' }
  ];

  const results = {};

  for (const t of tests) {
    const page = await browser.newPage();
    await page.setViewport({ width: t.width, height: t.height });
    const res = await page.goto('http://localhost:3100/brand-preview?lang=en', { waitUntil: 'networkidle2', timeout: 30000 });
    
    const metrics = await page.evaluate(() => {
      const docElem = document.documentElement;
      const body = document.body;
      const sw = Math.max(docElem.scrollWidth, body ? body.scrollWidth : 0);
      const cw = Math.max(docElem.clientWidth, body ? body.clientWidth : 0);
      return { sw, cw, diff: sw - cw };
    });

    await page.screenshot({ path: t.shot, fullPage: false });

    const isPass = res.status() === 200 && metrics.diff === 0;
    console.log(`${t.id} (${t.width}px): status=${res.status()}, scrollWidth=${metrics.sw}, clientWidth=${metrics.cw}, diff=${metrics.diff} => Result: ${isPass ? 'PASS' : 'FAIL'}`);

    results[t.id] = {
      test_id: t.id,
      retest_date: new Date().toISOString(),
      status: isPass ? 'PASS' : 'FAIL',
      viewport: t.width,
      httpStatus: res.status(),
      scrollWidth: metrics.sw,
      clientWidth: metrics.cw,
      overflowDiff: metrics.diff,
      screenshot: t.shot
    };

    await page.close();
  }

  await browser.close();
  console.log('Retest Results JSON:', JSON.stringify(results));
})();
