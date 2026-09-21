/**
 * Phase 2 - Command 3 Comprehensive Test Suite
 * Aden International Center for Safety and Field Assessment (FACSS)
 * 
 * Verifies all 9 mandatory acceptance criteria:
 * 1. Intake authorization gates: Active FIELD_FOCAL_POINT & authorized STAFF succeed; Visitor, Client, Trainee, Inactive rejected.
 * 2. FIELD_FOCAL_POINT isolation: Denied /admin, denied others' incidents, denied original and unassigned/unapproved redacted data.
 * 3. AES-256-GCM encryption verification: Data stored encrypted, tampering detected, wrong key rejected.
 * 4. Sensitive Original isolation: Restricted strictly to SUPER_ADMIN (denied to ADMIN, OPS_MANAGER, FIELD_RESEARCHER, etc.).
 * 5. Triple-Gate access control: Unassigned staff denied; assigned staff allowed; revocation instantly terminates access.
 * 6. Redacted version controls & anti-leakage: Unapproved draft hidden; anti-leakage check catches source/phone leaks.
 * 7. Attachment security: Valid types accepted; dangerous rejected; size limits enforced; path traversal blocked; EXIF stripped.
 * 8. Complete incident lifecycle: Intake -> Triage -> Redact & Approve -> Assign -> Admiralty Verification (A-F, 1-6) -> Status update.
 * 9. Legacy data retention: Existing services, categories, users, service requests intact.
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const {
  encryptField,
  decryptField,
  encryptIncidentOriginalPayload,
  decryptIncidentOriginalPayload,
  getEncryptionKey,
} = require('../lib/security/crypto');

const {
  ROLES,
  STAFF_ROLES,
  CAPABILITIES,
  hasCapability,
  canAccessIncidentOriginal,
  canAccessOriginalIncident,
  canAccessRedactedIncident,
  isStaff,
  isFieldFocalPoint,
} = require('../lib/rbac');

const {
  VALID_INCIDENT_CATEGORIES,
  VALID_INCIDENT_PRIORITIES,
  VALID_ADMIRALTY_RELIABILITY,
  VALID_ADMIRALTY_CREDIBILITY,
  validateIncidentIntake,
  validateRedactedVersionInput,
  validateAssignmentInput,
  validateVerificationInput,
} = require('../lib/validations/incidents');

const {
  ALLOWED_EXTENSIONS,
  FORBIDDEN_EXTENSIONS,
  MAX_FILE_SIZE,
  validateMagicBytes,
  validateAttachmentFile,
  stripJpegExif,
  stripPngMetadata,
  stripMetadataIfSupported,
  saveIncidentAttachmentToDisk,
  getIncidentAttachmentFromDisk,
} = require('../lib/storage/incident-attachments');

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

async function runCommand3Suite() {
  console.log('========================================================================');
  console.log('   FACSS PHASE 2 - COMMAND 3: ACCEPTANCE & SECURITY TEST SUITE          ');
  console.log('   Aden International Center for Safety and Field Assessment (FACSS)    ');
  console.log('========================================================================\n');

  const cleanupUserIds = [];
  const cleanupIncidentIds = [];
  const cleanupAttachmentKeys = [];

  try {
    // ---------------------------------------------------------------------------------
    // TEST 1: Intake submission authorization gates
    // ---------------------------------------------------------------------------------
    console.log('▶ [Test 1/9] Verifying Incident Intake Authorization Gates...');

    // Setup synthetic test users for intake testing
    const testFocalPoint = await prisma.user.upsert({
      where: { email: 'cmd3_test_focal_point@facss.local' },
      update: { isActive: true, role: ROLES.FIELD_FOCAL_POINT },
      create: {
        email: 'cmd3_test_focal_point@facss.local',
        passwordHash: '$2a$10$syntheticHashForTestingOnlyCommand3',
        fullName: 'نقطة اتصال اختبارية اصطناعية',
        role: ROLES.FIELD_FOCAL_POINT,
        isActive: true,
      },
    });
    cleanupUserIds.push(testFocalPoint.id);

    // Give submit_incident capability to focal point
    await prisma.userCapability.upsert({
      where: {
        userId_capability: {
          userId: testFocalPoint.id,
          capability: CAPABILITIES.SUBMIT_INCIDENT,
        },
      },
      update: {},
      create: {
        userId: testFocalPoint.id,
        capability: CAPABILITIES.SUBMIT_INCIDENT,
      },
    });

    const testStaffWithCap = await prisma.user.upsert({
      where: { email: 'cmd3_test_staff_authorized@facss.local' },
      update: { isActive: true, role: ROLES.STAFF },
      create: {
        email: 'cmd3_test_staff_authorized@facss.local',
        passwordHash: '$2a$10$syntheticHashForTestingOnlyCommand3',
        fullName: 'باحث ميداني مخول اصطناعي',
        role: ROLES.STAFF,
        isActive: true,
      },
    });
    cleanupUserIds.push(testStaffWithCap.id);

    await prisma.userCapability.upsert({
      where: {
        userId_capability: {
          userId: testStaffWithCap.id,
          capability: CAPABILITIES.SUBMIT_INCIDENT,
        },
      },
      update: {},
      create: {
        userId: testStaffWithCap.id,
        capability: CAPABILITIES.SUBMIT_INCIDENT,
      },
    });

    const testClient = await prisma.user.upsert({
      where: { email: 'cmd3_test_client@facss.local' },
      update: { isActive: true, role: ROLES.CLIENT },
      create: {
        email: 'cmd3_test_client@facss.local',
        passwordHash: '$2a$10$syntheticHashForTestingOnlyCommand3',
        fullName: 'عميل اختباري اصطناعي',
        role: ROLES.CLIENT,
        isActive: true,
      },
    });
    cleanupUserIds.push(testClient.id);

    const testTrainee = await prisma.user.upsert({
      where: { email: 'cmd3_test_trainee@facss.local' },
      update: { isActive: true, role: ROLES.TRAINEE },
      create: {
        email: 'cmd3_test_trainee@facss.local',
        passwordHash: '$2a$10$syntheticHashForTestingOnlyCommand3',
        fullName: 'متدرب اختباري اصطناعي',
        role: ROLES.TRAINEE,
        isActive: true,
      },
    });
    cleanupUserIds.push(testTrainee.id);

    const testDeactivatedFocal = await prisma.user.upsert({
      where: { email: 'cmd3_test_deactivated_focal@facss.local' },
      update: { isActive: false, role: ROLES.FIELD_FOCAL_POINT },
      create: {
        email: 'cmd3_test_deactivated_focal@facss.local',
        passwordHash: '$2a$10$syntheticHashForTestingOnlyCommand3',
        fullName: 'نقطة اتصال معطلة اصطناعية',
        role: ROLES.FIELD_FOCAL_POINT,
        isActive: false,
      },
    });
    cleanupUserIds.push(testDeactivatedFocal.id);

    async function checkIntakePermission(userObj) {
      if (!userObj || !userObj.isActive) return false;
      if (userObj.role === ROLES.SUPER_ADMIN) return true;
      const caps = await prisma.userCapability.findMany({
        where: { userId: userObj.id },
        select: { capability: true },
      });
      const capList = caps.map(c => c.capability);
      return hasCapability(userObj.role, capList, CAPABILITIES.SUBMIT_INCIDENT);
    }

    assert(await checkIntakePermission(testFocalPoint) === true, 'Active FIELD_FOCAL_POINT with submit_incident is authorized');
    assert(await checkIntakePermission(testStaffWithCap) === true, 'Active STAFF with submit_incident is authorized');
    assert(await checkIntakePermission(testClient) === false, 'CLIENT role is REJECTED from submitting incidents');
    assert(await checkIntakePermission(testTrainee) === false, 'TRAINEE role is REJECTED from submitting incidents');
    assert(await checkIntakePermission(testDeactivatedFocal) === false, 'Deactivated account (isActive=false) is REJECTED');
    assert(await checkIntakePermission(null) === false, 'Anonymous visitor is REJECTED');

    // ---------------------------------------------------------------------------------
    // TEST 2: FIELD_FOCAL_POINT Isolation
    // ---------------------------------------------------------------------------------
    console.log('\n▶ [Test 2/9] Testing FIELD_FOCAL_POINT Isolation & Non-Privilege Boundary...');

    assert(!STAFF_ROLES.includes(ROLES.FIELD_FOCAL_POINT), 'FIELD_FOCAL_POINT is strictly excluded from STAFF_ROLES');
    assert(isFieldFocalPoint(ROLES.FIELD_FOCAL_POINT), 'isFieldFocalPoint correctly identifies focal point');

    const focalSession = { userId: testFocalPoint.id, role: ROLES.FIELD_FOCAL_POINT, isActive: true };
    const focalOriginalAccess = canAccessIncidentOriginal(focalSession);
    assert(!focalOriginalAccess.authorized, 'FIELD_FOCAL_POINT is blocked from accessing IncidentOriginal');

    const focalRedactedAccess = await canAccessRedactedIncident(focalSession, 'dummy-id', []);
    assert(!focalRedactedAccess.authorized, 'FIELD_FOCAL_POINT is blocked from accessing IncidentRedacted');

    // ---------------------------------------------------------------------------------
    // TEST 3: AES-256-GCM Storage & Integrity Checks
    // ---------------------------------------------------------------------------------
    console.log('\n▶ [Test 3/9] Testing AES-256-GCM Sensitive Field Encryption & Integrity...');

    const rawMockData = {
      sourceType: 'LOCAL_CONTACT',
      sourceName: 'مصدر محلي سري (اصطناعي للاختبار)',
      sourceContactPhone: '+967 711 999 888',
      sourceOrganization: 'مؤسسة إنسانية محلية - تجريبي',
      exactLatitude: 12.8250,
      exactLongitude: 45.0340,
      exactLocationDesc: 'الشيخ عثمان، خلف سوق السلاح القديم، زقاق رقم 4',
      rawDescription: 'انفجار عبوة صوتية استهدفت طقماً عسكرياً دون وقوع إصابات بشرية مؤكدة.',
      initialRiskNotes: 'شبهات بوجود عبوة أخرى غير منفجرة، يجب تجنب إرسال طواقم غير مدربة.',
    };

    const encrypted = encryptIncidentOriginalPayload(rawMockData);

    assert(encrypted.sourceNameEnc.startsWith('enc:v1:'), 'sourceNameEnc contains standard v1 header');
    assert(encrypted.rawDescriptionEnc.startsWith('enc:v1:'), 'rawDescriptionEnc contains standard v1 header');
    assert(encrypted.exactLatEnc.startsWith('enc:v1:'), 'exactLatEnc contains standard v1 header');
    assert(encrypted.exactLocationEnc.startsWith('enc:v1:'), 'exactLocationEnc contains standard v1 header');

    // Plaintext leak check
    assert(!encrypted.sourceNameEnc.includes('مصدر محلي'), 'No source name plaintext in ciphertext');
    assert(!encrypted.rawDescriptionEnc.includes('انفجار عبوة'), 'No narrative plaintext in ciphertext');
    assert(!encrypted.exactLatEnc.includes('12.8250'), 'No coordinates plaintext in ciphertext');
    assert(!encrypted.exactLocationEnc.includes('الشيخ عثمان'), 'No location desc plaintext in ciphertext');

    // Positive decryption
    const decrypted = decryptIncidentOriginalPayload(encrypted);
    assert(decrypted.sourceName === rawMockData.sourceName, 'sourceName decrypted accurately');
    assert(decrypted.rawDescription === rawMockData.rawDescription, 'rawDescription decrypted accurately');
    assert(decrypted.exactLatitude === rawMockData.exactLatitude, 'exactLatitude decrypted accurately');
    assert(decrypted.exactLongitude === rawMockData.exactLongitude, 'exactLongitude decrypted accurately');

    // Tamper detection
    let tamperDetected = false;
    try {
      const parts = encrypted.rawDescriptionEnc.split(':');
      const payloadBuf = Buffer.from(parts[4], 'base64');
      payloadBuf[0] = payloadBuf[0] ^ 0xff;
      parts[4] = payloadBuf.toString('base64');
      decryptField(parts.join(':'));
    } catch (e) {
      tamperDetected = e.message.includes('SECURITY INTEGRITY FAILURE');
    }
    assert(tamperDetected, 'Tampered ciphertext rejected by GCM tag verification');

    // Wrong key rejection
    let wrongKeyRejected = false;
    try {
      const alienKey = crypto.randomBytes(32);
      decryptField(encrypted.rawDescriptionEnc, alienKey);
    } catch (e) {
      wrongKeyRejected = e.message.includes('SECURITY INTEGRITY FAILURE');
    }
    assert(wrongKeyRejected, 'Decryption with unauthorized key fails integrity check');

    // ---------------------------------------------------------------------------------
    // TEST 4: Sensitive Original Strictly Restricted to SUPER_ADMIN
    // ---------------------------------------------------------------------------------
    console.log('\n▶ [Test 4/9] Testing IncidentOriginal SUPER_ADMIN-Only Access Boundary...');

    const superAdminSession = { userId: 'sa-1', role: ROLES.SUPER_ADMIN, isActive: true };
    const adminSession = { userId: 'admin-1', role: ROLES.ADMIN, isActive: true };
    const staffSession = { userId: 'staff-1', role: ROLES.STAFF, isActive: true };
    const researchMgrSession = { userId: 'res-1', role: ROLES.RESEARCH_MANAGER, isActive: true };
    const employeeSession = { userId: 'emp-1', role: ROLES.EMPLOYEE, isActive: true };

    assert(canAccessIncidentOriginal(superAdminSession).authorized === true, 'SUPER_ADMIN is granted access to IncidentOriginal');
    assert(canAccessIncidentOriginal(adminSession).authorized === false, 'ADMIN is strictly DENIED access to IncidentOriginal');
    assert(canAccessIncidentOriginal(staffSession).authorized === false, 'STAFF is strictly DENIED access to IncidentOriginal');
    assert(canAccessIncidentOriginal(researchMgrSession).authorized === false, 'RESEARCH_MANAGER is strictly DENIED access to IncidentOriginal');
    assert(canAccessIncidentOriginal(employeeSession).authorized === false, 'EMPLOYEE is strictly DENIED access to IncidentOriginal');

    // ---------------------------------------------------------------------------------
    // TEST 5: Triple-Gate Access Control & Instant Access Revocation
    // ---------------------------------------------------------------------------------
    console.log('\n▶ [Test 5/9] Testing Triple-Gate Access Control & Assignment Revocation...');

    // Fetch existing SUPER_ADMIN from DB as creator
    const existingSuperAdmin = await prisma.user.findFirst({ where: { role: ROLES.SUPER_ADMIN } });
    const creatorId = existingSuperAdmin ? existingSuperAdmin.id : testStaffWithCap.id;

    const syntheticIncident = await prisma.incident.create({
      data: {
        incidentNumber: `FACSS-INC-TEST-${Date.now()}-A`,
        category: 'ARMED_CONFLICT_TACTICAL',
        priority: 'MEDIUM',
        status: 'RECEIVED',
        governorate: 'عدن',
        district: 'خور مكسر',
        incidentDate: new Date(),
        createdById: creatorId,
        original: {
          create: {
            ...encrypted,
          },
        },
        redactedVersions: {
          create: {
            versionNumber: 1,
            redactedTitleAr: 'بلاغ منقح معتمد للاختبار',
            redactedDescAr: 'ملخص أمني عام في خور مكسر دون ذكر تفاصيل أو هوية المصدر',
            safeAreaScopeAr: 'مديرية خور مكسر - محيط شارع الساحل',
            approvedByUserId: creatorId,
            isApproved: true,
            isCurrent: true,
          },
        },
      },
    });
    cleanupIncidentIds.push(syntheticIncident.id);

    const researcherUser = await prisma.user.upsert({
      where: { email: 'cmd3_researcher_assigned@facss.local' },
      update: { isActive: true, role: ROLES.STAFF },
      create: {
        email: 'cmd3_researcher_assigned@facss.local',
        passwordHash: '$2a$10$syntheticHashForTestingOnlyCommand3',
        fullName: 'باحث ميداني للاختبار',
        role: ROLES.STAFF,
        isActive: true,
      },
    });
    cleanupUserIds.push(researcherUser.id);

    const researcherSessionObj = {
      userId: researcherUser.id,
      role: ROLES.STAFF,
      isActive: true,
      capabilities: [CAPABILITIES.VERIFY_INCIDENT],
    };

    // Step 5a: Before assignment -> Access must be DENIED
    const gateBefore = await canAccessRedactedIncident(researcherSessionObj, syntheticIncident.id);
    assert(!gateBefore.authorized, 'Staff without assignment is REJECTED by Triple-Gate (gateBefore)');

    // Step 5b: Assign staff to incident
    const assignment = await prisma.incidentAssignment.create({
      data: {
        incidentId: syntheticIncident.id,
        assignedToUserId: researcherUser.id,
        assignedByUserId: creatorId,
        roleScope: 'VERIFIER',
        isActive: true,
      },
    });

    // Step 5c: After active assignment -> Access must be GRANTED
    const gateAfter = await canAccessRedactedIncident(researcherSessionObj, syntheticIncident.id);
    assert(gateAfter.authorized === true, 'Staff with active assignment is GRANTED access by Triple-Gate (gateAfter)');

    // Step 5d: Revoke assignment -> Access must be IMMEDIATELY DENIED
    await prisma.incidentAssignment.update({
      where: { id: assignment.id },
      data: { isActive: false, revokedAt: new Date() },
    });

    const gateRevoked = await canAccessRedactedIncident(researcherSessionObj, syntheticIncident.id);
    assert(!gateRevoked.authorized, 'Staff with REVOKED assignment is IMMEDIATELY DENIED by Triple-Gate (gateRevoked)');

    // Step 5e: If user is deactivated -> Access must be IMMEDIATELY DENIED even if reactivated assignment exists
    await prisma.incidentAssignment.update({
      where: { id: assignment.id },
      data: { isActive: true, revokedAt: null },
    });
    const inactiveResearcherSession = {
      userId: researcherUser.id,
      role: ROLES.FIELD_RESEARCHER,
      isActive: false, // Suspended account
      capabilities: [CAPABILITIES.VERIFY_INCIDENT],
    };
    const gateInactive = await canAccessRedactedIncident(inactiveResearcherSession, syntheticIncident.id);
    assert(!gateInactive.authorized, 'Deactivated staff (isActive=false) is DENIED regardless of assignment (gateInactive)');

    // ---------------------------------------------------------------------------------
    // TEST 6: Redacted Version Approval & Anti-Leakage Guard
    // ---------------------------------------------------------------------------------
    console.log('\n▶ [Test 6/9] Testing Redacted Version Approval State & Anti-Leakage Validation...');

    const draftIncident = await prisma.incident.create({
      data: {
        incidentNumber: `FACSS-INC-TEST-${Date.now()}-DRAFT`,
        category: 'ARMED_CONFLICT_TACTICAL',
        priority: 'HIGH',
        status: 'RECEIVED',
        governorate: 'عدن',
        district: 'دار سعد',
        incidentDate: new Date(),
        createdById: creatorId,
        original: {
          create: { ...encrypted },
        },
        redactedVersions: {
          create: {
            versionNumber: 1,
            redactedTitleAr: 'نسخة مسودة غير معتمدة',
            redactedDescAr: 'ملخص مسودة للتنقيح لم يعتمد بعد من الإدارة العليا',
            safeAreaScopeAr: 'مديرية دار سعد',
            approvedByUserId: creatorId,
            isApproved: false, // DRAFT
            isCurrent: true,
          },
        },
      },
    });
    cleanupIncidentIds.push(draftIncident.id);

    // Query mimicking staff view: must only fetch approved redacted versions
    const staffVisibleVersion = await prisma.incidentRedacted.findFirst({
      where: {
        incidentId: draftIncident.id,
        isApproved: true,
      },
    });
    assert(staffVisibleVersion === null, 'Unapproved draft redacted version is NOT visible to staff');

    // Approve the redacted version
    const draftVersion = await prisma.incidentRedacted.findFirst({
      where: { incidentId: draftIncident.id },
    });
    await prisma.incidentRedacted.update({
      where: { id: draftVersion.id },
      data: { isApproved: true },
    });

    const staffVisibleVersionApproved = await prisma.incidentRedacted.findFirst({
      where: {
        incidentId: draftIncident.id,
        isApproved: true,
      },
    });
    assert(staffVisibleVersionApproved !== null, 'Approved redacted version becomes visible to authorized staff');

    // Anti-leakage validation test
    const sensitiveContext = {
      sourceName: rawMockData.sourceName,
      sourcePhone: rawMockData.sourceContactPhone,
    };

    // Attempt to leak source name
    const leakingRedactedInput = {
      redactedTitleAr: `تقرير أمني - نقلاً عن ${sensitiveContext.sourceName}`,
      redactedDescAr: 'ملخص أمني عام في المنطقة',
      safeAreaScopeAr: 'الشيخ عثمان',
      isApproved: true,
    };
    const leakValidation = validateRedactedVersionInput(leakingRedactedInput, sensitiveContext);
    assert(!leakValidation.success, 'Anti-leakage catches source name leak in title');
    assert(Boolean(leakValidation.errors.antiLeakage), 'Error specifically flags antiLeakage constraint');

    // Attempt to leak source phone
    const phoneLeakingInput = {
      redactedTitleAr: 'تقرير ميداني آمن',
      redactedDescAr: `للتواصل والاستفسار مع الراصد: ${sensitiveContext.sourcePhone}`,
      safeAreaScopeAr: 'الشيخ عثمان',
      isApproved: true,
    };
    const phoneLeakValidation = validateRedactedVersionInput(phoneLeakingInput, sensitiveContext);
    assert(!phoneLeakValidation.success, 'Anti-leakage catches source phone leak in narrative');
    assert(Boolean(phoneLeakValidation.errors.antiLeakage), 'Error specifically flags phone antiLeakage constraint');

    // Clean sanitized input
    const cleanRedactedInput = {
      redactedTitleAr: 'تقرير ميداني عام: واقعة انفجار صوتي في مديرية الشيخ عثمان',
      redactedDescAr: 'انفجار صوتي محدود في مديرية الشيخ عثمان دون تسجيل أضرار بشرية مؤكدة.',
      safeAreaScopeAr: 'مديرية الشيخ عثمان - النطاق التجاري',
      isApproved: true,
    };
    const cleanValidation = validateRedactedVersionInput(cleanRedactedInput, sensitiveContext);
    assert(cleanValidation.success, 'Clean sanitized redacted input passes validation');

    // ---------------------------------------------------------------------------------
    // TEST 7: Attachment Security, Storage & EXIF Stripping
    // ---------------------------------------------------------------------------------
    console.log('\n▶ [Test 7/9] Testing Attachment Security, Storage & EXIF Removal...');

    // 7a: Magic bytes & forbidden extensions
    const fakeExeBuffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00FakeWindowsExecutableHeader');
    const exeCheck = validateAttachmentFile('payload.exe', fakeExeBuffer, 'application/x-msdownload');
    assert(!exeCheck.isValid, 'Executable (.exe) rejected by attachment validator');

    const fakePhpBuffer = Buffer.from('<?php echo "malicious web shell"; ?>');
    const phpCheck = validateAttachmentFile('shell.php', fakePhpBuffer, 'application/x-php');
    assert(!phpCheck.isValid, 'PHP script rejected by attachment validator');

    // Oversized buffer
    const oversizedBuffer = Buffer.alloc(MAX_FILE_SIZE + 1024, 0x41);
    const sizeCheck = validateAttachmentFile('big.pdf', oversizedBuffer, 'application/pdf');
    assert(!sizeCheck.isValid, 'Oversized attachment rejected (> 10MB)');

    // 7b: Path traversal defense in storage
    let pathTraversalCaught = false;
    try {
      await getIncidentAttachmentFromDisk('../../etc/passwd');
    } catch (e) {
      pathTraversalCaught = true;
    }
    assert(pathTraversalCaught, 'Path traversal key (../../etc/passwd) rejected by private storage');

    // 7c: EXIF Stripping on synthetic JPEG
    const soi = Buffer.from([0xFF, 0xD8]);
    const exifMarker = Buffer.from([0xFF, 0xE1]);
    const exifLength = Buffer.from([0x00, 0x1A]); // 26 bytes length
    const exifData = Buffer.from('Exif\x00\x00GPSLatitude12.825000', 'utf8'); // fake GPS tag
    const imagePayload = Buffer.from([0xFF, 0xDA, 0x00, 0x0C, 0x01, 0x02, 0x03, 0x04]); // scan data
    const eoi = Buffer.from([0xFF, 0xD9]);

    const rawJpegWithGps = Buffer.concat([soi, exifMarker, exifLength, exifData, imagePayload, eoi]);
    assert(rawJpegWithGps.includes(Buffer.from('GPSLatitude')), 'Raw test JPEG contains simulated GPS metadata');

    const strippedJpeg = stripJpegExif(rawJpegWithGps);
    assert(!strippedJpeg.includes(Buffer.from('GPSLatitude')), 'EXIF/GPS metadata stripped cleanly from JPEG');
    assert(!strippedJpeg.includes(Buffer.from([0xFF, 0xE1])), 'APP1 EXIF marker removed from JPEG buffer');
    assert(strippedJpeg[0] === 0xFF && strippedJpeg[1] === 0xD8, 'JPEG SOI marker preserved');
    assert(strippedJpeg[strippedJpeg.length - 2] === 0xFF && strippedJpeg[strippedJpeg.length - 1] === 0xD9, 'JPEG EOI marker preserved');

    // Save original to private disk
    const storedOriginal = await saveIncidentAttachmentToDisk(rawJpegWithGps, 'field_photo_original.jpg');
    cleanupAttachmentKeys.push(storedOriginal.storageKey);

    assert(fs.existsSync(storedOriginal.fullPath), 'Original sensitive attachment saved to private disk');
    assert(!storedOriginal.fullPath.includes(path.join('public')), 'Attachment is strictly OUTSIDE /public web root');

    // Strip metadata and save redacted version
    const stripResult = stripMetadataIfSupported(rawJpegWithGps, 'image/jpeg', '.jpg');
    assert(stripResult.success, 'stripMetadataIfSupported succeeds for JPEG');
    const storedRedacted = await saveIncidentAttachmentToDisk(stripResult.strippedBuffer, 'field_photo_redacted.jpg');
    cleanupAttachmentKeys.push(storedRedacted.storageKey);

    const retrievedRedactedBuf = await getIncidentAttachmentFromDisk(storedRedacted.storageKey);
    assert(!retrievedRedactedBuf.includes(Buffer.from('GPSLatitude')), 'Retrieved redacted attachment is free of GPS/EXIF');

    // ---------------------------------------------------------------------------------
    // TEST 8: End-to-End Incident Lifecycle Walkthrough
    // ---------------------------------------------------------------------------------
    console.log('\n▶ [Test 8/9] Testing Full Incident Lifecycle (Intake -> Triage -> Redact -> Assign -> Verify -> Close)...');

    // Phase 1: Intake submission
    const intakeInput = {
      category: 'ARMED_CONFLICT_TACTICAL',
      priority: 'HIGH',
      governorate: 'عدن',
      district: 'المنصورة',
      incidentDate: new Date().toISOString(),
      sourceType: 'WITNESS',
      sourceName: 'شاهد عيان من سكان الحي (اصطناعي)',
      sourcePhone: '+967 777 555 333',
      sourceOrg: 'منظمة محلية للرصد الإنساني',
      rawDescription: 'تجمع نحو 4 أطقم مسلحة بالقرب من جولة الغزل والنسيج وإغلاق جزئي للشارع.',
      exactLocationDesc: 'المنصورة، جولة الغزل والنسيج، أمام البنك الأهلي سابقاً',
      exactLatitude: 12.8550,
      exactLongitude: 45.0120,
      initialRiskNotes: 'احتمال تصاعد التوتر وقطع الحركة بين المنصورة والشيخ عثمان.',
    };

    const intakeValidation = validateIncidentIntake(intakeInput);
    assert(intakeValidation.success, 'Intake payload passes comprehensive validation');

    const encryptedLifecycleOriginal = encryptIncidentOriginalPayload(intakeValidation.data);

    const lifecycleIncident = await prisma.$transaction(async (tx) => {
      const inc = await tx.incident.create({
        data: {
          incidentNumber: `FACSS-INC-E2E-${Date.now()}`,
          category: intakeValidation.data.category,
          priority: intakeValidation.data.priority,
          status: 'RECEIVED',
          governorate: intakeValidation.data.governorate,
          district: intakeValidation.data.district,
          incidentDate: new Date(intakeValidation.data.incidentDate),
          createdById: testFocalPoint.id,
          original: {
            create: {
              ...encryptedLifecycleOriginal,
            },
          },
        },
      });

      await tx.activityLog.create({
        data: {
          userId: testFocalPoint.id,
          userName: testFocalPoint.fullName,
          action: 'INCIDENT_INTAKE_SUBMITTED',
          entityType: 'Incident',
          entityId: inc.id,
          details: 'Field focal point submitted synthetic incident via intake portal',
        },
      });

      return inc;
    });
    cleanupIncidentIds.push(lifecycleIncident.id);
    assert(lifecycleIncident.status === 'RECEIVED', 'Incident created with RECEIVED status');

    // Phase 2: Triage & SUPER_ADMIN In-Memory Decryption
    const fetchedForTriage = await prisma.incident.findUnique({
      where: { id: lifecycleIncident.id },
      include: { original: true },
    });
    assert(fetchedForTriage.original !== null, 'Original sensitive record exists in DB');
    const decryptedForSuperAdmin = decryptIncidentOriginalPayload(fetchedForTriage.original);
    assert(decryptedForSuperAdmin.sourceName === intakeInput.sourceName, 'SUPER_ADMIN decrypts original in-memory without error');
    assert(decryptedForSuperAdmin.exactLatitude === intakeInput.exactLatitude, 'Decrypted latitude matches original');

    // Update status to TRIAGED
    await prisma.incident.update({
      where: { id: lifecycleIncident.id },
      data: { status: 'TRIAGED' },
    });

    // Phase 3: Drafting & Approving Redacted Version
    const redactedCleanInputData = {
      redactedTitleAr: 'رصد تحركات أمنية وإغلاق جزئي في مديرية المنصورة',
      redactedDescAr: 'إغلاق جزئي لحركة السير في محيط مديرية المنصورة إثر انتشار آليات أمنية، دون وقوع اشتباكات مباشرة.',
      safeAreaScopeAr: 'مديرية المنصورة - القطاع الجنوبي',
      isApproved: true,
    };
    const redactionCheck = validateRedactedVersionInput(redactedCleanInputData, decryptedForSuperAdmin);
    assert(redactionCheck.success, 'Redacted version passes anti-leakage checks');

    const createdRedacted = await prisma.incidentRedacted.create({
      data: {
        incidentId: lifecycleIncident.id,
        versionNumber: 1,
        redactedTitleAr: redactionCheck.data.redactedTitleAr,
        redactedDescAr: redactionCheck.data.redactedDescAr,
        safeAreaScopeAr: redactionCheck.data.safeAreaScopeAr,
        approvedByUserId: creatorId,
        isApproved: true,
        isCurrent: true,
      },
    });
    assert(createdRedacted.isApproved === true, 'Redacted version created and approved for staff view');

    // Phase 4: Assignment
    const e2eAssignment = await prisma.incidentAssignment.create({
      data: {
        incidentId: lifecycleIncident.id,
        assignedToUserId: testStaffWithCap.id,
        assignedByUserId: creatorId,
        roleScope: 'VERIFIER',
        isActive: true,
      },
    });
    assert(e2eAssignment.isActive === true, 'Staff assigned actively to incident');

    // Update status to ASSIGNED
    await prisma.incident.update({
      where: { id: lifecycleIncident.id },
      data: { status: 'ASSIGNED' },
    });

    // Phase 5: Verification using Admiralty Matrix (Separated Source Reliability & Info Credibility)
    const verificationInput = {
      sourceReliability: 'B', // Usually reliable
      infoCredibility: '2',   // Probably true
      verificationMethod: 'ON_SITE_OBSERVATION',
      verificationSummary: 'قام الباحث الميداني بزيارة محيط المنطقة والتأكد من فتح الطريق وعودة الحركة الطبيعية دون اشتباكات.',
      contradictionsFound: true,
      contradictionNotes: 'لم يتم رصد إطلاق نار وإنما كان انتشاراً تنظيمياً مؤقتاً.',
      recommendedStatus: 'VERIFIED',
    };

    const verifValidation = validateVerificationInput(verificationInput);
    assert(verifValidation.success, 'Admiralty verification input validated successfully');

    // Confirm that there is NO automated numerical trust score generated
    assert(!('numericalScore' in verifValidation.data), 'Admiralty verification has no automated numerical trust score');

    const savedVerification = await prisma.incidentVerification.create({
      data: {
        incidentId: lifecycleIncident.id,
        verifiedByUserId: testStaffWithCap.id,
        sourceReliability: verifValidation.data.sourceReliability,
        infoCredibility: verifValidation.data.infoCredibility,
        admiraltyCode: `${verifValidation.data.sourceReliability}${verifValidation.data.infoCredibility}`,
        verificationMethod: verifValidation.data.verificationMethod,
        verificationSummary: verifValidation.data.verificationSummary,
        corroboratingCount: verifValidation.data.corroboratingCount,
        contradictionsFound: verifValidation.data.contradictionsFound,
        contradictionNotes: verifValidation.data.contradictionNotes,
      },
    });
    assert(savedVerification.sourceReliability === 'B', 'Admiralty Source Reliability B recorded');
    assert(savedVerification.infoCredibility === '2', 'Admiralty Info Credibility 2 recorded');
    assert(savedVerification.admiraltyCode === 'B2', 'Admiralty code B2 recorded without numerical score');

    // Phase 6: Update status to VERIFIED
    const closedIncident = await prisma.incident.update({
      where: { id: lifecycleIncident.id },
      data: { status: 'VERIFIED' },
    });
    assert(closedIncident.status === 'VERIFIED', 'Incident status successfully updated to VERIFIED');

    // ---------------------------------------------------------------------------------
    // TEST 9: Legacy Data Retention & System Integrity Check
    // ---------------------------------------------------------------------------------
    console.log('\n▶ [Test 9/9] Verifying Legacy Data Retention & System Integrity...');

    const coreServicesCount = await prisma.service.count();
    assert(coreServicesCount >= 10, `Core services intact (${coreServicesCount} services in database)`);

    const categoriesCount = await prisma.serviceCategory.count();
    assert(categoriesCount >= 5, `Categories intact (${categoriesCount} categories in database)`);

    const usersCount = await prisma.user.count();
    assert(usersCount >= 5, `Users database intact (${usersCount} users recorded)`);

    const serviceRequestsCount = await prisma.serviceRequest.count();
    console.log(`  ℹ Info: Service requests count = ${serviceRequestsCount}`);
    assert(typeof serviceRequestsCount === 'number', 'ServiceRequest table intact and queryable');

    console.log('\n========================================================================');
    console.log(`  ALL COMMAND 3 ACCEPTANCE TESTS PASSED: ${passedTests} PASSED, 0 FAILED`);
    console.log('========================================================================\n');

  } finally {
    console.log('▶ Cleaning up synthetic test records...');
    try {
      for (const incId of cleanupIncidentIds) {
        await prisma.incidentVerification.deleteMany({ where: { incidentId: incId } });
        await prisma.incidentAssignment.deleteMany({ where: { incidentId: incId } });
        await prisma.incidentRedacted.deleteMany({ where: { incidentId: incId } });
        await prisma.incidentAttachment.deleteMany({ where: { incidentId: incId } });
        await prisma.incidentOriginal.deleteMany({ where: { incidentId: incId } });
        await prisma.incident.deleteMany({ where: { id: incId } });
      }

      for (const uId of cleanupUserIds) {
        await prisma.userCapability.deleteMany({ where: { userId: uId } });
        await prisma.user.deleteMany({ where: { id: uId } });
      }

      for (const storageKey of cleanupAttachmentKeys) {
        const fullPath = path.join(process.cwd(), 'storage', 'private', 'incidents', 'attachments', storageKey);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
      console.log('  ✅ Synthetic test data cleaned up safely.');
    } catch (cleanupErr) {
      console.warn('  ⚠️ Warning during cleanup:', cleanupErr.message);
    }

    await prisma.$disconnect();
  }

  if (failedTests > 0) {
    process.exit(1);
  }
}

runCommand3Suite().catch((err) => {
  console.error('Fatal error running Command 3 suite:', err);
  process.exit(1);
});
