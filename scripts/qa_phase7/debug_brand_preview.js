const puppeteer = require('puppeteer-core');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  for (const width of [375, 1366]) {
    const page = await browser.newPage();
    await page.setViewport({ width, height: 768 });
    await page.goto(`http://localhost:3100/brand-preview?lang=en`, { waitUntil: 'networkidle2' });

    const info = await page.evaluate(() => {
      const docElem = document.documentElement;
      const body = document.body;
      const sw = Math.max(docElem.scrollWidth, body ? body.scrollWidth : 0);
      const cw = Math.max(docElem.clientWidth, body ? body.clientWidth : 0);
      
      const offenders = [];
      document.querySelectorAll('*').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.right > window.innerWidth + 1) {
          offenders.push({
            tag: el.tagName,
            className: el.className,
            text: el.innerText ? el.innerText.slice(0, 40) : '',
            right: rect.right,
            width: rect.width
          });
        }
      });
      return { sw, cw, diff: sw - cw, offenders: offenders.slice(0, 10) };
    });

    console.log(`Viewport ${width}px:`, info);
    await page.close();
  }

  await browser.close();
})();
