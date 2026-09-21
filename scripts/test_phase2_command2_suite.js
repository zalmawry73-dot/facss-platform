/**
 * Phase 2 - Command 2 Comprehensive Test Suite
 * Local Platform: Aden International Center for Safety and Field Assessment (FACSS)
 * Validates:
 * 1. AES-256-GCM Cryptographic Engine (Positive, Tamper Detection, Key Isolation)
 * 2. Database Schema & Legacy Data Retention
 * 3. User Management & Privilege Escalation Prevention
 * 4. FIELD_FOCAL_POINT Isolation (Excluded from STAFF_ROLES & Admin capabilities)
 * 5. Triple-Gate Redacted Incident Access Control
 * 6. Strict SUPER_ADMIN Access Gate for IncidentOriginal
 * 7. Synthetic Data Cleanup
 */

const { PrismaClient } = require('@prisma/client');
const {
  encryptField,
  decryptField,
  encryptIncidentOriginalPayload,
  decryptIncidentOriginalPayload,
} = require('../lib/security/crypto');
const crypto = require('crypto');

const prisma = new PrismaClient();

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    failedTests++;
    throw new Error(message);
  } else {
    console.log(`  ✅ PASSED: ${message}`);
    passedTests++;
  }
}

async function runSuite() {
  console.log('===============================================================');
  console.log('  FACSS PHASE 2 - COMMAND 2: VERIFICATION & AUDIT TEST SUITE   ');
  console.log('===============================================================\n');

  // -----------------------------------------------------------------
  // 1. CRYPTO ENGINE TESTS
  // -----------------------------------------------------------------
  console.log('▶ [1/6] Testing AES-256-GCM Encryption Engine & Tamper Detection...');
  
  const mockSensitiveData = {
    sourceType: 'WITNESS',
    sourceName: 'سعيد عبد الله (شاهد عيان ميداني - اصطناعي)',
    sourceContactPhone: '+967 770 000 111',
    sourceOrganization: 'منظمة إغاثية دولية ميدانية - اختبار',
    exactLatitude: 12.7954,
    exactLongitude: 45.0215,
    exactLocationDesc: 'المنصورة، جولة كالتكس، بالقرب من المستودع الطبي',
    rawDescription: 'إطلاق نار كثيف بالقرب من النقطة الأمنية واحتجاز مركبتين، الوضع متوتر جداً.',
    initialRiskNotes: 'المنطقة تشهد توتراً مستمراً ومخاطر عالية على حركة الطواقم.',
  };

  // Positive: Encryption & Decryption
  const encryptedPayload = encryptIncidentOriginalPayload(mockSensitiveData);
  assert(typeof encryptedPayload.sourceNameEnc === 'string', 'sourceNameEnc generated as string');
  assert(encryptedPayload.sourceNameEnc.startsWith('enc:v1:'), 'sourceNameEnc contains standard enc:v1: prefix');
  assert(typeof encryptedPayload.rawDescriptionEnc === 'string', 'rawDescriptionEnc generated as string');
  assert(typeof encryptedPayload.exactLatEnc === 'string', 'exactLatEnc generated as string');

  // Assert no plaintext leakage in ciphertexts
  assert(!encryptedPayload.sourceNameEnc.includes('سعيد عبد الله'), 'Reporter name is NOT leaked in ciphertext');
  assert(!encryptedPayload.exactLatEnc.includes('12.7954'), 'Coordinates are NOT leaked in ciphertext');
  assert(!encryptedPayload.rawDescriptionEnc.includes('إطلاق نار'), 'Raw narrative is NOT leaked in ciphertext');

  const decryptedPayload = decryptIncidentOriginalPayload(encryptedPayload);
  assert(decryptedPayload.sourceName === mockSensitiveData.sourceName, 'Decrypted sourceName matches exactly');
  assert(decryptedPayload.exactLatitude === mockSensitiveData.exactLatitude, 'Decrypted exactLatitude matches exactly');
  assert(decryptedPayload.rawDescription === mockSensitiveData.rawDescription, 'Decrypted rawDescription matches exactly');
  assert(decryptedPayload.initialRiskNotes === mockSensitiveData.initialRiskNotes, 'Decrypted initialRiskNotes matches exactly');

  // Negative: Tamper Detection (Modify Single Ciphertext Byte)
  let tamperedDetected = false;
  try {
    const parts = encryptedPayload.rawDescriptionEnc.split(':');
    // Corrupt ciphertext body
    const corruptedBase64 = parts[4].slice(0, -2) + (parts[4].slice(-2) === 'aa' ? 'bb' : 'aa');
    parts[4] = corruptedBase64;
    const tamperedEnc = parts.join(':');

    decryptField(tamperedEnc);
  } catch (err) {
    tamperedDetected = err.message.includes('SECURITY INTEGRITY FAILURE');
  }
  assert(tamperedDetected, 'Tampered ciphertext rejected with SECURITY INTEGRITY FAILURE');

  // Negative: Wrong Key Rejection
  let wrongKeyDetected = false;
  try {
    const wrongKey = crypto.randomBytes(32);
    decryptField(encryptedPayload.rawDescriptionEnc, wrongKey);
  } catch (err) {
    wrongKeyDetected = err.message.includes('SECURITY INTEGRITY FAILURE');
  }
  assert(wrongKeyDetected, 'Decryption with invalid key rejected with auth tag failure');

  // -----------------------------------------------------------------
  // 2. DATABASE SCHEMA & LEGACY DATA INTEGRITY
  // -----------------------------------------------------------------
  console.log('\n▶ [2/6] Testing Database Schema & Legacy Data Retention...');

  const servicesCount = await prisma.service.count();
  const categoriesCount = await prisma.serviceCategory.count();
  const usersCount = await prisma.user.count();
  const legacySuperAdmin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });

  assert(servicesCount >= 12, `Legacy services intact (${servicesCount} records found)`);
  assert(categoriesCount >= 9, `Legacy categories intact (${categoriesCount} records found)`);
  assert(usersCount >= 1, `Legacy users intact (${usersCount} records found)`);
  assert(legacySuperAdmin !== null, 'Legacy SUPER_ADMIN account preserved');

  // Verify Phase 2 models exist and are queryable
  const incidentCount = await prisma.incident.count();
  const alertCount = await prisma.incidentAlert.count();
  const snapshotCount = await prisma.alertSnapshot.count();
  assert(incidentCount === 0, 'Incident model is initialized and queryable');
  assert(alertCount === 0, 'IncidentAlert model is initialized and queryable');
  assert(snapshotCount === 0, 'AlertSnapshot model is initialized and queryable');

  // -----------------------------------------------------------------
  // 3. USER MANAGEMENT & PRIVILEGE ESCALATION PREVENTION
  // -----------------------------------------------------------------
  console.log('\n▶ [3/6] Testing User Management & Privilege Escalation Prevention...');

  const testEmailStaff = `test.staff.${Date.now()}@facss.org`;
  const testEmailFocal = `test.focal.${Date.now()}@facss.org`;
  const testEmailEscalation = `test.super.${Date.now()}@facss.org`;

  // Validation logic testing
  const { validateCreateUserInput } = require('../lib/validations/admin');

  // Negative: Attempt creating SUPER_ADMIN via input validation
  const invalidAdminInput = validateCreateUserInput({
    fullName: 'Test Super Admin Attempt',
    email: testEmailEscalation,
    password: 'password12345',
    role: 'SUPER_ADMIN',
  });
  assert(!invalidAdminInput.success, 'Validation rejects creating SUPER_ADMIN via standard user creation API');

  // Negative: Attempt giving FIELD_FOCAL_POINT administrative capabilities
  const invalidFocalInput = validateCreateUserInput({
    fullName: 'Test Focal Escalation',
    email: testEmailFocal,
    password: 'password12345',
    role: 'FIELD_FOCAL_POINT',
    capabilities: ['manage_users', 'manage_requests'],
  });
  assert(!invalidFocalInput.success, 'Validation rejects giving admin capabilities to FIELD_FOCAL_POINT');
  assert(invalidFocalInput.errors.capabilities.includes('submit_incident'), 'Error explicitly mentions focal point isolation constraint');

  // Positive: Valid Staff User Creation
  const validStaffInput = validateCreateUserInput({
    fullName: 'أحمد سالم باوزير (كادر اختبار اصطناعي)',
    email: testEmailStaff,
    password: 'SecurePassword123!',
    role: 'STAFF',
    functionalArea: 'MONITORING_ANALYSIS',
    capabilities: ['analyze_incident', 'verify_incident'],
  });
  assert(validStaffInput.success, 'Valid staff user input accepted');

  const createdStaff = await prisma.user.create({
    data: {
      email: testEmailStaff,
      fullName: validStaffInput.data.fullName,
      passwordHash: 'dummy_hash_for_test',
      role: 'STAFF',
      organization: 'وحدة الرصد والتحليل [MONITORING_ANALYSIS]',
      isActive: true,
      capabilities: {
        create: validStaffInput.data.capabilities.map((c) => ({ capability: c })),
      },
    },
    include: { capabilities: true },
  });
  assert(createdStaff.id !== undefined, 'Synthetic STAFF user created in database');
  assert(createdStaff.capabilities.length === 2, 'STAFF assigned exactly 2 incident capabilities');

  // Positive: Valid Focal Point User Creation
  const validFocalInput = validateCreateUserInput({
    fullName: 'سالم الكندي (نقطة اتصال اختبار اصطناعي)',
    email: testEmailFocal,
    password: 'SecurePassword123!',
    role: 'FIELD_FOCAL_POINT',
    functionalArea: 'RESEARCH_FIELD_FOCAL',
    capabilities: ['submit_incident'],
  });
  assert(validFocalInput.success, 'Valid FIELD_FOCAL_POINT input accepted');

  const createdFocal = await prisma.user.create({
    data: {
      email: testEmailFocal,
      fullName: validFocalInput.data.fullName,
      passwordHash: 'dummy_hash_for_test',
      role: 'FIELD_FOCAL_POINT',
      organization: 'شبكة الاتصال الميداني [RESEARCH_FIELD_FOCAL]',
      isActive: true,
      capabilities: {
        create: [{ capability: 'submit_incident' }],
      },
    },
    include: { capabilities: true },
  });
  assert(createdFocal.role === 'FIELD_FOCAL_POINT', 'Synthetic FIELD_FOCAL_POINT created with proper enum');
  assert(createdFocal.capabilities[0].capability === 'submit_incident', 'Focal point granted only submit_incident');

  // -----------------------------------------------------------------
  // 4. FIELD_FOCAL_POINT ISOLATION TESTS
  // -----------------------------------------------------------------
  console.log('\n▶ [4/6] Testing FIELD_FOCAL_POINT Isolation from Staff/Admin & /admin...');

  const { STAFF_ROLES, getUserCapabilities, ROLES } = require('../lib/rbac');

  // Check role array exclusion
  assert(!STAFF_ROLES.includes('FIELD_FOCAL_POINT'), 'FIELD_FOCAL_POINT is strictly excluded from STAFF_ROLES (blocks /admin access)');

  // Check capabilities resolution
  const focalCaps = getUserCapabilities({
    role: 'FIELD_FOCAL_POINT',
    isActive: true,
    capabilities: ['submit_incident'],
  });
  assert(focalCaps.includes('submit_incident'), 'Focal point has submit_incident capability');
  assert(!focalCaps.includes('manage_users'), 'Focal point has NO manage_users capability');
  assert(!focalCaps.includes('manage_requests'), 'Focal point has NO manage_requests capability');
  assert(!focalCaps.includes('view_audit_logs'), 'Focal point has NO view_audit_logs capability');

  // Test deactivation blocks all access
  const deactivatedFocalCaps = getUserCapabilities({
    role: 'FIELD_FOCAL_POINT',
    isActive: false,
    capabilities: ['submit_incident'],
  });
  assert(deactivatedFocalCaps.length === 0, 'Deactivated focal point receives ZERO capabilities');

  // -----------------------------------------------------------------
  // 5. TRIPLE-GATE REDACTED INCIDENT ACCESS LOGIC
  // -----------------------------------------------------------------
  console.log('\n▶ [5/6] Testing Triple-Gate Redacted Incident Access Control...');

  const { canAccessRedactedIncident } = require('../lib/rbac');

  const mockIncidentId = 'inc_synthetic_test_999';

  // Gate 1: Inactive account
  const testInactiveUser = {
    userId: createdStaff.id,
    role: 'STAFF',
    isActive: false,
    capabilities: ['analyze_incident'],
  };
  const gate1Result = canAccessRedactedIncident(testInactiveUser, mockIncidentId, [createdStaff.id]);
  assert(!gate1Result.authorized, 'Gate 1: Inactive account is rejected');
  assert(gate1Result.reason === 'ACCESS_DENIED_ACCOUNT_INACTIVE', 'Gate 1: Reason is ACCESS_DENIED_ACCOUNT_INACTIVE');

  // Gate 2: Active account but missing capability
  const testNoCapUser = {
    userId: createdStaff.id,
    role: 'STAFF',
    isActive: true,
    capabilities: ['manage_messages'], // Unrelated capability
  };
  const gate2Result = canAccessRedactedIncident(testNoCapUser, mockIncidentId, [createdStaff.id]);
  assert(!gate2Result.authorized, 'Gate 2: User without incident capabilities is rejected');
  assert(gate2Result.reason === 'ACCESS_DENIED_CAPABILITY_REQUIRED', 'Gate 2: Reason is ACCESS_DENIED_CAPABILITY_REQUIRED');

  // Gate 3: Active account + capability, but NOT assigned to incident
  const testUnassignedUser = {
    userId: createdStaff.id,
    role: 'STAFF',
    isActive: true,
    capabilities: ['analyze_incident'],
  };
  const gate3Result = canAccessRedactedIncident(testUnassignedUser, mockIncidentId, ['different_user_id']);
  assert(!gate3Result.authorized, 'Gate 3: Unassigned user is rejected even with capability');
  assert(gate3Result.reason === 'ACCESS_DENIED_NO_ACTIVE_ASSIGNMENT', 'Gate 3: Reason is ACCESS_DENIED_NO_ACTIVE_ASSIGNMENT');

  // Success: Active account + capability + active assignment
  const gateSuccessResult = canAccessRedactedIncident(testUnassignedUser, mockIncidentId, [createdStaff.id]);
  assert(gateSuccessResult.authorized, 'Triple-Gate Passed: Active account + capability + active assignment -> Authorized');

  // -----------------------------------------------------------------
  // 6. STRICT SUPER_ADMIN ACCESS FOR INCIDENT ORIGINAL
  // -----------------------------------------------------------------
  console.log('\n▶ [6/6] Testing Strict SUPER_ADMIN Access Gate for Sensitive Original...');

  const { canAccessOriginalIncident } = require('../lib/rbac');

  assert(canAccessOriginalIncident({ role: 'SUPER_ADMIN', isActive: true }).authorized, 'SUPER_ADMIN can access original');
  assert(!canAccessOriginalIncident({ role: 'SUPER_ADMIN', isActive: false }).authorized, 'Inactive SUPER_ADMIN cannot access original');
  assert(!canAccessOriginalIncident({ role: 'ADMIN', isActive: true }).authorized, 'ADMIN is strictly blocked from sensitive original');
  assert(!canAccessOriginalIncident({ role: 'STAFF', isActive: true }).authorized, 'STAFF is strictly blocked from sensitive original');
  assert(!canAccessOriginalIncident({ role: 'FIELD_FOCAL_POINT', isActive: true }).authorized, 'FIELD_FOCAL_POINT is strictly blocked from sensitive original');

  // -----------------------------------------------------------------
  // CLEANUP SYNTHETIC DATA
  // -----------------------------------------------------------------
  console.log('\n▶ Cleaning up synthetic test data...');
  await prisma.userCapability.deleteMany({
    where: { userId: { in: [createdStaff.id, createdFocal.id] } },
  });
  await prisma.user.deleteMany({
    where: { id: { in: [createdStaff.id, createdFocal.id] } },
  });
  console.log('  🧹 Cleaned up synthetic test users and capabilities.');

  console.log('\n===============================================================');
  console.log(`  TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('===============================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSuite()
  .catch((e) => {
    console.error('Test suite execution error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
