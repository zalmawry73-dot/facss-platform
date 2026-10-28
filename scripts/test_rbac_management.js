/**
 * Automated Verification Test for FACSS RBAC Management System
 * Tests:
 * 1. Canonical Capability Definitions & Coverage (All 24 capabilities)
 * 2. Role Inheritance Logic & Effective Capability Resolution
 * 3. Staged Draft & Atomic Persistence via PUT /api/admin/users/[id]/capabilities
 * 4. Security Gates:
 *    - Gate 1: Non-super-admin self-privilege escalation prevention
 *    - Gate 2: Non-super-admin modification of SUPER_ADMIN prevention
 *    - Gate 3: Restricted system permissions (manage_users, manage_settings) guard
 *    - Gate 4: Focal point security boundary isolation
 * 5. Real-time Authorization Efficacy
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const {
  ALL_CAPABILITIES,
  ADMIN_OPERATIONAL_CAPABILITIES,
  LEGACY_ROLE_CAPABILITIES,
} = require('../lib/rbac-definitions');

const BASE_URL = 'http://localhost:3000';

function getRoleInheritedCapabilities(role) {
  if (role === 'SUPER_ADMIN') return [...ALL_CAPABILITIES];
  if (role === 'ADMIN') return [...ADMIN_OPERATIONAL_CAPABILITIES];
  if (LEGACY_ROLE_CAPABILITIES[role]) return [...LEGACY_ROLE_CAPABILITIES[role]];
  return [];
}

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const cookie = res.headers.get('set-cookie');
  const tokenCookie = cookie ? cookie.split(';')[0] : '';
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data, cookie: tokenCookie };
}

async function runTests() {
  console.log('================================================================');
  console.log('  FACSS RBAC & PERMISSIONS MANAGEMENT AUTOMATED VERIFICATION  ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${detail}`);
      failed++;
    }
  }

  // --- Test Suite 1: Canonical Capabilities Coverage ---
  console.log('\n--- 1. Canonical Capability Definitions & Model Integrity ---');
  assert(ALL_CAPABILITIES.length === 24, 'Total canonical capabilities count is exactly 24');
  const uniqueCaps = new Set(ALL_CAPABILITIES);
  assert(uniqueCaps.size === 24, 'All 24 capability identifiers are strictly unique');

  // --- Test Suite 2: Role Inheritance Engine ---
  console.log('\n--- 2. Role Inheritance Engine Verification ---');
  const superAdminInherited = getRoleInheritedCapabilities('SUPER_ADMIN');
  assert(superAdminInherited.length === 24, 'SUPER_ADMIN inherits all 24 capabilities');

  const adminInherited = getRoleInheritedCapabilities('ADMIN');
  assert(adminInherited.length === 16, 'ADMIN inherits 16 operational capabilities');

  const serviceInherited = getRoleInheritedCapabilities('SERVICE_MANAGER');
  assert(
    serviceInherited.length === 5 &&
      serviceInherited.includes('manage_requests') &&
      serviceInherited.includes('manage_inventory') &&
      serviceInherited.includes('manage_procurement') &&
      serviceInherited.includes('manage_equipment') &&
      serviceInherited.includes('manage_inspections'),
    'SERVICE_MANAGER inherits 5 field operations & logistics capabilities'
  );

  const trainInherited = getRoleInheritedCapabilities('TRAINING_MANAGER');
  assert(
    trainInherited.length === 3 &&
      trainInherited.includes('manage_training') &&
      trainInherited.includes('manage_trainers') &&
      trainInherited.includes('manage_training_content'),
    'TRAINING_MANAGER inherits 3 academy & training capabilities'
  );

  const researchInherited = getRoleInheritedCapabilities('RESEARCH_MANAGER');
  assert(
    researchInherited.length === 1 && researchInherited.includes('manage_research'),
    'RESEARCH_MANAGER inherits 1 core research capability'
  );

  const staffInherited = getRoleInheritedCapabilities('STAFF');
  assert(staffInherited.length === 0, 'STAFF role inherits 0 capabilities (Least Privilege Baseline)');

  const focalInherited = getRoleInheritedCapabilities('FIELD_FOCAL_POINT');
  assert(focalInherited.length === 0, 'FIELD_FOCAL_POINT role inherits 0 capabilities (Security Isolation)');

  // --- Test Suite 3: Database & User Profiles Verification ---
  console.log('\n--- 3. Database User Profiles & Effective Capabilities Resolution ---');
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@facss-aden.com' },
    include: { capabilities: true },
  });
  assert(Boolean(adminUser), 'Super Admin user exists in database');

  const serviceUser = await prisma.user.findUnique({
    where: { email: 'services@facss-aden.com' },
    include: { capabilities: true },
  });
  assert(Boolean(serviceUser), 'SERVICE_MANAGER user exists in database');

  if (serviceUser) {
    const directAssigned = serviceUser.capabilities.map((c) => c.capability);
    const effective = Array.from(new Set([...directAssigned, ...serviceInherited]));
    console.log(`       Direct Assigned: ${directAssigned.length} capabilities`);
    console.log(`       Inherited: ${serviceInherited.length} capabilities`);
    console.log(`       Total Effective: ${effective.length} capabilities`);
    assert(effective.length === 13, 'SERVICE_MANAGER has exactly 13 effective capabilities');
  }

  // --- Test Suite 4: Authenticated API Persistence & Security Gates ---
  console.log('\n--- 4. Authenticated API Persistence & Security Gates Verification ---');
  const adminLogin = await login('admin@facss-aden.com', 'Admin@FACSS2026');
  assert(adminLogin.ok, 'Super Admin login successful and session established');

  if (adminLogin.ok && serviceUser) {
    const adminCookie = adminLogin.cookie;

    // 4.1 GET Capabilities
    const getRes = await fetch(`${BASE_URL}/api/admin/users/${serviceUser.id}/capabilities`, {
      headers: { Cookie: adminCookie },
    });
    const getData = await getRes.json();
    assert(getRes.ok && Array.isArray(getData.capabilities), 'GET /api/admin/users/[id]/capabilities succeeds');

    // 4.2 PUT Capabilities (Staged Update & Atomic Persistence)
    const originalCaps = serviceUser.capabilities.map((c) => c.capability);
    const testNewCaps = [...originalCaps];
    // Add assess_risk if not present
    if (!testNewCaps.includes('assess_risk')) {
      testNewCaps.push('assess_risk');
    }

    const putRes = await fetch(`${BASE_URL}/api/admin/users/${serviceUser.id}/capabilities`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ capabilities: testNewCaps }),
    });
    const putData = await putRes.json();
    assert(putRes.ok && putData.success, 'PUT /api/admin/users/[id]/capabilities successfully saves updated capabilities');

    // Verify in database
    const dbCapsAfterPut = await prisma.userCapability.findMany({
      where: { userId: serviceUser.id },
    });
    const savedCapsList = dbCapsAfterPut.map((c) => c.capability);
    assert(
      savedCapsList.includes('assess_risk'),
      'Newly assigned capability is verified in database immediately'
    );

    // Rollback / restore original
    await fetch(`${BASE_URL}/api/admin/users/${serviceUser.id}/capabilities`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ capabilities: originalCaps }),
    });

    const dbCapsAfterRollback = await prisma.userCapability.findMany({
      where: { userId: serviceUser.id },
    });
    assert(
      dbCapsAfterRollback.length === originalCaps.length,
      'Original capabilities successfully restored after verification'
    );

    // 4.3 Security Gate 4: Focal Point Isolation
    const focalUser = await prisma.user.findFirst({
      where: { role: 'FIELD_FOCAL_POINT' },
    });

    if (focalUser) {
      const illegalFocalPut = await fetch(`${BASE_URL}/api/admin/users/${focalUser.id}/capabilities`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
        body: JSON.stringify({ capabilities: ['manage_users', 'manage_requests'] }),
      });
      assert(
        illegalFocalPut.status === 403,
        'Security Gate 4: System strictly forbids granting admin capabilities to FIELD_FOCAL_POINT (HTTP 403)'
      );
    }

    // 4.4 Security Gate 1: Non-Super-Admin Self-Escalation Protection
    const serviceLogin = await login('services@facss-aden.com', 'Service@FACSS2026');
    if (serviceLogin.ok) {
      const serviceCookie = serviceLogin.cookie;

      // Try self-modifying capabilities
      const selfModRes = await fetch(`${BASE_URL}/api/admin/users/${serviceUser.id}/capabilities`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: serviceCookie,
        },
        body: JSON.stringify({ capabilities: ['manage_users'] }),
      });
      assert(
        selfModRes.status === 403,
        'Security Gate 1: Non-super-admin self-privilege escalation is blocked (HTTP 403)'
      );

      // Security Gate 2: Non-super-admin attempting to modify SUPER_ADMIN capabilities
      const modSuperAdminRes = await fetch(`${BASE_URL}/api/admin/users/${adminUser.id}/capabilities`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: serviceCookie,
        },
        body: JSON.stringify({ capabilities: [] }),
      });
      assert(
        modSuperAdminRes.status === 403,
        'Security Gate 2: Non-super-admin modification of SUPER_ADMIN capabilities is blocked (HTTP 403)'
      );

      // Security Gate 3: Non-super-admin attempting to assign restricted capability to another user
      const trainUser = await prisma.user.findUnique({ where: { email: 'training@facss-aden.com' } });
      if (trainUser) {
        const assignRestrictedRes = await fetch(`${BASE_URL}/api/admin/users/${trainUser.id}/capabilities`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: serviceCookie,
          },
          body: JSON.stringify({ capabilities: ['manage_users'] }),
        });
        assert(
          assignRestrictedRes.status === 403,
          'Security Gate 3: Non-super-admin assignment of restricted capability (manage_users) is blocked (HTTP 403)'
        );
      }
    }
  }

  // --- Summary ---
  console.log('\n================================================================');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
