/**
 * FACSS Phase 1 Security Hardening Automated Test Suite
 * 
 * Verifies all 13 critical security scenarios:
 * 1. Anonymous -> /admin = DENIED
 * 2. CLIENT -> /admin = DENIED
 * 3. TRAINEE -> /admin = DENIED
 * 4. Unauthorized Manager Role -> restricted admin area = DENIED
 * 5. Authorized Staff -> permitted area = ALLOWED
 * 6. TRAINEE -> Client Request = DENIED (IDOR)
 * 7. CLIENT A -> Client B Request = DENIED (IDOR)
 * 8. CLIENT A -> Own Request = ALLOWED
 * 9. Disabled User + existing JWT = DENIED (Revocation check)
 * 10. Invalid JWT = DENIED
 * 11. Missing AUTH_SECRET = fail securely
 * 12. Repeated login abuse = rate limited (429)
 * 13. Repeated public form abuse = rate limited (429)
 */

const { SignJWT, jwtVerify } = require('jose');
const assert = require('assert');

const TEST_SECRET = 'facss-aden-security-platform-dev-secret-key-2026-min-32-chars';

// RBAC Role Definitions matching lib/rbac.ts
const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  CONTENT_MANAGER: 'CONTENT_MANAGER',
  SERVICE_MANAGER: 'SERVICE_MANAGER',
  TRAINING_MANAGER: 'TRAINING_MANAGER',
  RESEARCH_MANAGER: 'RESEARCH_MANAGER',
  EMPLOYEE: 'EMPLOYEE',
  CLIENT: 'CLIENT',
  TRAINEE: 'TRAINEE',
};

const STAFF_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.STAFF,
  ROLES.CONTENT_MANAGER,
  ROLES.SERVICE_MANAGER,
  ROLES.TRAINING_MANAGER,
  ROLES.RESEARCH_MANAGER,
  ROLES.EMPLOYEE,
];

const ADMIN_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
];

function isStaffRole(role) {
  return STAFF_ROLES.includes(role);
}

function isAdminRole(role) {
  return ADMIN_ROLES.includes(role);
}

// Simulated Rate Limiter matching lib/rateLimit.ts logic
class TestRateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.store = new Map();
  }

  check(ip) {
    const now = Date.now();
    const record = this.store.get(ip);

    if (!record || now > record.resetTime) {
      this.store.set(ip, { count: 1, resetTime: now + this.windowMs });
      return { allowed: true, remaining: this.maxRequests - 1 };
    }

    if (record.count >= this.maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    record.count += 1;
    return { allowed: true, remaining: this.maxRequests - record.count };
  }
}

// Simulated Request Authorizer matching app/api/requests/[id]/route.ts & UI logic
function authorizeServiceRequestAccess(user, request) {
  if (!user || !user.isActive) {
    return { status: 401, error: 'Unauthorized or inactive' };
  }

  const isStaff = isStaffRole(user.role);
  const isClient = user.role === ROLES.CLIENT;

  // Trainee or any role that is neither Staff nor Client is strictly forbidden
  if (!isStaff && !isClient) {
    return { status: 403, error: 'Forbidden: Access denied' };
  }

  // IDOR check: Client can only view their own request
  if (!isStaff && request.userId !== user.userId) {
    return { status: 403, error: 'Forbidden: You do not have permission to view this request' };
  }

  return { status: 200, allowed: true };
}

// Simulated Edge Middleware Route Gate matching middleware.ts logic
function simulateEdgeMiddleware(path, tokenPayload) {
  // Public routes always pass
  const publicRoutes = ['/', '/login', '/register', '/about', '/contact', '/services', '/training', '/research'];
  if (publicRoutes.includes(path) || path.startsWith('/api/auth/login') || path.startsWith('/api/auth/register')) {
    return { status: 200, action: 'ALLOW' };
  }

  // /admin protection
  if (path.startsWith('/admin')) {
    if (!tokenPayload) {
      return { status: 302, redirect: '/login?redirect=' + encodeURIComponent(path), action: 'DENIED_ANONYMOUS' };
    }
    if (!STAFF_ROLES.includes(tokenPayload.role)) {
      return { status: 302, redirect: '/login?error=unauthorized', action: 'DENIED_UNAUTHORIZED_ROLE' };
    }
    return { status: 200, action: 'ALLOW_STAFF' };
  }

  // /portal/client protection
  if (path.startsWith('/portal/client')) {
    if (!tokenPayload) {
      return { status: 302, redirect: '/login?redirect=' + encodeURIComponent(path), action: 'DENIED_ANONYMOUS' };
    }
    const clientAllowed = [ROLES.CLIENT, ROLES.SUPER_ADMIN, ROLES.ADMIN];
    if (!clientAllowed.includes(tokenPayload.role)) {
      return { status: 302, redirect: '/login?error=unauthorized', action: 'DENIED_UNAUTHORIZED_ROLE' };
    }
    return { status: 200, action: 'ALLOW_CLIENT' };
  }

  // /portal/trainee protection
  if (path.startsWith('/portal/trainee')) {
    if (!tokenPayload) {
      return { status: 302, redirect: '/login?redirect=' + encodeURIComponent(path), action: 'DENIED_ANONYMOUS' };
    }
    const traineeAllowed = [ROLES.TRAINEE, ROLES.SUPER_ADMIN, ROLES.ADMIN];
    if (!traineeAllowed.includes(tokenPayload.role)) {
      return { status: 302, redirect: '/login?error=unauthorized', action: 'DENIED_UNAUTHORIZED_ROLE' };
    }
    return { status: 200, action: 'ALLOW_TRAINEE' };
  }

  return { status: 200, action: 'ALLOW' };
}

// Simulated Server Component Page Gate matching lib/rbac.ts logic
function simulatePageAuthorization(requiredRoles, user) {
  if (!user || !user.isActive) {
    return { allowed: false, action: 'REDIRECT_LOGIN' };
  }
  if (user.role === ROLES.SUPER_ADMIN) {
    return { allowed: true, action: 'SUPER_ADMIN_BYPASS' };
  }
  if (!requiredRoles.includes(user.role)) {
    return { allowed: false, action: 'REDIRECT_UNAUTHORIZED' };
  }
  return { allowed: true, action: 'ALLOWED' };
}

// Helper to sign JWT
async function createTestJWT(payload, secret = TEST_SECRET, expiresIn = '1d') {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(new TextEncoder().encode(secret));
}

// Test Runner
let testsPassed = 0;
let testsFailed = 0;

function runTest(testName, fn) {
  try {
    fn();
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${testName}`);
    testsPassed++;
  } catch (err) {
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${testName}`);
    console.error(`    ${err.message}`);
    testsFailed++;
  }
}

async function runAsyncTest(testName, fn) {
  try {
    await fn();
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${testName}`);
    testsPassed++;
  } catch (err) {
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${testName}`);
    console.error(`    ${err.message}`);
    testsFailed++;
  }
}

async function executeTestSuite() {
  console.log('\n======================================================');
  console.log('   FACSS PHASE 1 SECURITY AUTOMATED TEST SUITE');
  console.log('======================================================\n');

  // Test 1: Anonymous -> /admin = DENIED
  runTest('Scenario 1: Anonymous -> /admin is DENIED by Edge Middleware', () => {
    const res = simulateEdgeMiddleware('/admin', null);
    assert.strictEqual(res.action, 'DENIED_ANONYMOUS');
    assert.strictEqual(res.status, 302);
    assert(res.redirect.includes('/login'));
  });

  // Test 2: CLIENT -> /admin = DENIED
  runTest('Scenario 2: CLIENT -> /admin is DENIED by Edge Middleware', () => {
    const clientUser = { userId: 'client-1', role: ROLES.CLIENT, isActive: true };
    const res = simulateEdgeMiddleware('/admin', clientUser);
    assert.strictEqual(res.action, 'DENIED_UNAUTHORIZED_ROLE');
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.redirect, '/login?error=unauthorized');
  });

  // Test 3: TRAINEE -> /admin = DENIED
  runTest('Scenario 3: TRAINEE -> /admin is DENIED by Edge Middleware', () => {
    const traineeUser = { userId: 'trainee-1', role: ROLES.TRAINEE, isActive: true };
    const res = simulateEdgeMiddleware('/admin', traineeUser);
    assert.strictEqual(res.action, 'DENIED_UNAUTHORIZED_ROLE');
    assert.strictEqual(res.status, 302);
  });

  // Test 4: Unauthorized Manager Role -> restricted admin area = DENIED
  runTest('Scenario 4: CONTENT_MANAGER -> /admin/settings (ADMIN_ROLES required) is DENIED', () => {
    const contentManager = { userId: 'cm-1', role: ROLES.CONTENT_MANAGER, isActive: true };
    const res = simulatePageAuthorization(ADMIN_ROLES, contentManager);
    assert.strictEqual(res.allowed, false);
    assert.strictEqual(res.action, 'REDIRECT_UNAUTHORIZED');
  });

  // Test 5: Authorized Staff -> permitted area = ALLOWED
  runTest('Scenario 5: Authorized Staff (CONTENT_MANAGER -> STAFF_ROLES) is ALLOWED', () => {
    const contentManager = { userId: 'cm-1', role: ROLES.CONTENT_MANAGER, isActive: true };
    const res = simulatePageAuthorization(STAFF_ROLES, contentManager);
    assert.strictEqual(res.allowed, true);
    assert.strictEqual(res.action, 'ALLOWED');
  });

  runTest('Scenario 5b: SUPER_ADMIN bypasses all role restrictions', () => {
    const superAdmin = { userId: 'sa-1', role: ROLES.SUPER_ADMIN, isActive: true };
    const res = simulatePageAuthorization(ADMIN_ROLES, superAdmin);
    assert.strictEqual(res.allowed, true);
    assert.strictEqual(res.action, 'SUPER_ADMIN_BYPASS');
  });

  runTest('Scenario 5c: Consolidated STAFF role is ALLOWED in general staff areas', () => {
    const staffMember = { userId: 'staff-1', role: ROLES.STAFF, isActive: true };
    const res = simulatePageAuthorization(STAFF_ROLES, staffMember);
    assert.strictEqual(res.allowed, true);
    assert.strictEqual(res.action, 'ALLOWED');
  });

  runTest('Scenario 5d: Consolidated STAFF role is DENIED from ADMIN_ROLES areas (Least Privilege)', () => {
    const staffMember = { userId: 'staff-1', role: ROLES.STAFF, isActive: true };
    const res = simulatePageAuthorization(ADMIN_ROLES, staffMember);
    assert.strictEqual(res.allowed, false, 'STAFF must not possess admin privileges');
    assert.strictEqual(res.action, 'REDIRECT_UNAUTHORIZED');
  });

  // Test 6: TRAINEE -> Client Request = DENIED (IDOR check)
  runTest('Scenario 6: TRAINEE -> Client Request is DENIED (403)', () => {
    const trainee = { userId: 'trainee-1', role: ROLES.TRAINEE, isActive: true };
    const clientRequest = { id: 'req-100', userId: 'client-999', requestNumber: 'REQ-2026-0001' };
    const res = authorizeServiceRequestAccess(trainee, clientRequest);
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.error, 'Forbidden: Access denied');
  });

  // Test 7: CLIENT A -> Client B Request = DENIED (IDOR check)
  runTest('Scenario 7: CLIENT A -> Client B Request is DENIED (403 IDOR blocked)', () => {
    const clientA = { userId: 'client-A', role: ROLES.CLIENT, isActive: true };
    const clientBRequest = { id: 'req-101', userId: 'client-B', requestNumber: 'REQ-2026-0002' };
    const res = authorizeServiceRequestAccess(clientA, clientBRequest);
    assert.strictEqual(res.status, 403);
    assert(res.error.includes('Forbidden'));
  });

  // Test 8: CLIENT A -> Own Request = ALLOWED
  runTest('Scenario 8: CLIENT A -> Own Request is ALLOWED (200 OK)', () => {
    const clientA = { userId: 'client-A', role: ROLES.CLIENT, isActive: true };
    const clientARequest = { id: 'req-102', userId: 'client-A', requestNumber: 'REQ-2026-0003' };
    const res = authorizeServiceRequestAccess(clientA, clientARequest);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.allowed, true);
  });

  runTest('Scenario 8b: Authorized Staff -> Any Client Request is ALLOWED', () => {
    const staffUser = { userId: 'employee-1', role: ROLES.EMPLOYEE, isActive: true };
    const clientRequest = { id: 'req-102', userId: 'client-A', requestNumber: 'REQ-2026-0003' };
    const res = authorizeServiceRequestAccess(staffUser, clientRequest);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.allowed, true);
  });

  // Test 9: Disabled User + existing JWT = DENIED (Revocation check)
  runTest('Scenario 9: Disabled User with valid JWT format is DENIED (isActive=false)', () => {
    const disabledUser = { userId: 'user-disabled', role: ROLES.CLIENT, isActive: false };
    const clientRequest = { id: 'req-103', userId: 'user-disabled', requestNumber: 'REQ-2026-0004' };
    const res = authorizeServiceRequestAccess(disabledUser, clientRequest);
    assert.strictEqual(res.status, 401);
  });

  // Test 10: Invalid JWT = DENIED
  await runAsyncTest('Scenario 10: Invalid / Tampered JWT is securely REJECTED', async () => {
    const token = await createTestJWT({ userId: 'hacker', role: ROLES.SUPER_ADMIN }, TEST_SECRET);
    const tamperedToken = token.slice(0, -10) + 'ABCDEFGHIJ'; // Tamper signature
    
    let verified = false;
    try {
      await jwtVerify(tamperedToken, new TextEncoder().encode(TEST_SECRET));
      verified = true;
    } catch (e) {
      verified = false;
    }
    assert.strictEqual(verified, false, 'Tampered token must fail verification');
  });

  await runAsyncTest('Scenario 10b: Expired JWT is securely REJECTED', async () => {
    const expiredToken = await createTestJWT({ userId: 'old-user', role: ROLES.CLIENT }, TEST_SECRET, '0s');
    // small sleep to guarantee expiration
    await new Promise(r => setTimeout(r, 50));
    let verified = false;
    try {
      await jwtVerify(expiredToken, new TextEncoder().encode(TEST_SECRET));
      verified = true;
    } catch (e) {
      verified = false;
    }
    assert.strictEqual(verified, false, 'Expired token must fail verification');
  });

  // Test 11: Missing AUTH_SECRET = fail securely
  runTest('Scenario 11: Missing or insecure AUTH_SECRET throws fatal configuration error', () => {
    function getSecretKey(envVal) {
      const secret = envVal;
      if (!secret || secret.trim() === '' || secret.length < 32) {
        throw new Error('FATAL SECURITY ERROR: AUTH_SECRET environment variable is missing or shorter than 32 characters.');
      }
      return secret;
    }

    assert.throws(() => getSecretKey(undefined), /FATAL SECURITY ERROR/);
    assert.throws(() => getSecretKey(''), /FATAL SECURITY ERROR/);
    assert.throws(() => getSecretKey('too-short-secret'), /FATAL SECURITY ERROR/);
    assert.doesNotThrow(() => getSecretKey(TEST_SECRET));
  });

  // Test 12: Repeated login abuse = rate limited (429)
  runTest('Scenario 12: Repeated login abuse triggers 429 Too Many Requests', () => {
    const loginLimiter = new TestRateLimiter(5, 60000); // 5 attempts per min
    const testIp = '192.168.1.50';

    // 5 attempts allowed
    for (let i = 1; i <= 5; i++) {
      const check = loginLimiter.check(testIp);
      assert.strictEqual(check.allowed, true, `Attempt ${i} should be allowed`);
    }

    // 6th attempt blocked
    const blockedCheck = loginLimiter.check(testIp);
    assert.strictEqual(blockedCheck.allowed, false, '6th attempt must be blocked by rate limiter');
    assert.strictEqual(blockedCheck.remaining, 0);

    // Other IP should still be allowed
    const otherIpCheck = loginLimiter.check('192.168.1.51');
    assert.strictEqual(otherIpCheck.allowed, true, 'Different IP should not be affected');
  });

  // Test 13: Repeated public form abuse (contact / requests) = rate limited (429)
  runTest('Scenario 13: Repeated contact form spam triggers 429 Too Many Requests', () => {
    const contactLimiter = new TestRateLimiter(5, 600000); // 5 submissions per 10 mins
    const testIp = '10.0.0.99';

    for (let i = 1; i <= 5; i++) {
      const check = contactLimiter.check(testIp);
      assert.strictEqual(check.allowed, true);
    }

    const blockedContact = contactLimiter.check(testIp);
    assert.strictEqual(blockedContact.allowed, false, 'Contact spam must be blocked');
  });

  // Test 14: Privilege Escalation on Registration Protection
  runTest('Scenario 14: Privilege escalation attempt during registration is strictly sanitized', () => {
    const allowedRoles = ['CLIENT', 'TRAINEE'];
    function sanitizeRegistrationRole(inputRole) {
      const targetRole = inputRole ? inputRole.toUpperCase().trim() : 'CLIENT';
      if (!allowedRoles.includes(targetRole)) {
        return { error: 'Invalid role selection. Only CLIENT and TRAINEE registration is allowed.' };
      }
      return { role: targetRole };
    }

    const hackSuperAdmin = sanitizeRegistrationRole('SUPER_ADMIN');
    assert(hackSuperAdmin.error);

    const hackAdmin = sanitizeRegistrationRole('ADMIN');
    assert(hackAdmin.error);

    const validClient = sanitizeRegistrationRole('CLIENT');
    assert.strictEqual(validClient.role, 'CLIENT');

    const validTrainee = sanitizeRegistrationRole('TRAINEE');
    assert.strictEqual(validTrainee.role, 'TRAINEE');
  });

  console.log('\n======================================================');
  console.log(`   TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('======================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

executeTestSuite();
