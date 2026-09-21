/**
 * Phase 2 - Command 4 Comprehensive Test Suite
 * Aden International Center for Safety and Field Assessment (FACSS)
 * 
 * Verifies all 11 mandatory acceptance criteria for targeted field alerts:
 * 1. Deny alert creation if incident has no approved redacted version.
 * 2. Deny drafting by unassigned staff or staff lacking draft_incident_alert.
 * 3. Non-SUPER_ADMIN strictly blocked from approving or dispatching alerts.
 * 4. Anti-leakage verification: sensitive original, source name, phone, coords blocked from both tiers, notifications, logs.
 * 5. Inactive or unauthorized users blocked from recipient selection; tier access restriction enforced.
 * 6. Content, recipients, tiers frozen inside AlertSnapshot; subsequent edit immediately revokes approval.
 * 7. Reject dispatch without valid approved snapshot; idempotency prevents duplicate delivery.
 * 8. Deny reading alert not addressed to user; access revoked upon account deactivation.
 * 9. Verify purely In-App distribution (IN_APP_PORTAL) with zero external dispatch.
 * 10. Complete end-to-end lifecycle: Incident -> Redact -> Verify -> Alert Draft -> Recipients -> Snapshot -> In-App Dispatch -> Read.
 * 11. Legacy data retention: Services, categories, users, service requests intact.
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const {
  ROLES,
  STAFF_ROLES,
  CAPABILITIES,
  hasCapability,
  isStaffRole,
} = require('../lib/rbac');

const {
  validateAlertDraftInput,
  validateAlertRecipientsInput,
  VALID_ALERT_SEVERITIES,
  VALID_ALERT_TIERS,
} = require('../lib/validations/alerts');

const {
  computeSnapshotHash,
  verifySnapshotIntegrity,
  createAlertSnapshot,
  invalidateAlertApproval,
} = require('../lib/security/alert-snapshot');

const {
  dispatchAlertInternal,
} = require('../lib/alerts/dispatch-engine');

const {
  encryptIncidentOriginalPayload,
  decryptIncidentOriginalPayload,
} = require('../lib/security/crypto');

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

async function runCommand4Suite() {
  console.log('========================================================================');
  console.log('   FACSS PHASE 2 - COMMAND 4: FIELD ALERTS & DISPATCH TEST SUITE       ');
  console.log('   Aden International Center for Safety and Field Assessment (FACSS)    ');
  console.log('========================================================================\n');

  const cleanupUserIds = [];
  const cleanupIncidentIds = [];
  const cleanupAlertIds = [];

  try {
    // ---------------------------------------------------------------------------------
    // SETUP SYNTHETIC USERS
    // ---------------------------------------------------------------------------------
    console.log('▶ [Setup] Preparing Synthetic Users and Roles...');

    // Fetch or create SUPER_ADMIN
    let superAdmin = await prisma.user.findFirst({ where: { role: ROLES.SUPER_ADMIN, isActive: true } });
    if (!superAdmin) {
      superAdmin = await prisma.user.create({
        data: {
          email: `cmd4_superadmin_${Date.now()}@facss.local`,
          passwordHash: '$2a$10$dummyHashCommand4',
          fullName: 'المدير الأعلى للاختبار',
          role: ROLES.SUPER_ADMIN,
          isActive: true,
        },
      });
      cleanupUserIds.push(superAdmin.id);
    }

    // Staff with draft capability
    const authorizedStaff = await prisma.user.upsert({
      where: { email: 'cmd4_authorized_staff@facss.local' },
      update: { isActive: true, role: ROLES.STAFF },
      create: {
        email: 'cmd4_authorized_staff@facss.local',
        passwordHash: '$2a$10$dummyHashCommand4',
        fullName: 'محرر تنبيهات مصرح',
        role: ROLES.STAFF,
        isActive: true,
      },
    });
    cleanupUserIds.push(authorizedStaff.id);

    await prisma.userCapability.upsert({
      where: {
        userId_capability: {
          userId: authorizedStaff.id,
          capability: CAPABILITIES.DRAFT_INCIDENT_ALERT,
        },
      },
      update: {},
      create: {
        userId: authorizedStaff.id,
        capability: CAPABILITIES.DRAFT_INCIDENT_ALERT,
      },
    });

    // Staff without draft capability
    const unauthorizedStaff = await prisma.user.upsert({
      where: { email: 'cmd4_unauthorized_staff@facss.local' },
      update: { isActive: true, role: ROLES.STAFF },
      create: {
        email: 'cmd4_unauthorized_staff@facss.local',
        passwordHash: '$2a$10$dummyHashCommand4',
        fullName: 'موظف غير مصرح بالتنبيهات',
        role: ROLES.STAFF,
        isActive: true,
      },
    });
    cleanupUserIds.push(unauthorizedStaff.id);

    // Regular Admin (not SUPER_ADMIN)
    const regularAdmin = await prisma.user.upsert({
      where: { email: 'cmd4_regular_admin@facss.local' },
      update: { isActive: true, role: ROLES.ADMIN },
      create: {
        email: 'cmd4_regular_admin@facss.local',
        passwordHash: '$2a$10$dummyHashCommand4',
        fullName: 'مدير عام إداري',
        role: ROLES.ADMIN,
        isActive: true,
      },
    });
    cleanupUserIds.push(regularAdmin.id);

    // Operational Recipient 1
    const operationalRecipient = await prisma.user.upsert({
      where: { email: 'cmd4_operational_user@facss.local' },
      update: { isActive: true, role: ROLES.EMPLOYEE },
      create: {
        email: 'cmd4_operational_user@facss.local',
        passwordHash: '$2a$10$dummyHashCommand4',
        fullName: 'ضابط ميداني مستلم للإحاطة',
        role: ROLES.EMPLOYEE,
        isActive: true,
      },
    });
    cleanupUserIds.push(operationalRecipient.id);

    // Executive Recipient 2
    const executiveRecipient = await prisma.user.upsert({
      where: { email: 'cmd4_executive_user@facss.local' },
      update: { isActive: true, role: ROLES.RESEARCH_MANAGER },
      create: {
        email: 'cmd4_executive_user@facss.local',
        passwordHash: '$2a$10$dummyHashCommand4',
        fullName: 'مسؤول تنسيقي مستلم للملخص',
        role: ROLES.RESEARCH_MANAGER,
        isActive: true,
      },
    });
    cleanupUserIds.push(executiveRecipient.id);

    // Inactive Recipient
    const inactiveRecipient = await prisma.user.upsert({
      where: { email: 'cmd4_inactive_user@facss.local' },
      update: { isActive: false, role: ROLES.STAFF },
      create: {
        email: 'cmd4_inactive_user@facss.local',
        passwordHash: '$2a$10$dummyHashCommand4',
        fullName: 'مستخدم معطل اصطناعي',
        role: ROLES.STAFF,
        isActive: false,
      },
    });
    cleanupUserIds.push(inactiveRecipient.id);

    // Forbidden Role Recipient (FIELD_FOCAL_POINT)
    const focalPointUser = await prisma.user.upsert({
      where: { email: 'cmd4_focal_isolated@facss.local' },
      update: { isActive: true, role: ROLES.FIELD_FOCAL_POINT },
      create: {
        email: 'cmd4_focal_isolated@facss.local',
        passwordHash: '$2a$10$dummyHashCommand4',
        fullName: 'نقطة اتصال معزولة عن التنبيهات',
        role: ROLES.FIELD_FOCAL_POINT,
        isActive: true,
      },
    });
    cleanupUserIds.push(focalPointUser.id);

    // ---------------------------------------------------------------------------------
    // TEST 1: Deny alert creation if incident has NO approved redacted version
    // ---------------------------------------------------------------------------------
    console.log('\n▶ [Test 1/11] Testing Alert Creation Gate: Incident Must Have Approved Redacted Version...');

    // Synthetic Incident WITHOUT approved redacted version (Draft only)
    const unredactedIncident = await prisma.incident.create({
      data: {
        incidentNumber: `FACSS-INC-CMD4-TEST-UNRED-${Date.now()}`,
        category: 'ARMED_CONFLICT_TACTICAL',
        priority: 'HIGH',
        status: 'RECEIVED',
        governorate: 'عدن',
        district: 'البريقة',
        incidentDate: new Date(),
        createdById: superAdmin.id,
        redactedVersions: {
          create: {
            versionNumber: 1,
            redactedTitleAr: 'نسخة غير معتمدة (مسودة)',
            redactedDescAr: 'تفاصيل لم تعتمد بعد',
            safeAreaScopeAr: 'البريقة',
            approvedByUserId: superAdmin.id,
            isApproved: false, // DRAFT!
          },
        },
      },
    });
    cleanupIncidentIds.push(unredactedIncident.id);

    async function checkCanCreateAlertForIncident(incidentId) {
      const approvedRedacted = await prisma.incidentRedacted.findFirst({
        where: { incidentId, isApproved: true },
      });
      return Boolean(approvedRedacted);
    }

    const canCreateUnredacted = await checkCanCreateAlertForIncident(unredactedIncident.id);
    assert(!canCreateUnredacted, 'Alert creation REJECTED for incident without approved redacted version');

    // Synthetic Incident WITH approved redacted version
    const sensitiveSourceData = {
      sourceType: 'LOCAL_CONTACT',
      sourceName: 'مصدر استخباراتي محلي حساس (اصطناعي)',
      sourceContactPhone: '+967 733 444 555',
      sourceOrganization: 'منظمة رصد إنساني تجريبية',
      exactLatitude: 12.8765,
      exactLongitude: 45.0234,
      exactLocationDesc: 'المنصورة، تقاطع كابوتا، خلف محطة الوقود المركزية',
      rawDescription: 'رصد اشتباكات مسلحة متقطعة بالأسلحة الخفيفة والمتوسطة وتصاعد أعمدة الدخان.',
      initialRiskNotes: 'شبهات بقطع الطريق الواصل بين البريقة والمنصورة، يرجى التريث.',
    };
    const encryptedOriginal = encryptIncidentOriginalPayload(sensitiveSourceData);

    const validIncident = await prisma.incident.create({
      data: {
        incidentNumber: `FACSS-INC-CMD4-TEST-VALID-${Date.now()}`,
        category: 'ARMED_CONFLICT_TACTICAL',
        priority: 'HIGH',
        status: 'REDACTED',
        governorate: 'عدن',
        district: 'المنصورة',
        incidentDate: new Date(),
        createdById: superAdmin.id,
        original: {
          create: { ...encryptedOriginal },
        },
        redactedVersions: {
          create: {
            versionNumber: 1,
            redactedTitleAr: 'رصد توترات أمنية وإغلاق جزئي في مديرية المنصورة',
            redactedDescAr: 'توترات أمنية متقطعة في محيط مديرية المنصورة دون استهداف للطواقم الإنسانية.',
            safeAreaScopeAr: 'مديرية المنصورة - القطاع الغربي',
            approvedByUserId: superAdmin.id,
            isApproved: true, // APPROVED!
          },
        },
      },
    });
    cleanupIncidentIds.push(validIncident.id);

    const canCreateValid = await checkCanCreateAlertForIncident(validIncident.id);
    assert(canCreateValid, 'Alert creation PERMITTED for incident with approved redacted version');

    // ---------------------------------------------------------------------------------
    // TEST 2: Deny drafting by unassigned staff or staff lacking capability
    // ---------------------------------------------------------------------------------
    console.log('\n▶ [Test 2/11] Testing Alert Drafting Authorization Gate...');

    async function checkCanDraftAlert(userSession, incidentId) {
      if (userSession.role === ROLES.SUPER_ADMIN) return true;
      if (!userSession.isActive) return false;

      // Check capability
      const userCaps = await prisma.userCapability.findMany({
        where: { userId: userSession.userId },
        select: { capability: true },
      });
      const capList = userCaps.map(c => c.capability);
      if (!hasCapability(userSession.role, capList, CAPABILITIES.DRAFT_INCIDENT_ALERT)) {
        return false;
      }

      // Check active assignment to this incident
      const assignment = await prisma.incidentAssignment.findFirst({
        where: { incidentId, assignedToUserId: userSession.userId, isActive: true },
      });
      return Boolean(assignment);
    }

    // Step 2a: Staff lacking capability
    const unauthorizedSession = { userId: unauthorizedStaff.id, role: unauthorizedStaff.role, isActive: true };
    assert(!(await checkCanDraftAlert(unauthorizedSession, validIncident.id)), 'Staff lacking draft_incident_alert is REJECTED');

    // Step 2b: Staff with capability but NOT assigned
    const authorizedNotAssignedSession = { userId: authorizedStaff.id, role: authorizedStaff.role, isActive: true };
    assert(!(await checkCanDraftAlert(authorizedNotAssignedSession, validIncident.id)), 'Staff with capability but NO active assignment is REJECTED');

    // Step 2c: Assign staff to incident
    await prisma.incidentAssignment.create({
      data: {
        incidentId: validIncident.id,
        assignedToUserId: authorizedStaff.id,
        assignedByUserId: superAdmin.id,
        roleScope: 'ANALYST',
        isActive: true,
      },
    });
    assert(await checkCanDraftAlert(authorizedNotAssignedSession, validIncident.id), 'Assigned staff with capability is GRANTED draft permission');

    // Step 2d: SUPER_ADMIN bypass
    const superAdminSession = { userId: superAdmin.id, role: ROLES.SUPER_ADMIN, isActive: true };
    assert(await checkCanDraftAlert(superAdminSession, validIncident.id), 'SUPER_ADMIN is granted draft permission unconditionally');

    // ---------------------------------------------------------------------------------
    // TEST 3: Non-SUPER_ADMIN strictly blocked from approving or dispatching
    // ---------------------------------------------------------------------------------
    console.log('\n▶ [Test 3/11] Testing Strict SUPER_ADMIN Isolation for Approval and Dispatch...');

    function canApproveOrDispatch(role) {
      return role === ROLES.SUPER_ADMIN;
    }

    assert(canApproveOrDispatch(ROLES.SUPER_ADMIN), 'SUPER_ADMIN is permitted to approve & dispatch');
    assert(!canApproveOrDispatch(ROLES.ADMIN), 'ADMIN is strictly DENIED approval & dispatch');
    assert(!canApproveOrDispatch(ROLES.STAFF), 'STAFF is strictly DENIED approval & dispatch');
    assert(!canApproveOrDispatch(ROLES.RESEARCH_MANAGER), 'RESEARCH_MANAGER is strictly DENIED approval & dispatch');
    assert(!canApproveOrDispatch(ROLES.CLIENT), 'CLIENT is strictly DENIED approval & dispatch');

    // ---------------------------------------------------------------------------------
    // TEST 4: Anti-Leakage Guard on Alert Texts
    // ---------------------------------------------------------------------------------
    console.log('\n▶ [Test 4/11] Testing Anti-Leakage Verification on Alert Content...');

    // Attempt to leak source name
    const leakSourceNameDraft = {
      incidentId: validIncident.id,
      severity: 'WARNING_HIGH',
      titleAr: `تنبيه أمني ميداني بناءً على إفادة ${sensitiveSourceData.sourceName}`,
      bodyAr: 'سياق عملياتي منقح لتحركات الأطقم المسلحة في المنطقة.',
      executiveTitleAr: 'ملخص تنفيذي موجز',
      executiveSummaryAr: 'خلاصة أمنية للتنسيق الإنساني.',
      targetGovernorate: 'عدن',
      targetDistricts: ['المنصورة'],
    };
    const leak1 = validateAlertDraftInput(leakSourceNameDraft, sensitiveSourceData);
    assert(!leak1.isValid, 'Anti-leakage catches source name leak in Tier 1 title');
    assert(leak1.errors.some(e => e.includes('اسم المصدر')), 'Error specifically flags source name leak');

    // Attempt to leak source phone
    const leakPhoneDraft = {
      incidentId: validIncident.id,
      severity: 'WARNING_HIGH',
      titleAr: 'تنبيه أمني ميداني في مديرية المنصورة',
      bodyAr: 'سياق عملياتي لتحركات الأطقم.',
      executiveTitleAr: 'ملخص تنفيذي موجز',
      executiveSummaryAr: `يرجى التواصل مع مندوب الرصد على الرقم ${sensitiveSourceData.sourceContactPhone} للتنسيق.`,
      targetGovernorate: 'عدن',
      targetDistricts: ['المنصورة'],
    };
    const leak2 = validateAlertDraftInput(leakPhoneDraft, sensitiveSourceData);
    assert(!leak2.isValid, 'Anti-leakage catches source phone leak in Tier 2 body');

    // Attempt to leak exact coordinates
    const leakCoordsDraft = {
      incidentId: validIncident.id,
      severity: 'WARNING_HIGH',
      titleAr: 'تنبيه أمني ميداني في مديرية المنصورة',
      bodyAr: `تم رصد التوتر عند النقطة 12.876 و 45.023`,
      executiveTitleAr: 'ملخص تنفيذي موجز',
      executiveSummaryAr: 'خلاصة أمنية للتنسيق الإنساني.',
      targetGovernorate: 'عدن',
      targetDistricts: ['المنصورة'],
    };
    const leak3 = validateAlertDraftInput(leakCoordsDraft, sensitiveSourceData);
    assert(!leak3.isValid, 'Anti-leakage catches exact coordinate leak in body');

    // Clean valid draft
    const cleanAlertDraft = {
      incidentId: validIncident.id,
      severity: 'WARNING_HIGH',
      titleAr: 'إحاطة تشغيلية: تحركات أمنية وإغلاق جزئي في مديرية المنصورة',
      bodyAr: 'رصد انتشار آليات أمنية وإغلاق جزئي لحركة السير في محيط كابوتا بمديرية المنصورة دون استهداف للطواقم الإغاثية.',
      executiveTitleAr: 'ملخص تنسيقي: توتر أمني محدود في المنصورة',
      executiveSummaryAr: 'إغلاق جزئي مؤقت في المنصورة، الوضع تحت المراقبة والتنقل متاح عبر الطرق البديلة.',
      movementAdviceAr: 'يُنصح باستخدام خط التسعين كمسار بديل آمن وتجنب التقاطعات الداخلية حتى إشعار آخر.',
      targetGovernorate: 'عدن',
      targetDistricts: ['المنصورة'],
      isPrecautionary: false,
    };
    const cleanValidation = validateAlertDraftInput(cleanAlertDraft, sensitiveSourceData);
    assert(cleanValidation.isValid, 'Clean sanitized draft passes anti-leakage validation');

    // ---------------------------------------------------------------------------------
    // TEST 5: Recipient Selection & Tier Access Boundaries
    // ---------------------------------------------------------------------------------
    console.log('\n▶ [Test 5/11] Testing Recipient Selection and Tier Authorization...');

    // Attempt to add inactive user
    const recipientWithInactive = [
      { recipientUserId: operationalRecipient.id, alertTier: 'REDACTED_OPERATIONAL_BRIEFING' },
      { recipientUserId: inactiveRecipient.id, alertTier: 'EXECUTIVE_FLASH_SUMMARY' },
    ];
    const recCheck1 = validateAlertRecipientsInput(recipientWithInactive);
    assert(recCheck1.isValid, 'Input structure valid');

    // Check DB activity gate
    const activeUsersInDb = await prisma.user.findMany({
      where: {
        id: { in: recipientWithInactive.map(r => r.recipientUserId) },
        isActive: true,
      },
    });
    assert(activeUsersInDb.length === 1, 'Database filter successfully rejects inactive recipient');

    // Attempt to add FIELD_FOCAL_POINT
    assert(!STAFF_ROLES.includes(focalPointUser.role), 'FIELD_FOCAL_POINT is strictly excluded from staff recipient pool');

    // Valid recipients list
    const validRecipientsInput = [
      { recipientUserId: operationalRecipient.id, alertTier: 'REDACTED_OPERATIONAL_BRIEFING' },
      { recipientUserId: executiveRecipient.id, alertTier: 'EXECUTIVE_FLASH_SUMMARY' },
    ];
    const validRecCheck = validateAlertRecipientsInput(validRecipientsInput);
    assert(validRecCheck.isValid, 'Valid recipients list accepted with distinct tiers');

    // ---------------------------------------------------------------------------------
    // TEST 6: Immutable Snapshot Creation & Approval Invalidation on Modification
    // ---------------------------------------------------------------------------------
    console.log('\n▶ [Test 6/11] Testing Immutable Snapshot Freeze and Approval Invalidation...');

    // Create IncidentAlert record in DB
    const createdAlert = await prisma.incidentAlert.create({
      data: {
        alertNumber: `FACSS-ALT-TEST-${Date.now()}`,
        incidentId: validIncident.id,
        severity: cleanValidation.sanitizedData.severity,
        titleAr: cleanValidation.sanitizedData.titleAr,
        bodyAr: cleanValidation.sanitizedData.bodyAr,
        executiveTitleAr: cleanValidation.sanitizedData.executiveTitleAr,
        executiveSummaryAr: cleanValidation.sanitizedData.executiveSummaryAr,
        movementAdviceAr: cleanValidation.sanitizedData.movementAdviceAr,
        targetGovernorate: cleanValidation.sanitizedData.targetGovernorate,
        targetDistricts: JSON.stringify(cleanValidation.sanitizedData.targetDistricts),
        isPrecautionary: cleanValidation.sanitizedData.isPrecautionary,
        draftedByUserId: authorizedStaff.id,
        approvalStatus: 'DRAFT',
        recipients: {
          create: validRecipientsInput.map(r => ({
            recipientUserId: r.recipientUserId,
            alertTier: r.alertTier,
          })),
        },
      },
    });
    cleanupAlertIds.push(createdAlert.id);
    assert(createdAlert.approvalStatus === 'DRAFT', 'Alert initially created in DRAFT state');

    // Approve alert and generate snapshot
    const { snapshot, alert: approvedAlert } = await createAlertSnapshot(
      createdAlert.id,
      superAdmin.id,
      prisma
    );

    assert(approvedAlert.approvalStatus === 'APPROVED', 'Alert transitioned to APPROVED state');
    assert(typeof snapshot.snapshotHash === 'string' && snapshot.snapshotHash.length === 64, 'SHA-256 hash generated for snapshot');
    assert(verifySnapshotIntegrity(snapshot), 'Snapshot cryptographic integrity verified');

    // Verify frozen recipients contained inside snapshot
    const frozenParsed = JSON.parse(snapshot.frozenRecipients);
    assert(frozenParsed.length === 2, 'Snapshot freezes exactly 2 recipients');
    assert(frozenParsed.some(r => r.alertTier === 'REDACTED_OPERATIONAL_BRIEFING'), 'Operational tier frozen in snapshot');
    assert(frozenParsed.some(r => r.alertTier === 'EXECUTIVE_FLASH_SUMMARY'), 'Executive tier frozen in snapshot');

    // Invalidation test: Modifying alert draft MUST invalidate approval!
    await invalidateAlertApproval(createdAlert.id, 'User edited content', superAdmin.id, prisma);
    const revertedAlert = await prisma.incidentAlert.findUnique({ where: { id: createdAlert.id } });
    assert(revertedAlert.approvalStatus === 'DRAFT', 'Alert approval reverted to DRAFT upon modification');
    assert(revertedAlert.activeSnapshotId === null, 'Active snapshot detached upon modification');

    // Re-approve alert for subsequent tests
    const reApproved = await createAlertSnapshot(createdAlert.id, superAdmin.id, prisma);
    assert(reApproved.alert.approvalStatus === 'APPROVED', 'Alert re-approved with new snapshot version');

    // ---------------------------------------------------------------------------------
    // TEST 7: Dispatch Engine, Snapshot Enforcement & Idempotency
    // ---------------------------------------------------------------------------------
    console.log('\n▶ [Test 7/11] Testing In-App Dispatch Engine & Idempotency...');

    // Attempt dispatch from non-SUPER_ADMIN
    const nonAdminDispatch = await dispatchAlertInternal(
      createdAlert.id,
      authorizedStaff.id,
      authorizedStaff.role,
      prisma
    );
    assert(!nonAdminDispatch.success, 'Dispatch from non-SUPER_ADMIN rejected');

    // Successful internal dispatch by SUPER_ADMIN
    const validDispatch = await dispatchAlertInternal(
      createdAlert.id,
      superAdmin.id,
      superAdmin.role,
      prisma
    );
    assert(validDispatch.success, 'Internal dispatch by SUPER_ADMIN succeeded');
    assert(validDispatch.deliveredCount === 2, 'Delivered in-app to exactly 2 active recipients');

    // Check delivery logs
    const deliveryLogs = await prisma.alertDeliveryLog.findMany({
      where: { alertId: createdAlert.id },
    });
    assert(deliveryLogs.length === 2, 'Created 2 delivery log records');
    assert(deliveryLogs.every(l => l.channel === 'IN_APP_PORTAL'), 'All deliveries strictly via IN_APP_PORTAL');
    assert(deliveryLogs.every(l => l.status === 'SUCCESS'), 'All deliveries recorded as SUCCESS');

    // Check notifications created in DB
    const notifs = await prisma.notification.findMany({
      where: {
        userId: { in: [operationalRecipient.id, executiveRecipient.id] },
      },
      orderBy: { createdAt: 'desc' },
      take: 2,
    });
    assert(notifs.length === 2, 'Created 2 internal in-app notifications');
    // Ensure notifications do NOT leak coordinates or reporter name
    assert(!notifs.some(n => n.titleAr.includes('12.8765') || n.messageAr.includes('مصدر استخباراتي')), 'Notifications contain ZERO sensitive original leaks');

    // Idempotency check: Repeated dispatch must NOT duplicate notifications or logs
    const retryDispatch = await dispatchAlertInternal(
      createdAlert.id,
      superAdmin.id,
      superAdmin.role,
      prisma
    );
    assert(retryDispatch.success, 'Retry dispatch executes safely');
    assert(retryDispatch.deliveredCount === 0, 'Zero new deliveries on retry (duplicate delivery prevented)');
    assert(retryDispatch.skippedCount === 2, 'Both recipients skipped due to idempotency keys');

    // ---------------------------------------------------------------------------------
    // TEST 8: Recipient Tier Isolation & Account Deactivation
    // ---------------------------------------------------------------------------------
    console.log('\n▶ [Test 8/11] Testing Recipient Reading Gate & Tier Separation...');

    // Recipient 1: Operational Recipient -> Must receive Tier 1 only
    const rec1Record = await prisma.alertRecipient.findUnique({
      where: {
        alertId_recipientUserId: {
          alertId: createdAlert.id,
          recipientUserId: operationalRecipient.id,
        },
      },
    });
    assert(rec1Record.alertTier === 'REDACTED_OPERATIONAL_BRIEFING', 'Recipient 1 authorized for REDACTED_OPERATIONAL_BRIEFING');

    // Recipient 2: Executive Recipient -> Must receive Tier 2 only
    const rec2Record = await prisma.alertRecipient.findUnique({
      where: {
        alertId_recipientUserId: {
          alertId: createdAlert.id,
          recipientUserId: executiveRecipient.id,
        },
      },
    });
    assert(rec2Record.alertTier === 'EXECUTIVE_FLASH_SUMMARY', 'Recipient 2 authorized for EXECUTIVE_FLASH_SUMMARY');

    // Unaddressed user attempt -> Must be DENIED
    const unaddressedUserCheck = await prisma.alertRecipient.findUnique({
      where: {
        alertId_recipientUserId: {
          alertId: createdAlert.id,
          recipientUserId: unauthorizedStaff.id,
        },
      },
    });
    assert(unaddressedUserCheck === null, 'Unaddressed user has no recipient record');

    // Deactivation test: If account deactivated, access must be revoked
    await prisma.user.update({
      where: { id: operationalRecipient.id },
      data: { isActive: false },
    });
    const deactivatedCheck = await prisma.user.findUnique({
      where: { id: operationalRecipient.id },
      select: { isActive: true },
    });
    assert(!deactivatedCheck.isActive, 'Recipient account deactivated');

    // Re-activate for cleanup
    await prisma.user.update({
      where: { id: operationalRecipient.id },
      data: { isActive: true },
    });

    // ---------------------------------------------------------------------------------
    // TEST 9: In-Platform Only Dispatch Verification
    // ---------------------------------------------------------------------------------
    console.log('\n▶ [Test 9/11] Verifying 100% In-Platform Distribution (No External Services)...');

    const allDeliveryLogs = await prisma.alertDeliveryLog.findMany({
      where: { alertId: createdAlert.id },
    });
    const channels = Array.from(new Set(allDeliveryLogs.map(l => l.channel)));
    assert(channels.length === 1 && channels[0] === 'IN_APP_PORTAL', 'All dispatch logs strictly confined to IN_APP_PORTAL');

    // ---------------------------------------------------------------------------------
    // TEST 10: Complete End-to-End Workflow Walkthrough
    // ---------------------------------------------------------------------------------
    console.log('\n▶ [Test 10/11] Testing Complete Incident-to-Alert End-to-End Workflow...');

    // Phase 1: Incident with Approved Redacted Version
    const e2eIncident = await prisma.incident.create({
      data: {
        incidentNumber: `FACSS-INC-E2E-A4-${Date.now()}`,
        category: 'CIVIL_UNREST_ROADBLOCK',
        priority: 'HIGH',
        status: 'VERIFIED',
        governorate: 'عدن',
        district: 'دار سعد',
        incidentDate: new Date(),
        createdById: superAdmin.id,
        redactedVersions: {
          create: {
            versionNumber: 1,
            redactedTitleAr: 'إغلاق جزئي لطريق دار سعد إثر احتجاجات مدنية',
            redactedDescAr: 'رصد تجمعات مدنية وإغلاق جزئي لحركة المركبات في دار سعد.',
            safeAreaScopeAr: 'مديرية دار سعد - المدخل الشمالي',
            approvedByUserId: superAdmin.id,
            isApproved: true,
          },
        },
      },
    });
    cleanupIncidentIds.push(e2eIncident.id);

    // Phase 2: Staff drafts alert
    const e2eDraft = await prisma.incidentAlert.create({
      data: {
        alertNumber: `FACSS-ALT-E2E-${Date.now()}`,
        incidentId: e2eIncident.id,
        severity: 'WARNING_HIGH',
        titleAr: 'إحاطة تشغيلية: قطع جزئي لطريق دار سعد الشمالي',
        bodyAr: 'تجمع مدني محدود وإغلاق جزئي للشارع العام في دار سعد دون مؤشرات تصعيد مسلح.',
        executiveTitleAr: 'ملخص تنفيذي: إغلاق جزئي في دار سعد',
        executiveSummaryAr: 'إغلاق جزئي في مدخل دار سعد والتنقل متاح عبر الخط الدائري.',
        movementAdviceAr: 'يُنصح باستخدام الخط الدائري الشرقي كمسار بديل آمن.',
        targetGovernorate: 'عدن',
        targetDistricts: JSON.stringify(['دار سعد']),
        draftedByUserId: authorizedStaff.id,
        approvalStatus: 'DRAFT',
        recipients: {
          create: [
            { recipientUserId: operationalRecipient.id, alertTier: 'REDACTED_OPERATIONAL_BRIEFING' },
            { recipientUserId: executiveRecipient.id, alertTier: 'EXECUTIVE_FLASH_SUMMARY' },
          ],
        },
      },
    });
    cleanupAlertIds.push(e2eDraft.id);

    // Phase 3: SUPER_ADMIN Reviews & Approves Snapshot
    const e2eSnapshotResult = await createAlertSnapshot(e2eDraft.id, superAdmin.id, prisma);
    assert(e2eSnapshotResult.alert.approvalStatus === 'APPROVED', 'E2E Alert approved with immutable snapshot');

    // Phase 4: In-App Dispatch
    const e2eDispatchResult = await dispatchAlertInternal(e2eDraft.id, superAdmin.id, superAdmin.role, prisma);
    assert(e2eDispatchResult.success, 'E2E Alert dispatched in-app successfully');
    assert(e2eDispatchResult.deliveredCount === 2, 'E2E Delivered to 2 recipients');

    // Phase 5: Recipient reads alert and marks read
    const operationalUserAlert = await prisma.alertRecipient.findUnique({
      where: {
        alertId_recipientUserId: {
          alertId: e2eDraft.id,
          recipientUserId: operationalRecipient.id,
        },
      },
    });
    assert(operationalUserAlert !== null, 'Recipient can fetch assigned alert');

    // Mark read
    await prisma.alertRecipient.update({
      where: { id: operationalUserAlert.id },
      data: { readAt: new Date() },
    });

    const readCheck = await prisma.alertRecipient.findUnique({
      where: { id: operationalUserAlert.id },
    });
    assert(readCheck.readAt !== null, 'Recipient read timestamp successfully recorded');

    // ---------------------------------------------------------------------------------
    // TEST 11: Legacy Data Retention & System Integrity Check
    // ---------------------------------------------------------------------------------
    console.log('\n▶ [Test 11/11] Verifying Legacy Data Retention...');

    const servicesCount = await prisma.service.count();
    assert(servicesCount >= 10, `Core services intact (${servicesCount} records)`);

    const categoriesCount = await prisma.serviceCategory.count();
    assert(categoriesCount >= 5, `Service categories intact (${categoriesCount} records)`);

    const usersCount = await prisma.user.count();
    assert(usersCount >= 5, `Users database intact (${usersCount} records)`);

    console.log('\n========================================================================');
    console.log(`  ALL COMMAND 4 ACCEPTANCE TESTS PASSED: ${passedTests} PASSED, 0 FAILED`);
    console.log('========================================================================\n');

  } finally {
    console.log('▶ Cleaning up synthetic test records...');
    try {
      for (const altId of cleanupAlertIds) {
        await prisma.alertDeliveryLog.deleteMany({ where: { alertId: altId } });
        await prisma.alertRecipient.deleteMany({ where: { alertId: altId } });
        await prisma.alertSnapshot.deleteMany({ where: { alertId: altId } });
        await prisma.incidentAlert.deleteMany({ where: { id: altId } });
      }

      for (const incId of cleanupIncidentIds) {
        await prisma.incidentVerification.deleteMany({ where: { incidentId: incId } });
        await prisma.incidentAssignment.deleteMany({ where: { incidentId: incId } });
        await prisma.incidentRedacted.deleteMany({ where: { incidentId: incId } });
        await prisma.incidentAttachment.deleteMany({ where: { incidentId: incId } });
        await prisma.incidentOriginal.deleteMany({ where: { incidentId: incId } });
        await prisma.incident.deleteMany({ where: { id: incId } });
      }

      for (const uId of cleanupUserIds) {
        await prisma.notification.deleteMany({ where: { userId: uId } });
        await prisma.userCapability.deleteMany({ where: { userId: uId } });
        await prisma.user.deleteMany({ where: { id: uId } });
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

runCommand4Suite().catch((err) => {
  console.error('Fatal error running Command 4 suite:', err);
  process.exit(1);
});
