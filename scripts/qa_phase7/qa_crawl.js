// Phase 7 QA — real-browser crawl (Chrome headless) against the ISOLATED QA server.
// Collects per page/role/viewport/language: status, console errors, failed requests, overflow, clipping,
// a11y heuristics (labels, alt, names, target size, contrast), legacy-identity strings, untranslated text.
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const BASE = process.env.QA_BASE || 'http://localhost:3100';
if (/:3000\b/.test(BASE)) { console.error('Refusing to run against operational dev server'); process.exit(2); }
const OUT = path.join(__dirname, 'out');
const SHOTS = path.join(OUT, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });
const sessions = JSON.parse(fs.readFileSync(path.join(OUT, 'sessions.json'), 'utf8'));
const ids = fs.existsSync(path.join(OUT, 'e2e_ids.json')) ? JSON.parse(fs.readFileSync(path.join(OUT, 'e2e_ids.json'), 'utf8')) : {};
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p));
const ONLY = process.env.QA_ONLY ? process.env.QA_ONLY.split(',') : null;

const X = 'qa-nonexistent-id';
const PAGES = [
  // role, path
  ...['/', '/about', '/services', '/services/field-compound-safety-assessment', '/training', '/research',
    '/research/humanitarian-safe-access-southern-governorates', '/contact', '/request-service', '/verify',
    '/verify/VER-AICSFA-9921', '/verify/INVALID-CODE-0000', '/login', '/register', '/qa-missing-page', '/brand-preview']
    .map(p => ['PUBLIC', p]),
  ...['/admin', '/admin/requests', `/admin/requests/${ids.requestId || X}`, '/admin/incidents', `/admin/incidents/${ids.incidentId || X}`,
    '/admin/alerts', `/admin/alerts/${X}`, '/admin/risks', `/admin/risks/${X}`, '/admin/services', '/admin/equipment', '/admin/training',
    '/admin/research', '/admin/users', '/admin/messages', '/admin/content', '/admin/settings', '/admin/logs', '/admin/system']
    .map(p => ['SUPER_ADMIN', p]),
  ...['/portal/client', '/portal/client/requests', `/portal/client/requests/${ids.requestId || X}`, '/portal/client/reports', '/portal/client/research',
    `/portal/client/research/${ids.researchId || X}`, '/portal/client/profile', '/portal/alerts', `/portal/alerts/${X}`]
    .map(p => ['CLIENT', p]),
  ...['/portal/trainee', '/portal/trainee/courses', '/portal/trainee/attendance', '/portal/trainee/certificates', '/portal/trainee/profile']
    .map(p => ['TRAINEE', p]),
  ...['/portal/field', '/portal/field/intake'].map(p => ['FIELD_FOCAL_POINT', p]),
];
// Access-control (negative) checks: [role, path, expectation]
const ACCESS = [
  ['PUBLIC', '/admin', 'redirect-login'], ['PUBLIC', '/portal/client', 'redirect-login'], ['PUBLIC', '/portal/trainee', 'redirect-login'],
  ['PUBLIC', '/portal/field/intake', 'redirect-login'], ['CLIENT', '/admin', 'deny'], ['CLIENT', '/portal/trainee', 'deny'],
  ['TRAINEE', '/admin', 'deny'], ['TRAINEE', '/portal/client', 'deny'], ['FIELD_FOCAL_POINT', '/admin', 'deny'],
  ['FIELD_FOCAL_POINT', '/portal/client', 'deny'], ['SERVICE_MANAGER', '/admin/users', 'deny-or-limited'], ['SERVICE_MANAGER', '/admin/settings', 'deny-or-limited'],
  ['TRAINING_MANAGER', '/admin/requests', 'deny-or-limited'], ['RESEARCH_MANAGER', '/admin/equipment', 'deny-or-limited'],
];
const VIEWPORTS = [
  { n: 375, w: 375, h: 812, mobile: true }, { n: 768, w: 768, h: 1024 }, { n: 1024, w: 1024, h: 768 }, { n: 1366, w: 1366, h: 768 },
];
const LANGS = ['ar', 'en'];
const LEGACY = ['عدن الأول', 'Aden First', 'AICSFA', 'المركز المتكامل لخدمات', 'Aden International', 'مركز عدن'];

function slug(s) { return s.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'home'; }

const pageEval = () => {
  const vw = document.documentElement.clientWidth;
  const out = { vw };
  const de = document.documentElement;
  out.scrollW = Math.max(de.scrollWidth, document.body.scrollWidth);
  out.hOverflow = out.scrollW > vw + 1;
  out.lang = de.lang; out.dir = de.dir; out.title = document.title;
  out.h1 = document.querySelectorAll('h1').length;
  const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0'; };
  const sel = el => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; else if (el.className && typeof el.className === 'string') s += '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.'); return s; };
  // overflowing elements beyond viewport edge (not inside a scroll container)
  const overflowing = [];
  const inScroller = el => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden') return true; } return false; };
  document.querySelectorAll('body *').forEach(el => {
    if (overflowing.length >= 6 || !vis(el)) return;
    const r = el.getBoundingClientRect();
    if ((r.right > vw + 2 || r.left < -2) && !inScroller(el)) overflowing.push(sel(el) + ` [${Math.round(r.left)}..${Math.round(r.right)}]`);
  });
  out.overflowing = overflowing;
  // clipped text (truncated without ellipsis intent)
  const clipped = [];
  document.querySelectorAll('h1,h2,h3,h4,p,span,a,button,label,td,th,li,div').forEach(el => {
    if (clipped.length >= 6 || !vis(el) || el.children.length > 0 && el.tagName === 'DIV') return;
    const s = getComputedStyle(el);
    if ((s.overflow === 'hidden' || s.overflowX === 'hidden') && el.scrollWidth > el.clientWidth + 2 && el.textContent.trim().length > 0 && s.textOverflow !== 'ellipsis')
      clipped.push(sel(el) + ' "' + el.textContent.trim().slice(0, 30) + '"');
  });
  out.clipped = clipped;
  // images without alt
  out.imgNoAlt = [...document.images].filter(i => vis(i) && !i.hasAttribute('alt')).length;
  out.imgBroken = [...document.images].filter(i => vis(i) && i.complete && i.naturalWidth === 0).map(i => i.src.slice(-60));
  // form fields without accessible labels
  const unlabeled = [];
  document.querySelectorAll('input:not([type=hidden]),select,textarea').forEach(el => {
    if (!vis(el)) return;
    const hasLabel = el.labels && el.labels.length > 0;
    const aria = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title');
    const wrapped = el.closest('label');
    if (!hasLabel && !aria && !wrapped) unlabeled.push(sel(el) + (el.placeholder ? ` ph="${el.placeholder.slice(0, 20)}"` : ''));
  });
  out.unlabeled = unlabeled.slice(0, 8); out.unlabeledCount = unlabeled.length;
  // buttons / links without accessible name
  const noName = [];
  document.querySelectorAll('button,a[href],[role=button]').forEach(el => {
    if (!vis(el)) return;
    const name = (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || '').trim() || (el.querySelector('img[alt]') && el.querySelector('img[alt]').alt);
    if (!name) noName.push(sel(el));
  });
  out.noName = noName.slice(0, 8); out.noNameCount = noName.length;
  // target size (WCAG 2.2 SC 2.5.8 minimum 24x24)
  const small = [];
  document.querySelectorAll('button,a[href],input:not([type=hidden]),select,[role=button]').forEach(el => {
    if (!vis(el)) return; const r = el.getBoundingClientRect();
    if (r.width < 24 || r.height < 24) { const inline = el.tagName === 'A' && getComputedStyle(el).display === 'inline'; if (!inline) small.push(sel(el) + ` ${Math.round(r.width)}x${Math.round(r.height)}`); }
  });
  out.smallTargets = small.slice(0, 6); out.smallTargetCount = small.length;
  // contrast (text vs nearest solid background); gradients/images skipped
  const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(x => parseFloat(x)); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const bgOf = el => { for (let p = el; p; p = p.parentElement) { const s = getComputedStyle(p); if (s.backgroundImage !== 'none') return null; const c = parse(s.backgroundColor); if (c && c.a > 0.95) return c; } return { r: 255, g: 255, b: 255, a: 1 }; };
  const lowC = []; let checked = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) {
    const n = walker.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement; if (!el || seen.has(el) || !vis(el)) continue; seen.add(el);
    const cs = getComputedStyle(el); const fg = parse(cs.color); const bg = bgOf(el); if (!fg || !bg) continue; checked++;
    const L1 = lum(fg), L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const size = parseFloat(cs.fontSize); const bold = parseInt(cs.fontWeight) >= 700; const large = size >= 24 || (size >= 18.66 && bold);
    const need = large ? 3 : 4.5; const op = parseFloat(cs.opacity);
    if (ratio < need && op >= 0.99) lowC.push({ s: sel(el), t: n.textContent.trim().slice(0, 24), ratio: +ratio.toFixed(2), fg: cs.color, bg: `rgb(${bg.r},${bg.g},${bg.b})` });
  }
  out.contrastChecked = checked; out.lowContrastCount = lowC.length; out.lowContrast = lowC.slice(0, 6);
  const txt = document.body.innerText || '';
  out.textLen = txt.length;
  out.arabicLeft = (txt.match(/[\u0600-\u06FF]{2,}/g) || []).slice(0, 6);
  out.legacy = [];
  out.bodySample = txt.replace(/\s+/g, ' ').slice(0, 160);
  out.innerText = txt.slice(0, 20000);
  return out;
};

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-gpu'] });
  const results = [];
  const list = PAGES.filter(([role]) => !ONLY || ONLY.includes(role));
  let n = 0;
  for (const [role, p] of list) {
    for (const lang of LANGS) {
      for (const vp of VIEWPORTS) {
        if (lang === 'en' && ![375, 1366].includes(vp.n)) continue;
        n++;
        const ctx = await browser.createBrowserContext();
        const page = await ctx.newPage();
        const consoleErrors = [], failed = [], http4xx = [];
        page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
        page.on('pageerror', e => consoleErrors.push('PAGEERROR ' + String(e.message).slice(0, 200)));
        page.on('requestfailed', r => failed.push(r.url().slice(-80)));
        page.on('response', r => { if (r.status() >= 400 && !/favicon/.test(r.url())) http4xx.push(r.status() + ' ' + r.url().slice(-80)); });
        await page.setViewport({ width: vp.w, height: vp.h, isMobile: !!vp.mobile, hasTouch: !!vp.mobile });
        const cookies = [{ name: 'facss_locale', value: lang, url: BASE }];
        if (sessions[role]) { const [k, v] = sessions[role].split('='); cookies.push({ name: k, value: v, url: BASE, httpOnly: true }); }
        await page.setCookie(...cookies);
        const rec = { role, path: p, lang, vp: vp.n };
        const t0 = Date.now();
        try {
          const resp = await page.goto(BASE + p, { waitUntil: 'networkidle2', timeout: 30000 });
          await new Promise(r => setTimeout(r, 500));
          rec.status = resp ? resp.status() : null; rec.finalUrl = page.url().replace(BASE, ''); rec.loadMs = Date.now() - t0;
          const m = await page.evaluate(pageEval);
          m.legacy = LEGACY.filter(l => m.innerText.includes(l));
          delete m.innerText;
          Object.assign(rec, m);
          rec.consoleErrors = consoleErrors; rec.failedReq = failed.slice(0, 5); rec.http4xx = http4xx.slice(0, 5);
          const sh = path.join(SHOTS, `${role}_${slug(p)}_${vp.n}_${lang}.jpg`);
          if ((vp.n === 375 || vp.n === 1366) && lang === 'ar' || rec.hOverflow || rec.overflowing.length) await page.screenshot({ path: sh, type: 'jpeg', quality: 55, fullPage: vp.n === 1366 });
          rec.shot = fs.existsSync(sh) ? path.relative(OUT, sh) : null;
        } catch (e) { rec.error = String(e.message).slice(0, 200); }
        await ctx.close();
        results.push(rec);
        if (n % 20 === 0) { fs.writeFileSync(path.join(OUT, 'crawl_results' + (process.env.QA_TAG||'') + '.json'), JSON.stringify(results)); console.log('progress', n); }
      }
    }
  }
  fs.writeFileSync(path.join(OUT, 'crawl_results' + (process.env.QA_TAG||'') + '.json'), JSON.stringify(results, null, 1));

  // Access control checks
  const access = [];
  for (const [role, p, exp] of ACCESS) {
    const ctx = await browser.createBrowserContext(); const page = await ctx.newPage();
    const cookies = [{ name: 'facss_locale', value: 'ar', url: BASE }];
    if (sessions[role]) { const [k, v] = sessions[role].split('='); cookies.push({ name: k, value: v, url: BASE, httpOnly: true }); }
    await page.setCookie(...cookies);
    let rec = { role, path: p, expect: exp };
    try { const resp = await page.goto(BASE + p, { waitUntil: 'networkidle2', timeout: 30000 }); rec.status = resp.status(); rec.finalUrl = page.url().replace(BASE, ''); rec.bodySample = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 120); } catch (e) { rec.error = e.message.slice(0, 120); }
    access.push(rec); await ctx.close();
  }
  fs.writeFileSync(path.join(OUT, 'access_results' + (process.env.QA_TAG||'') + '.json'), JSON.stringify(access, null, 1));
  await browser.close();
  console.log('DONE', results.length, 'page loads');
})();
