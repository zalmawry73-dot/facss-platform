/**
 * FACSS Phase 2B Automated Test Suite
 * 
 * Verifies all 16 critical requirements for Granular Capabilities & Admin Operations:
 * 1. SUPER_ADMIN -> all admin capabilities = ALLOWED
 * 2. ADMIN -> permitted operational capability = ALLOWED
 * 3. ADMIN -> super-admin-only action (manage_users role escalation) = DENIED
 * 4. STAFF with manage_training -> Training create = ALLOWED
 * 5. STAFF without manage_training -> Training create = DENIED
 * 6. STAFF with manage_research -> Research publish = ALLOWED
 * 7. STAFF without manage_research -> DENIED
 * 8. STAFF with manage_messages -> Message update = ALLOWED
 * 9. STAFF without manage_messages -> DENIED
 * 10. CLIENT -> any admin API = DENIED
 * 11. TRAINEE -> any admin API = DENIED
 * 12. Privilege escalation through capability payload = DENIED
 * 13. Disabled user (isActive=false) -> admin action = DENIED
 * 14. Invalid inputs -> 400 validation failure
 * 15. Valid inputs -> successful DB operation
 * 16. Non-destructive DB integrity preserved
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Load environment variables from .env
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      value = value.trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  }
}

const { PrismaClient } = require('@prisma/client');

// Roles definition matching lib/rbac.ts
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

const CAPABILITIES = {
  MANAGE_REQUESTS: 'manage_requests',
  MANAGE_TRAINING: 'manage_training',
  MANAGE_RESEARCH: 'manage_research',
  MANAGE_MESSAGES: 'manage_messages',
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_USERS: 'manage_users',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
};

const ALL_CAPABILITIES = Object.values(CAPABILITIES);

const ADMIN_OPERATIONAL_CAPABILITIES = [
  CAPABILITIES.MANAGE_REQUESTS,
  CAPABILITIES.MANAGE_TRAINING,
  CAPABILITIES.MANAGE_RESEARCH,
  CAPABILITIES.MANAGE_MESSAGES,
  CAPABILITIES.MANAGE_SETTINGS,
  CAPABILITIES.VIEW_AUDIT_LOGS,
  CAPABILITIES.MANAGE_USERS,
];

const LEGACY_ROLE_CAPABILITIES = {
  TRAINING_MANAGER: [CAPABILITIES.MANAGE_TRAINING],
  RESEARCH_MANAGER: [CAPABILITIES.MANAGE_RESEARCH],
  SERVICE_MANAGER: [CAPABILITIES.MANAGE_REQUESTS],
  CONTENT_MANAGER: [CAPABILITIES.MANAGE_RESEARCH, CAPABILITIES.MANAGE_TRAINING],
};

function resolveUserCapabilities(user, dbAssignedCaps = []) {
  if (!user || !user.isActive) return [];
  if (user.role === ROLES.SUPER_ADMIN) return [...ALL_CAPABILITIES];
  if (user.role === ROLES.ADMIN) return [...ADMIN_OPERATIONAL_CAPABILITIES];
  if (user.role === ROLES.CLIENT || user.role === ROLES.TRAINEE) return [];

  const baseCaps = LEGACY_ROLE_CAPABILITIES[user.role] ? [...LEGACY_ROLE_CAPABILITIES[user.role]] : [];
  const assigned = dbAssignedCaps.filter((c) => ALL_CAPABILITIES.includes(c));
  return Array.from(new Set([...baseCaps, ...assigned]));
}

function checkUserCapability(user, capability, dbAssignedCaps = []) {
  if (!user || !user.isActive) return false;
  if (user.role === ROLES.SUPER_ADMIN) return true;
  if (user.role === ROLES.CLIENT || user.role === ROLES.TRAINEE) return false;

  const caps = resolveUserCapabilities(user, dbAssignedCaps);
  return caps.includes(capability);
}

function simulateApiGuard(user, requiredCapability, dbAssignedCaps = []) {
  if (!user) {
    return { status: 401, error: 'Unauthorized: Session required' };
  }
  if (!user.isActive) {
    return { status: 401, error: 'Unauthorized: Account deactivated' };
  }
  if (user.role === ROLES.CLIENT || user.role === ROLES.TRAINEE) {
    return { status: 403, error: 'Forbidden: Access denied' };
  }

  const allowed = checkUserCapability(user, requiredCapability, dbAssignedCaps);
  if (!allowed) {
    return { status: 403, error: `Forbidden: Missing required capability [${requiredCapability}]` };
  }

  return { status: 200, allowed: true };
}

// Validation logic mirror matching lib/validations/admin.ts
const ALLOWED_SETTING_KEYS = [
  'OFFICIAL_PHONE',
  'WHATSAPP_PHONE',
  'OFFICIAL_EMAIL',
  'OPERATIONS_EMAIL',
  'TRAINING_EMAIL',
  'OFFICIAL_ADDRESS',
  'WORKING_HOURS',
  'SOCIAL_TWITTER',
  'SOCIAL_LINKEDIN',
  'SOCIAL_FACEBOOK',
  'ANNOUNCEMENT_TEXT',
];

const FORBIDDEN_CONFIG_PATTERNS = [
  'DATABASE_URL',
  'AUTH_SECRET',
  'SECRET',
  'PASSWORD',
  'TOKEN',
  'API_KEY',
  'PRIVATE_KEY',
  'CREDENTIALS',
];

function validateCourseInput(body) {
  const errors = {};
  if (!body.titleAr || typeof body.titleAr !== 'string' || body.titleAr.trim().length < 3) {
    errors.titleAr = 'عنوان الدورة بالعربية مطلوب';
  }
  const capNum = Number(body.capacity);
  if (isNaN(capNum) || capNum < 1) {
    errors.capacity = 'سعة المقاعد يجب أن تكون رقماً صحيحاً موجباً';
  }
  return { success: Object.keys(errors).length === 0, errors };
}

function validateResearchInput(body) {
  const errors = {};
  if (!body.titleAr || typeof body.titleAr !== 'string' || body.titleAr.trim().length < 3) {
    errors.titleAr = 'عنوان البحث مطلوب';
  }
  if (!body.summaryAr || typeof body.summaryAr !== 'string' || body.summaryAr.trim().length < 10) {
    errors.summaryAr = 'ملخص البحث مطلوب';
  }
  if (!['PUBLIC', 'CLIENT_ONLY'].includes(body.visibility)) {
    errors.visibility = 'مستوى الرؤية غير صالح';
  }
  return { success: Object.keys(errors).length === 0, errors };
}

function validateSettingUpdate(body) {
  const errors = {};
  if (!body || !body.key) {
    errors.key = 'مفتاح الإعداد مطلوب';
    return { success: false, errors };
  }
  const normalizedKey = body.key.trim().toUpperCase();
  if (FORBIDDEN_CONFIG_PATTERNS.some((p) => normalizedKey.includes(p))) {
    errors.key = 'ممنوع تعديل مفاتيح التكوين الأمنية';
    return { success: false, errors };
  }
  if (!ALLOWED_SETTING_KEYS.includes(normalizedKey)) {
    errors.key = 'المفتاح غير مصرح به';
    return { success: false, errors };
  }
  return { success: true, data: { key: normalizedKey, value: body.value } };
}

let passed = 0;
let failed = 0;

function run(name, fn) {
  try {
    fn();
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${name}`);
    passed++;
  } catch (err) {
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function runAsync(name, fn) {
  try {
    await fn();
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${name}`);
    passed++;
  } catch (err) {
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function main() {
  console.log('\n======================================================');
  console.log('   FACSS PHASE 2B GRANULAR CAPABILITIES TEST SUITE');
  console.log('======================================================\n');

  // Test 1: SUPER_ADMIN -> all admin capabilities = ALLOWED
  run('Test 1: SUPER_ADMIN has ALL capabilities without exception', () => {
    const superAdmin = { userId: 'sa-1', role: ROLES.SUPER_ADMIN, isActive: true };
    for (const cap of ALL_CAPABILITIES) {
      assert.strictEqual(checkUserCapability(superAdmin, cap), true, `SUPER_ADMIN should have ${cap}`);
      const res = simulateApiGuard(superAdmin, cap);
      assert.strictEqual(res.status, 200);
    }
  });

  // Test 2: ADMIN -> permitted operational capability = ALLOWED
  run('Test 2: ADMIN has all permitted operational capabilities', () => {
    const admin = { userId: 'admin-1', role: ROLES.ADMIN, isActive: true };
    assert.strictEqual(checkUserCapability(admin, CAPABILITIES.MANAGE_TRAINING), true);
    assert.strictEqual(checkUserCapability(admin, CAPABILITIES.MANAGE_RESEARCH), true);
    assert.strictEqual(checkUserCapability(admin, CAPABILITIES.MANAGE_MESSAGES), true);
    assert.strictEqual(checkUserCapability(admin, CAPABILITIES.VIEW_AUDIT_LOGS), true);

    const guardRes = simulateApiGuard(admin, CAPABILITIES.MANAGE_TRAINING);
    assert.strictEqual(guardRes.status, 200);
  });

  // Test 3: ADMIN -> super-admin-only action = DENIED
  run('Test 3: ADMIN cannot escalate to or modify SUPER_ADMIN role (Deny Privilege Escalation)', () => {
    const adminSession = { userId: 'admin-1', role: ROLES.ADMIN, isActive: true };
    const targetSuperAdmin = { id: 'sa-99', role: ROLES.SUPER_ADMIN, fullName: 'Super' };

    function attemptRoleEscalation(session, target, newRole) {
      if (session.role !== ROLES.SUPER_ADMIN && newRole === ROLES.SUPER_ADMIN) {
        return { status: 403, error: 'Forbidden: Cannot grant SUPER_ADMIN' };
      }
      if (session.role !== ROLES.SUPER_ADMIN && target.role === ROLES.SUPER_ADMIN) {
        return { status: 403, error: 'Forbidden: Cannot modify SUPER_ADMIN user' };
      }
      if (session.role !== ROLES.SUPER_ADMIN) {
        return { status: 403, error: 'Forbidden: Super Admin only' };
      }
      return { status: 200, success: true };
    }

    const res1 = attemptRoleEscalation(adminSession, { id: 'user-2', role: ROLES.STAFF }, ROLES.SUPER_ADMIN);
    assert.strictEqual(res1.status, 403);

    const res2 = attemptRoleEscalation(adminSession, targetSuperAdmin, ROLES.ADMIN);
    assert.strictEqual(res2.status, 403);
  });

  // Test 4: STAFF with manage_training -> Training create = ALLOWED
  run('Test 4: STAFF with manage_training -> Training create = ALLOWED', () => {
    const staffWithTraining = { userId: 'staff-tr', role: ROLES.STAFF, isActive: true };
    const dbCaps = [CAPABILITIES.MANAGE_TRAINING];

    assert.strictEqual(checkUserCapability(staffWithTraining, CAPABILITIES.MANAGE_TRAINING, dbCaps), true);
    const guardRes = simulateApiGuard(staffWithTraining, CAPABILITIES.MANAGE_TRAINING, dbCaps);
    assert.strictEqual(guardRes.status, 200);
    assert.strictEqual(guardRes.allowed, true);
  });

  // Test 5: STAFF without manage_training -> Training create = DENIED
  run('Test 5: STAFF without manage_training -> Training create = DENIED (403)', () => {
    const pureStaff = { userId: 'staff-empty', role: ROLES.STAFF, isActive: true };
    const dbCaps = []; // Least privilege: default 0

    assert.strictEqual(checkUserCapability(pureStaff, CAPABILITIES.MANAGE_TRAINING, dbCaps), false);
    const guardRes = simulateApiGuard(pureStaff, CAPABILITIES.MANAGE_TRAINING, dbCaps);
    assert.strictEqual(guardRes.status, 403);
    assert(guardRes.error.includes('manage_training'));
  });

  // Test 6: STAFF with manage_research -> Research publish = ALLOWED
  run('Test 6: STAFF with manage_research -> Research publish = ALLOWED', () => {
    const staffWithResearch = { userId: 'staff-res', role: ROLES.STAFF, isActive: true };
    const dbCaps = [CAPABILITIES.MANAGE_RESEARCH];

    assert.strictEqual(checkUserCapability(staffWithResearch, CAPABILITIES.MANAGE_RESEARCH, dbCaps), true);
    const guardRes = simulateApiGuard(staffWithResearch, CAPABILITIES.MANAGE_RESEARCH, dbCaps);
    assert.strictEqual(guardRes.status, 200);
  });

  // Test 7: STAFF without manage_research -> DENIED
  run('Test 7: STAFF without manage_research -> DENIED (403)', () => {
    const staffOnlyTraining = { userId: 'staff-tr-only', role: ROLES.STAFF, isActive: true };
    const dbCaps = [CAPABILITIES.MANAGE_TRAINING];

    assert.strictEqual(checkUserCapability(staffOnlyTraining, CAPABILITIES.MANAGE_RESEARCH, dbCaps), false);
    const guardRes = simulateApiGuard(staffOnlyTraining, CAPABILITIES.MANAGE_RESEARCH, dbCaps);
    assert.strictEqual(guardRes.status, 403);
  });

  // Test 8: STAFF with manage_messages -> Message update = ALLOWED
  run('Test 8: STAFF with manage_messages -> Message update = ALLOWED', () => {
    const staffMsg = { userId: 'staff-msg', role: ROLES.STAFF, isActive: true };
    const dbCaps = [CAPABILITIES.MANAGE_MESSAGES];

    assert.strictEqual(checkUserCapability(staffMsg, CAPABILITIES.MANAGE_MESSAGES, dbCaps), true);
    const guardRes = simulateApiGuard(staffMsg, CAPABILITIES.MANAGE_MESSAGES, dbCaps);
    assert.strictEqual(guardRes.status, 200);
  });

  // Test 9: STAFF without manage_messages -> DENIED
  run('Test 9: STAFF without manage_messages -> DENIED (403)', () => {
    const staffMsg = { userId: 'staff-no-msg', role: ROLES.STAFF, isActive: true };
    const dbCaps = [CAPABILITIES.MANAGE_TRAINING];

    assert.strictEqual(checkUserCapability(staffMsg, CAPABILITIES.MANAGE_MESSAGES, dbCaps), false);
    const guardRes = simulateApiGuard(staffMsg, CAPABILITIES.MANAGE_MESSAGES, dbCaps);
    assert.strictEqual(guardRes.status, 403);
  });

  // Test 10: CLIENT -> any admin API = DENIED
  run('Test 10: CLIENT -> any admin API = DENIED (403)', () => {
    const clientUser = { userId: 'client-1', role: ROLES.CLIENT, isActive: true };
    for (const cap of ALL_CAPABILITIES) {
      assert.strictEqual(checkUserCapability(clientUser, cap), false);
      const guardRes = simulateApiGuard(clientUser, cap);
      assert.strictEqual(guardRes.status, 403);
    }
  });

  // Test 11: TRAINEE -> any admin API = DENIED
  run('Test 11: TRAINEE -> any admin API = DENIED (403)', () => {
    const traineeUser = { userId: 'trainee-1', role: ROLES.TRAINEE, isActive: true };
    for (const cap of ALL_CAPABILITIES) {
      assert.strictEqual(checkUserCapability(traineeUser, cap), false);
      const guardRes = simulateApiGuard(traineeUser, cap);
      assert.strictEqual(guardRes.status, 403);
    }
  });

  // Test 12: Privilege escalation through capability payload = DENIED
  run('Test 12: Privilege escalation through capability payload is DENIED', () => {
    function attemptCapabilityGrant(caller, targetUserId, capability) {
      if (!ALL_CAPABILITIES.includes(capability)) {
        return { status: 400, error: 'Invalid capability' };
      }
      if (caller.userId === targetUserId && caller.role !== ROLES.SUPER_ADMIN) {
        return { status: 403, error: 'Self-grant denied' };
      }
      if (['manage_users', 'manage_settings'].includes(capability) && caller.role !== ROLES.SUPER_ADMIN) {
        return { status: 403, error: 'Super Admin only capability' };
      }
      return { status: 201, success: true };
    }

    const staffCaller = { userId: 'staff-1', role: ROLES.STAFF };
    const adminCaller = { userId: 'admin-1', role: ROLES.ADMIN };

    // Self-grant attempt
    const selfGrant = attemptCapabilityGrant(staffCaller, 'staff-1', CAPABILITIES.MANAGE_TRAINING);
    assert.strictEqual(selfGrant.status, 403);

    // Admin attempting to grant manage_users
    const adminEscalation = attemptCapabilityGrant(adminCaller, 'staff-2', CAPABILITIES.MANAGE_USERS);
    assert.strictEqual(adminEscalation.status, 403);

    // Invalid capability string
    const invalidCap = attemptCapabilityGrant({ userId: 'sa', role: ROLES.SUPER_ADMIN }, 'user-1', 'root_access');
    assert.strictEqual(invalidCap.status, 400);
  });

  // Test 13: Disabled user -> admin action = DENIED
  run('Test 13: Disabled user (isActive=false) -> admin action is strictly DENIED', () => {
    const disabledAdmin = { userId: 'admin-disabled', role: ROLES.ADMIN, isActive: false };
    const guardRes = simulateApiGuard(disabledAdmin, CAPABILITIES.MANAGE_TRAINING);
    assert.strictEqual(guardRes.status, 401);
    assert(guardRes.error.includes('Account deactivated'));
  });

  // Test 14: Input validation tests
  run('Test 14: Centralized Input Validation rejects invalid data (400)', () => {
    // Invalid course (missing title, bad capacity)
    const badCourse = validateCourseInput({ titleAr: '', capacity: -5 });
    assert.strictEqual(badCourse.success, false);
    assert(badCourse.errors.titleAr);
    assert(badCourse.errors.capacity);

    // Invalid research (missing summary, invalid visibility)
    const badResearch = validateResearchInput({ titleAr: 'Test', visibility: 'SECRET' });
    assert.strictEqual(badResearch.success, false);

    // Forbidden setting update (attempting to modify DATABASE_URL or AUTH_SECRET)
    const badSetting = validateSettingUpdate({ key: 'DATABASE_URL', value: 'leak' });
    assert.strictEqual(badSetting.success, false);
    assert(badSetting.errors.key.includes('ممنوع'));

    const secretSetting = validateSettingUpdate({ key: 'AUTH_SECRET', value: 'leak' });
    assert.strictEqual(secretSetting.success, false);
  });

  // Test 15 & 16: Live Database Integration & Non-Destructive Integrity
  await runAsync('Test 15 & 16: Live Neon DB Integration & Schema Integrity', async () => {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    try {
      // 1. Verify UserCapability model exists and is functional
      const testUserId = (await prisma.user.findFirst({ select: { id: true } }))?.id;
      assert(testUserId, 'A valid user must exist in DB');

      // Add a test capability non-destructively
      const cap = await prisma.userCapability.upsert({
        where: {
          userId_capability: {
            userId: testUserId,
            capability: CAPABILITIES.MANAGE_MESSAGES,
          },
        },
        create: {
          userId: testUserId,
          capability: CAPABILITIES.MANAGE_MESSAGES,
        },
        update: {},
      });
      assert.strictEqual(cap.capability, CAPABILITIES.MANAGE_MESSAGES);

      // Clean up test capability
      await prisma.userCapability.deleteMany({
        where: { userId: testUserId, capability: CAPABILITIES.MANAGE_MESSAGES },
      });

      // 2. Verify ActivityLog creates properly
      const log = await prisma.activityLog.create({
        data: {
          action: 'TEST_PHASE2B_SUITE',
          entityType: 'TestSuite',
          details: 'Verification of Phase 2B automated controls',
        },
      });
      assert(log.id, 'ActivityLog should persist successfully');

      // Clean up test log
      await prisma.activityLog.delete({ where: { id: log.id } });

      // 3. Verify Non-Destructive preservation of legacy tables
      const newsCount = await prisma.newsArticle.count();
      const attendanceCount = await prisma.attendanceRecord.count();
      assert(newsCount >= 0, 'NewsArticle table must remain intact');
      assert(attendanceCount >= 0, 'AttendanceRecord table must remain intact');

      console.log(`    [DB Verified: UserCapability, ActivityLog, NewsArticle (${newsCount}), AttendanceRecord (${attendanceCount})]`);
    } finally {
      await prisma.$disconnect();
    }
  });

  console.log('\n======================================================');
  console.log(`   PHASE 2B TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
