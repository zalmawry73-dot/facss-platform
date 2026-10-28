const USERS = [
  { email: 'services@facss-aden.com', pass: 'Service@FACSS2026', name: 'مدير العمليات', targetRoute: '/admin/requests' },
  { email: 'training@facss-aden.com', pass: 'Train@FACSS2026', name: 'مدير التدريب', targetRoute: '/admin/training' },
  { email: 'research@facss-aden.com', pass: 'Research@FACSS2026', name: 'مدير البحوث', targetRoute: '/admin/research' },
  { email: 'client@yemen-bank.com', pass: 'Client@FACSS2026', name: 'حساب عميل مؤسسي', targetRoute: '/portal/client' },
  { email: 'trainee@facss-aden.com', pass: 'Trainee@FACSS2026', name: 'حساب متدرب', targetRoute: '/portal/trainee' },
];

async function runHttpTests() {
  const BASE_URL = 'http://localhost:3000';
  console.log(`=== Testing Real HTTP Authentication & Routing on ${BASE_URL} ===\n`);

  for (const u of USERS) {
    try {
      // 1. Login
      const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: u.email, password: u.pass }),
      });

      const loginData = await loginRes.json();
      const rawCookie = loginRes.headers.get('set-cookie');
      
      if (!loginRes.ok || !loginData.user) {
        console.error(`[FAIL] Login failed for ${u.email}:`, loginData);
        continue;
      }

      console.log(`[PASS] Login OK: ${u.name} (${u.email}) -> Role: ${loginData.user.role}`);

      // Extract cookie
      const cookieHeader = rawCookie ? rawCookie.split(';')[0] : '';

      // 2. Test /api/auth/me with Cookie
      const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: { Cookie: cookieHeader },
      });
      const meData = await meRes.json();
      if (meRes.ok && meData.user && meData.user.email === u.email) {
        console.log(`       GET /api/auth/me -> Authenticated as ${meData.user.fullName}`);
      } else {
        console.error(`       [FAIL] /api/auth/me failed for ${u.email}`);
      }

      // 3. Test Target Page Access
      const pageRes = await fetch(`${BASE_URL}${u.targetRoute}`, {
        headers: { Cookie: cookieHeader },
        redirect: 'manual',
      });
      console.log(`       GET ${u.targetRoute} -> HTTP Status: ${pageRes.status}`);

      // 4. Logout
      await fetch(`${BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { Cookie: cookieHeader },
      });

      console.log('------------------------------------------------------------');
    } catch (err) {
      console.error(`[ERROR] during testing ${u.email}:`, err.message);
    }
  }
}

runHttpTests();
