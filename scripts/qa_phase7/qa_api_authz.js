// Phase 7 QA — API authorization matrix (non-destructive GET probes + unauthenticated POST probes)
// Target: ISOLATED QA server only (default http://localhost:3100). Refuses to run against port 3000.
const fs = require('fs');
const path = require('path');

const BASE = process.env.QA_BASE || 'http://localhost:3100';
if (/:3000\b/.test(BASE)) { console.error('Refusing to run against operational dev server'); process.exit(2); }

const ROOT = 'd:/FACSSS';
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });

const ACCOUNTS = {
  SUPER_ADMIN: ['admin@facss-aden.com', 'Admin@AICSFA2026'],
  SERVICE_MANAGER: ['services@facss-aden.com', 'Service@AICSFA2026'],
  TRAINING_MANAGER: ['training@facss-aden.com', 'Train@AICSFA2026'],
  RESEARCH_MANAGER: ['research@facss-aden.com', 'Research@AICSFA2026'],
  FIELD_FOCAL_POINT: ['field.focal@facss-aden.com', 'Focal@AICSFA2026'],
  CLIENT: ['safety.officer@humanitarian-ngo.org', 'Client@AICSFA2026'],
  TRAINEE: ['trainee@facss-aden.com', 'Trainee@AICSFA2026'],
};

// Login limiter in the app is 5/min per client; honour it (retry after the 60s window) instead of bypassing it.
async function login(email, password, attempt = 0) {
  const r = await fetch(BASE + '/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
  });
  if (r.status === 429 && attempt < 3) {
    await new Promise(res => setTimeout(res, 62000));
    return login(email, password, attempt + 1);
  }
  const setc = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
  const tok = setc.map(c => c.split(';')[0]).find(c => c.startsWith('facss_session_token='));
  return { status: r.status, cookie: tok || null };
}

function walk(dir, acc = []) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p, acc); else if (f.name === 'route.ts') acc.push(p);
  }
  return acc;
}

(async () => {
  const sessions = { PUBLIC: { cookie: null } };
  for (const [role, [e, p]] of Object.entries(ACCOUNTS)) {
    const s = await login(e, p);
    sessions[role] = s;
    console.log('login', role, s.status, s.cookie ? 'cookie-ok' : 'NO-COOKIE');
  }

  const files = walk(path.join(ROOT, 'app/api'));
  fs.writeFileSync(path.join(OUT, 'sessions.json'), JSON.stringify(Object.fromEntries(Object.entries(sessions).map(([k, v]) => [k, v.cookie])), null, 2));
  const routes = files.map(f => {
    const rel = path.relative(path.join(ROOT, 'app'), f).replace(/\\/g, '/').replace(/\/route\.ts$/, '');
    const src = fs.readFileSync(f, 'utf8');
    const methods = [...src.matchAll(/export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)/g)].map(m => m[1]);
    return { url: '/' + rel.replace(/\[[^\]]+\]/g, 'qa-nonexistent-id'), file: rel, methods };
  });

  const roles = ['PUBLIC', 'CLIENT', 'TRAINEE', 'FIELD_FOCAL_POINT', 'SERVICE_MANAGER', 'SUPER_ADMIN'];
  const results = [];
  for (const r of routes) {
    for (const m of r.methods) {
      // Non-destructive only: GET for every role; mutating methods only for PUBLIC/CLIENT/TRAINEE with empty body
      // against an invalid id (cannot match a real record), to check the auth gate rather than business behavior.
      if (m !== 'GET' && r.url.startsWith('/api/auth')) continue;
      for (const role of roles) {
        if (m !== 'GET' && !['PUBLIC', 'CLIENT', 'TRAINEE'].includes(role)) continue;
        const headers = { 'Content-Type': 'application/json' };
        if (sessions[role].cookie) headers.Cookie = sessions[role].cookie;
        let status = 'ERR', len = 0, snippet = '';
        try {
          const res = await fetch(BASE + r.url, { method: m, headers, body: m === 'GET' ? undefined : '{}', redirect: 'manual' });
          status = res.status;
          const txt = await res.text();
          len = txt.length;
          snippet = txt.slice(0, 160).replace(/\s+/g, ' ');
        } catch (e) { snippet = String(e.message); }
        results.push({ route: r.file, method: m, role, status, len, snippet });
      }
    }
  }
  fs.writeFileSync(path.join(OUT, 'api_authz_matrix.json'), JSON.stringify(results, null, 2));
  // Summaries
  const leaks = results.filter(x => x.role === 'PUBLIC' && x.status === 200 && !/^api\/(services|settings\/public|verify|auth)/.test(x.route));
  console.log('\nTOTAL probes:', results.length);
  console.log('PUBLIC got HTTP 200 on non-public-by-design routes:', leaks.length);
  leaks.forEach(l => console.log('  ', l.method, l.route, l.status, l.snippet.slice(0, 90)));
  const adminLeaks = results.filter(x => x.route.startsWith('api/admin') && ['PUBLIC', 'CLIENT', 'TRAINEE'].includes(x.role) && x.status === 200);
  console.log('Non-staff got 200 on /api/admin/*:', adminLeaks.length);
  adminLeaks.forEach(l => console.log('  ', l.role, l.method, l.route, l.status));
  const s500 = results.filter(x => x.status === 500);
  console.log('HTTP 500 responses:', s500.length);
  s500.slice(0, 15).forEach(l => console.log('  ', l.role, l.method, l.route, l.snippet.slice(0, 100)));
})();
