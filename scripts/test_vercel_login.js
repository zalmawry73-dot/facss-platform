/**
 * Test login on Vercel production
 */
const https = require('https');

function post(url, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const data = JSON.stringify(body);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: responseData, headers: res.headers }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('Testing Vercel Login: https://facss-platform.vercel.app/api/auth/login');
  const result = await post('https://facss-platform.vercel.app/api/auth/login', {
    email: 'admin@facss-aden.com',
    password: 'Admin@FACSS2026',
  });
  console.log('Status:', result.status);
  const body = result.body.substring(0, 500);
  console.log('Response:', body);
  if (result.headers['set-cookie']) {
    console.log('Cookie set:', result.headers['set-cookie'][0]?.substring(0, 80));
  }
}

main().catch(console.error);

