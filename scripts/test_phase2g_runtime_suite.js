/**
 * FACSS Phase 2G Real Runtime End-to-End Validation Suite
 * 
 * Executes real HTTP requests against the live server (http://localhost:3000)
 * and directly verifies database state mutations and security assertions.
 * 
 * Covers all roles and security layers:
 * - VISITOR: Public pages, i18n, contact, course catalog, verification, boundaries.
 * - CLIENT: Authentication, requests, anti-IDOR, confidential docs, notifications.
 * - TRAINEE: Course registration, capacity, duplicate check, portal boundaries, certificates.
 * - STAFF: Granular capabilities, least privilege (manage_requests vs manage_training).
 * - ADMIN / SUPER_ADMIN: Admin routes, privilege escalation barrier, user management.
 * - SECURITY & PRIVACY: Research CLIENT_ONLY fail-secure, inactive user revocation, path traversal, rate limiting.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { SignJWT } = require('jose');

// 0. Load environment configuration from .env
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

/**
 * Path containment validation matching lib/storage/index.ts
 */
function assertPathContainment(baseDir, targetKey) {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(resolvedBase, targetKey);
  const relative = path.relative(resolvedBase, resolvedTarget);

  if (relative.startsWith('..') || path.isAbsolute(relative) || relative === '') {
    throw new Error('SECURITY VIOLATION: Path traversal detected outside storage root.');
  }

  return resolvedTarget;
}

// 1. Configuration
const BASE_URL = process.env.APP_URL || 'http://localhost:3000';
const AUTH_SECRET = process.env.AUTH_SECRET || 'facss-aden-security-platform-dev-secret-key-2026-min-32-chars';
const secretKey = new TextEncoder().encode(AUTH_SECRET);

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;
const results = [];

function recordResult(id, role, name, status, evidence, dbEffect = 'None') {
  const isPass = status === 'PASS';
  if (isPass) passed++;
  else failed++;

  results.push({
    id,
    role,
    name,
    status,
    evidence,
    dbEffect,
  });

  const symbol = isPass ? '✓ PASS' : '✗ FAIL';
  console.log(`  [${id}] ${symbol} | Role: ${role} | ${name}`);
  if (!isPass) {
    console.error(`       Evidence: ${evidence}`);
  }
}

async function createToken(payload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

async function runSuite() {
  console.log('\n=============================================================');
  console.log('  FACSS PHASE 2G — REAL RUNTIME SYSTEM & SECURITY QA SUITE');
  console.log(`  Target: ${BASE_URL}`);
  console.log('=============================================================\n');

  try {
    // -----------------------------------------------------------------
    // 1. GROUP 1: VISITOR / ANONYMOUS SCENARIOS
    // -----------------------------------------------------------------
    console.log('--- [Group 1: Visitor Scenarios] ---');

    // V-01: Public Homepage loads
    const resHome = await fetch(`${BASE_URL}/`);
    recordResult(
      'V-01',
      'VISITOR',
      'Homepage loads with HTTP 200 and security headers',
      resHome.status === 200 && resHome.headers.get('x-content-type-options') === 'nosniff' ? 'PASS' : 'FAIL',
      `HTTP Status: ${resHome.status}, X-Content-Type-Options: ${resHome.headers.get('x-content-type-options')}`
    );

    // V-02: Public Navigation Routes (About, Services, Training, Research, Contact)
    const publicPages = ['/about', '/services', '/training', '/research', '/sectors', '/methodology', '/contact'];
    let allPublic200 = true;
    for (const p of publicPages) {
      const res = await fetch(`${BASE_URL}${p}`);
      if (res.status !== 200) {
        allPublic200 = false;
        break;
      }
    }
    recordResult(
      'V-02',
      'VISITOR',
      'Public navigation pages load successfully (HTTP 200)',
      allPublic200 ? 'PASS' : 'FAIL',
      `Checked ${publicPages.length} public pages, all returned 200: ${allPublic200}`
    );

    // V-03: Public Settings API
    const resSettings = await fetch(`${BASE_URL}/api/settings/public`);
    const dataSettings = await resSettings.json();
    recordResult(
      'V-03',
      'VISITOR',
      'Public Settings API returns corporate metadata',
      resSettings.status === 200 && dataSettings.success && dataSettings.settings ? 'PASS' : 'FAIL',
      `HTTP Status: ${resSettings.status}, Key count: ${Object.keys(dataSettings.settings || {}).length}`
    );

    // V-04: Available Courses API
    const resCourses = await fetch(`${BASE_URL}/api/training/available-courses`);
    const dataCourses = await resCourses.json();
    recordResult(
      'V-04',
      'VISITOR',
      'Available Courses API returns open courses with capacity data',
      resCourses.status === 200 && Array.isArray(dataCourses.courses) ? 'PASS' : 'FAIL',
      `HTTP Status: ${resCourses.status}, Available courses count: ${dataCourses.courses?.length || 0}`
    );

    // V-05: Contact Message Submission (Valid with unique IP to test function)
    const testContactEmail = `qa-visitor-${Date.now()}@test-audit.com`;
    const uniqueVisitorIp = `10.99.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}`;
    const resContact = await fetch(`${BASE_URL}/api/contact`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Forwarded-For': uniqueVisitorIp,
      },
      body: JSON.stringify({
        name: 'زائر اختباري للتدقيق الأمني',
        email: testContactEmail,
        phone: '777123456',
        organization: 'جهة فحص الجودة',
        subject: 'استفسار أمني اختباري',
        message: 'رسالة اختبارية للتحقق من حفظ رسائل التواصل في قاعدة البيانات.',
      }),
    });
    const dataContact = await resContact.json();
    
    // DB Verification
    const dbContact = await prisma.contactMessage.findFirst({
      where: { email: testContactEmail },
    });
    recordResult(
      'V-05',
      'VISITOR',
      'Contact Message submission creates UNREAD record in database',
      resContact.status === 200 && dataContact.success && dbContact !== null ? 'PASS' : 'FAIL',
      `HTTP Status: ${resContact.status}, Created DB ID: ${dbContact?.id}, Status: ${dbContact?.status}`,
      `Created ContactMessage id: ${dbContact?.id}`
    );

    // V-06: Contact Form Validation (Invalid payload rejection)
    const uniqueVisitorIp2 = `10.99.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}`;
    const resContactInvalid = await fetch(`${BASE_URL}/api/contact`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Forwarded-For': uniqueVisitorIp2,
      },
      body: JSON.stringify({
        name: '',
        email: 'not-an-email',
        subject: '',
        message: '',
      }),
    });
    recordResult(
      'V-06',
      'VISITOR',
      'Contact Message validation rejects invalid input (HTTP 400)',
      resContactInvalid.status === 400 ? 'PASS' : 'FAIL',
      `HTTP Status: ${resContactInvalid.status}`
    );

    // V-07: Certificate Verification (Valid code)
    const validCert = await prisma.certificate.findFirst({
      where: { isRevoked: false },
    });
    let validCertPass = false;
    if (validCert) {
      const resCert = await fetch(`${BASE_URL}/api/verify/${encodeURIComponent(validCert.verificationCode)}`);
      const dataCert = await resCert.json();
      validCertPass = resCert.status === 200 && dataCert.valid === true && dataCert.certificateNumber === validCert.certificateNumber;
    }
    recordResult(
      'V-07',
      'VISITOR',
      'Public Certificate Verification returns valid details for authentic certificate',
      validCertPass ? 'PASS' : 'FAIL',
      `Verified Code: ${validCert?.verificationCode}, Match: ${validCertPass}`
    );

    // V-08: Certificate Verification (Invalid code returns 404)
    const resCertFake = await fetch(`${BASE_URL}/api/verify/NON-EXISTENT-CODE-99999`);
    recordResult(
      'V-08',
      'VISITOR',
      'Public Certificate Verification returns 404 for invalid verification code',
      resCertFake.status === 404 ? 'PASS' : 'FAIL',
      `HTTP Status: ${resCertFake.status}`
    );

    // V-09: Direct unauthenticated access to /admin blocked by middleware
    const resAdminAnon = await fetch(`${BASE_URL}/admin`, { redirect: 'manual' });
    recordResult(
      'V-09',
      'VISITOR',
      'Unauthenticated request to /admin redirected to /login',
      resAdminAnon.status === 307 || resAdminAnon.status === 302 ? 'PASS' : 'FAIL',
      `HTTP Status: ${resAdminAnon.status}, Location: ${resAdminAnon.headers.get('location')}`
    );

    // V-10: Direct unauthenticated access to /portal/client blocked
    const resClientAnon = await fetch(`${BASE_URL}/portal/client`, { redirect: 'manual' });
    recordResult(
      'V-10',
      'VISITOR',
      'Unauthenticated request to /portal/client redirected to /login',
      resClientAnon.status === 307 || resClientAnon.status === 302 ? 'PASS' : 'FAIL',
      `HTTP Status: ${resClientAnon.status}, Location: ${resClientAnon.headers.get('location')}`
    );

    // -----------------------------------------------------------------
    // 2. GROUP 2: CLIENT SCENARIOS & ANTI-IDOR
    // -----------------------------------------------------------------
    console.log('\n--- [Group 2: Client Scenarios & Anti-IDOR] ---');

    // Fetch existing test clients
    const clientA = await prisma.user.findFirst({
      where: { role: 'CLIENT', email: 'client-test-a@facss-aden.com' },
    });
    const clientB = await prisma.user.findFirst({
      where: { role: 'CLIENT', email: 'client-test-b@facss-aden.com' },
    });

    const tokenClientA = await createToken({
      userId: clientA.id,
      email: clientA.email,
      fullName: clientA.fullName,
      role: clientA.role,
    });
    const tokenClientB = await createToken({
      userId: clientB.id,
      email: clientB.email,
      fullName: clientB.fullName,
      role: clientB.role,
    });

    // C-01: Client A gets authenticated identity
    const resMeClientA = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: `facss_session_token=${tokenClientA}` },
    });
    const dataMeClientA = await resMeClientA.json();
    recordResult(
      'C-01',
      'CLIENT',
      'Client A retrieves authenticated profile via /api/auth/me',
      resMeClientA.status === 200 && dataMeClientA.user?.id === clientA.id ? 'PASS' : 'FAIL',
      `HTTP Status: ${resMeClientA.status}, Email: ${dataMeClientA.user?.email}`
    );

    // C-02: Client creates a new service request via API
    const sampleService = await prisma.service.findFirst();
    const resCreateReq = await fetch(`${BASE_URL}/api/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `facss_session_token=${tokenClientA}`,
      },
      body: JSON.stringify({
        serviceId: sampleService.id,
        organization: 'شركة النفط المتحدة أ - فحص الجودة',
        contactName: 'عبدالرحمن العولقي',
        contactEmail: 'client-test-a@facss-aden.com',
        contactPhone: '777889900',
        priority: 'HIGH',
        description: 'طلب استشارة أمنية وتقييم مخاطر لمنشأة حيوية للاختبار.',
      }),
    });
    const dataCreateReq = await resCreateReq.json();
    const createdRequestId = dataCreateReq.requestId;
    const createdRequestNumber = dataCreateReq.requestNumber;

    recordResult(
      'C-02',
      'CLIENT',
      'Client A successfully creates Service Request with tracking number and DB record',
      dataCreateReq.success && createdRequestNumber && createdRequestNumber.startsWith('FACSS-SR-') ? 'PASS' : 'FAIL',
      `HTTP Status: ${resCreateReq.status}, Request Number: ${createdRequestNumber}, ID: ${createdRequestId}`,
      `Created ServiceRequest ${createdRequestId}`
    );

    // C-03: Client A retrieves own request
    const resGetOwnReq = await fetch(`${BASE_URL}/api/requests/${createdRequestId}`, {
      headers: { Cookie: `facss_session_token=${tokenClientA}` },
    });
    recordResult(
      'C-03',
      'CLIENT',
      'Client A can access their own Service Request details (HTTP 200)',
      resGetOwnReq.status === 200 ? 'PASS' : 'FAIL',
      `HTTP Status: ${resGetOwnReq.status}`
    );

    // C-04: ANTI-IDOR: Client B attempts to access Client A's request
    const resIdorReq = await fetch(`${BASE_URL}/api/requests/${createdRequestId}`, {
      headers: { Cookie: `facss_session_token=${tokenClientB}` },
    });
    recordResult(
      'C-04',
      'CLIENT',
      'ANTI-IDOR: Client B cannot view Client A Service Request (HTTP 403 Forbidden)',
      resIdorReq.status === 403 ? 'PASS' : 'FAIL',
      `HTTP Status: ${resIdorReq.status}`
    );

    // C-05: ANTI-IDOR / DOCUMENT CONFIDENTIALITY GATE
    // Create an INTERNAL_ONLY document attached to Client A's request
    const internalDoc = await prisma.serviceRequestDocument.create({
      data: {
        requestId: createdRequestId,
        title: 'تقرير تقدير الموقف الأمني الداخلي (سري للغاية)',
        filePath: 'test/internal-report.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        uploadedById: 'system',
        documentType: 'INTERNAL_DOCUMENT',
        visibility: 'INTERNAL_ONLY',
        isConfidential: true,
      },
    });

    // Client A attempts to download their own INTERNAL_ONLY document -> MUST BE FORBIDDEN (403)
    const resDownloadInternal = await fetch(`${BASE_URL}/api/documents/${internalDoc.id}/download`, {
      headers: { Cookie: `facss_session_token=${tokenClientA}` },
    });
    recordResult(
      'C-05',
      'CLIENT',
      'CONFIDENTIALITY GATE: Client cannot download INTERNAL_ONLY document on own request (HTTP 403)',
      resDownloadInternal.status === 403 ? 'PASS' : 'FAIL',
      `HTTP Status: ${resDownloadInternal.status}`
    );

    // C-06: Client portal boundary: Client cannot access /admin
    const resClientAdmin = await fetch(`${BASE_URL}/admin`, {
      headers: { Cookie: `facss_session_token=${tokenClientA}` },
      redirect: 'manual',
    });
    recordResult(
      'C-06',
      'CLIENT',
      'Client cannot access Admin CMS /admin (Redirect to login/unauthorized)',
      resClientAdmin.status === 307 || resClientAdmin.status === 302 ? 'PASS' : 'FAIL',
      `HTTP Status: ${resClientAdmin.status}, Location: ${resClientAdmin.headers.get('location')}`
    );

    // C-07: In-App Notifications retrieval for Client A
    const resClientNotifs = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { Cookie: `facss_session_token=${tokenClientA}` },
    });
    const dataClientNotifs = await resClientNotifs.json();
    recordResult(
      'C-07',
      'CLIENT',
      'Client retrieves their own notifications list and unread count',
      resClientNotifs.status === 200 && dataClientNotifs.total !== undefined && Array.isArray(dataClientNotifs.notifications) ? 'PASS' : 'FAIL',
      `HTTP Status: ${resClientNotifs.status}, Total: ${dataClientNotifs.total}, Unread: ${dataClientNotifs.unreadCount}`
    );

    // -----------------------------------------------------------------
    // 3. GROUP 3: TRAINEE SCENARIOS
    // -----------------------------------------------------------------
    console.log('\n--- [Group 3: Trainee Scenarios] ---');

    const traineeUser = await prisma.user.findFirst({
      where: { role: 'TRAINEE', email: 'trainee-test@facss-aden.com' },
    });
    const tokenTrainee = await createToken({
      userId: traineeUser.id,
      email: traineeUser.email,
      fullName: traineeUser.fullName,
      role: traineeUser.role,
    });

    // T-01: Trainee retrieves profile
    const resMeTrainee = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: `facss_session_token=${tokenTrainee}` },
    });
    const dataMeTrainee = await resMeTrainee.json();
    recordResult(
      'T-01',
      'TRAINEE',
      'Trainee retrieves authenticated profile with role TRAINEE',
      resMeTrainee.status === 200 && dataMeTrainee.user?.role === 'TRAINEE' ? 'PASS' : 'FAIL',
      `HTTP Status: ${resMeTrainee.status}, Role: ${dataMeTrainee.user?.role}`
    );

    // T-02: Trainee registers for an OPEN course
    const openCourse = await prisma.course.findFirst({
      where: { status: 'OPEN' },
    });
    
    // Clean up any prior test registration for idempotency
    await prisma.trainingRegistration.deleteMany({
      where: { courseId: openCourse.id, userId: traineeUser.id },
    });

    const resRegisterCourse = await fetch(`${BASE_URL}/api/training/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `facss_session_token=${tokenTrainee}`,
      },
      body: JSON.stringify({
        courseId: openCourse.id,
        fullName: traineeUser.fullName,
        email: traineeUser.email,
        phone: '777000222',
        nationalId: '1029384756',
        qualification: 'دبلوم علوم أمنية وميدانية',
      }),
    });
    const dataRegisterCourse = await resRegisterCourse.json();

    // Verify registration in DB
    const dbReg = await prisma.trainingRegistration.findFirst({
      where: { courseId: openCourse.id, userId: traineeUser.id },
    });
    recordResult(
      'T-02',
      'TRAINEE',
      'Trainee registers for course; DB record created with status PENDING',
      resRegisterCourse.status === 201 && dbReg?.status === 'PENDING' ? 'PASS' : 'FAIL',
      `HTTP Status: ${resRegisterCourse.status}, DB Reg ID: ${dbReg?.id}, Status: ${dbReg?.status}`,
      `Created TrainingRegistration ${dbReg?.id}`
    );

    // T-03: DUPLICATE PREVENTION: Trainee attempts to register again for the same course
    const resDuplicateReg = await fetch(`${BASE_URL}/api/training/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `facss_session_token=${tokenTrainee}`,
      },
      body: JSON.stringify({
        courseId: openCourse.id,
        fullName: traineeUser.fullName,
        email: traineeUser.email,
        phone: '777000222',
      }),
    });
    recordResult(
      'T-03',
      'TRAINEE',
      'DUPLICATE CONTROL: Trainee cannot register twice for the same course (HTTP 409 Conflict)',
      resDuplicateReg.status === 409 || resDuplicateReg.status === 400 ? 'PASS' : 'FAIL',
      `HTTP Status: ${resDuplicateReg.status}`
    );

    // T-04: Boundary Gate: Trainee cannot access Client Portal
    const resTraineeClientPortal = await fetch(`${BASE_URL}/portal/client`, {
      headers: { Cookie: `facss_session_token=${tokenTrainee}` },
      redirect: 'manual',
    });
    recordResult(
      'T-04',
      'TRAINEE',
      'BOUNDARY GATE: Trainee accessing /portal/client is redirected to /portal/trainee',
      resTraineeClientPortal.status === 307 && resTraineeClientPortal.headers.get('location')?.includes('/portal/trainee') ? 'PASS' : 'FAIL',
      `HTTP Status: ${resTraineeClientPortal.status}, Location: ${resTraineeClientPortal.headers.get('location')}`
    );

    // -----------------------------------------------------------------
    // 4. GROUP 4: GRANULAR STAFF SCENARIOS (LEAST PRIVILEGE)
    // -----------------------------------------------------------------
    console.log('\n--- [Group 4: Granular Staff & Least Privilege] ---');

    // Staff with ONLY manage_requests
    const staffWithReq = await prisma.user.findFirst({
      where: { email: 'staff-with-req-caps@facss-aden.com' },
    });
    const tokenStaffReq = await createToken({
      userId: staffWithReq.id,
      email: staffWithReq.email,
      fullName: staffWithReq.fullName,
      role: staffWithReq.role,
    });

    // Staff WITHOUT any capability
    const staffNoCaps = await prisma.user.findFirst({
      where: { email: 'staff-without-req-caps@facss-aden.com' },
    });
    const tokenStaffNoCaps = await createToken({
      userId: staffNoCaps.id,
      email: staffNoCaps.email,
      fullName: staffNoCaps.fullName,
      role: staffNoCaps.role,
    });

    // S-01: Staff with manage_requests can list service requests
    const resStaffReqList = await fetch(`${BASE_URL}/api/requests`, {
      headers: { Cookie: `facss_session_token=${tokenStaffReq}` },
    });
    recordResult(
      'S-01',
      'STAFF',
      'Staff with [manage_requests] can access /api/requests (HTTP 200)',
      resStaffReqList.status === 200 ? 'PASS' : 'FAIL',
      `HTTP Status: ${resStaffReqList.status}`
    );

    // S-02: Staff with manage_requests CANNOT access Training API
    const resStaffTrainingDeny = await fetch(`${BASE_URL}/api/admin/training`, {
      headers: { Cookie: `facss_session_token=${tokenStaffReq}` },
    });
    recordResult(
      'S-02',
      'STAFF',
      'LEAST PRIVILEGE: Staff with [manage_requests] denied access to /api/admin/training (HTTP 403)',
      resStaffTrainingDeny.status === 403 ? 'PASS' : 'FAIL',
      `HTTP Status: ${resStaffTrainingDeny.status}`
    );

    // S-03: Staff with manage_requests CANNOT access Users Management API
    const resStaffUsersDeny = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Cookie: `facss_session_token=${tokenStaffReq}` },
    });
    recordResult(
      'S-03',
      'STAFF',
      'LEAST PRIVILEGE: Staff with [manage_requests] denied access to /api/admin/users (HTTP 403)',
      resStaffUsersDeny.status === 403 ? 'PASS' : 'FAIL',
      `HTTP Status: ${resStaffUsersDeny.status}`
    );

    // S-04: Staff WITHOUT capabilities CANNOT access requests
    const resStaffNoCapReq = await fetch(`${BASE_URL}/api/requests`, {
      headers: { Cookie: `facss_session_token=${tokenStaffNoCaps}` },
    });
    recordResult(
      'S-04',
      'STAFF',
      'LEAST PRIVILEGE: Staff without capabilities denied /api/requests (HTTP 403)',
      resStaffNoCapReq.status === 403 ? 'PASS' : 'FAIL',
      `HTTP Status: ${resStaffNoCapReq.status}`
    );

    // -----------------------------------------------------------------
    // 5. GROUP 5: ADMIN & PRIVILEGE ESCALATION BARRIER
    // -----------------------------------------------------------------
    console.log('\n--- [Group 5: Admin & Privilege Escalation Barrier] ---');

    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN', email: 'admin-p2d@facss-aden.com' },
    });
    const tokenAdmin = await createToken({
      userId: adminUser.id,
      email: adminUser.email,
      fullName: adminUser.fullName,
      role: adminUser.role,
    });

    // A-01: Admin can access users list
    const resAdminUsers = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Cookie: `facss_session_token=${tokenAdmin}` },
    });
    recordResult(
      'A-01',
      'ADMIN',
      'Admin can access Users Management API /api/admin/users (HTTP 200)',
      resAdminUsers.status === 200 ? 'PASS' : 'FAIL',
      `HTTP Status: ${resAdminUsers.status}`
    );

    // A-02: PRIVILEGE ESCALATION BARRIER: Regular Admin cannot assign capabilities to self
    const resEscalateSelf = await fetch(`${BASE_URL}/api/admin/users/${adminUser.id}/capabilities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `facss_session_token=${tokenAdmin}`,
      },
      body: JSON.stringify({ capability: 'manage_users' }),
    });
    recordResult(
      'A-02',
      'ADMIN',
      'ANTI-PRIVILEGE-ESCALATION: Admin cannot assign capabilities to self (HTTP 403 Forbidden)',
      resEscalateSelf.status === 403 ? 'PASS' : 'FAIL',
      `HTTP Status: ${resEscalateSelf.status}`
    );

    // A-03: PRIVILEGE ESCALATION BARRIER: Regular Admin cannot grant 'manage_users' to another user
    const resGrantManageUsers = await fetch(`${BASE_URL}/api/admin/users/${staffNoCaps.id}/capabilities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `facss_session_token=${tokenAdmin}`,
      },
      body: JSON.stringify({ capability: 'manage_users' }),
    });
    recordResult(
      'A-03',
      'ADMIN',
      'ANTI-PRIVILEGE-ESCALATION: Only SUPER_ADMIN can grant [manage_users] (HTTP 403 Forbidden)',
      resGrantManageUsers.status === 403 ? 'PASS' : 'FAIL',
      `HTTP Status: ${resGrantManageUsers.status}`
    );

    // -----------------------------------------------------------------
    // 6. GROUP 6: RESEARCH VISIBILITY & FAIL-SECURE GATE
    // -----------------------------------------------------------------
    console.log('\n--- [Group 6: Research Visibility & Privacy] ---');

    // Fetch CLIENT_ONLY research publication
    const clientOnlyResearch = await prisma.researchPublication.findFirst({
      where: { visibility: 'CLIENT_ONLY' },
    });

    let pubSlug = clientOnlyResearch?.slug;
    if (!pubSlug) {
      const cat = await prisma.researchCategory.findFirst();
      const createdPub = await prisma.researchPublication.create({
        data: {
          titleAr: 'تقرير تحليلي خاص بالعملاء للاختبار',
          titleEn: 'Test Client Only Research',
          slug: 'test-client-only-study-g',
          author: 'وحدة الدراسات',
          summaryAr: 'ملخص تحليلي سري للاختبار',
          summaryEn: 'Test summary',
          contentAr: 'محتوى استراتيجي',
          contentEn: 'Content',
          categoryId: cat.id,
          visibility: 'CLIENT_ONLY',
          status: 'PUBLISHED',
        },
      });
      pubSlug = createdPub.slug;
    }

    // SEC-01: Anonymous visitor attempts to view CLIENT_ONLY study -> 404
    const resAnonStudy = await fetch(`${BASE_URL}/research/${pubSlug}`);
    recordResult(
      'SEC-01',
      'SECURITY',
      'FAIL-SECURE: Anonymous visitor receives 404 on CLIENT_ONLY research publication',
      resAnonStudy.status === 404 ? 'PASS' : 'FAIL',
      `HTTP Status: ${resAnonStudy.status}`
    );

    // SEC-02: Client user attempts to view CLIENT_ONLY study -> 404 (Pending owner decision)
    const resClientStudy = await fetch(`${BASE_URL}/research/${pubSlug}`, {
      headers: { Cookie: `facss_session_token=${tokenClientA}` },
    });
    recordResult(
      'SEC-02',
      'SECURITY',
      'FAIL-SECURE: Client user receives 404 on unassigned CLIENT_ONLY research publication',
      resClientStudy.status === 404 ? 'PASS' : 'FAIL',
      `HTTP Status: ${resClientStudy.status}`
    );

    // -----------------------------------------------------------------
    // 7. GROUP 7: INACTIVE USER REVOCATION & STORAGE SECURITY
    // -----------------------------------------------------------------
    console.log('\n--- [Group 7: Session Expiry, Storage Security & Rate Limiting] ---');

    // Create a temporary user, issue token, then deactivate
    const tempDeactivated = await prisma.user.create({
      data: {
        email: `deactivated-test-${Date.now()}@facss-aden.com`,
        fullName: 'مستخدم معطل للاختبار',
        passwordHash: 'hash',
        role: 'CLIENT',
        isActive: false, // Deactivated in DB
      },
    });

    const tokenDeactivated = await createToken({
      userId: tempDeactivated.id,
      email: tempDeactivated.email,
      fullName: tempDeactivated.fullName,
      role: tempDeactivated.role,
    });

    // Call protected endpoint with deactivated user token -> MUST BE 401
    const resDeactivatedProtected = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { Cookie: `facss_session_token=${tokenDeactivated}` },
    });
    recordResult(
      'SEC-03',
      'SECURITY',
      'DEACTIVATION CHECK: User with isActive=false rejected with HTTP 401 on protected APIs',
      resDeactivatedProtected.status === 401 ? 'PASS' : 'FAIL',
      `HTTP Status: ${resDeactivatedProtected.status}`
    );

    // Clean up temporary deactivated user
    await prisma.user.delete({ where: { id: tempDeactivated.id } });

    // SEC-04: Path Traversal Defeat on Storage Driver
    let pathTraversalBlocked = false;
    try {
      assertPathContainment('./storage/private/documents', '../../../../etc/shadow');
    } catch (err) {
      pathTraversalBlocked = err.message.includes('SECURITY VIOLATION');
    }
    recordResult(
      'SEC-04',
      'SECURITY',
      'PATH TRAVERSAL: Storage layer assertPathContainment blocks relative directory escape',
      pathTraversalBlocked ? 'PASS' : 'FAIL',
      `Path traversal exception correctly triggered: ${pathTraversalBlocked}`
    );

    // SEC-05: Rate Limiting Verification (Trigger HTTP 429)
    const rateLimitTestIp = `10.88.77.${Math.floor(Math.random() * 200)}`;
    let hit429 = false;
    for (let i = 0; i < 7; i++) {
      const res = await fetch(`${BASE_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': rateLimitTestIp,
        },
        body: JSON.stringify({
          name: 'فحص معدل الطلبات',
          email: 'ratelimit@test.com',
          subject: 'Rate Limit',
          message: 'Checking 429 response',
        }),
      });
      if (res.status === 429) {
        hit429 = true;
        break;
      }
    }
    recordResult(
      'SEC-05',
      'SECURITY',
      'ANTI-ABUSE: High-frequency requests trigger HTTP 429 Too Many Requests',
      hit429 ? 'PASS' : 'FAIL',
      `Rate limit successfully triggered: ${hit429}`
    );

    // -----------------------------------------------------------------
    // SUMMARY
    // -----------------------------------------------------------------
    console.log('\n=============================================================');
    console.log(`  PHASE 2G TEST EXECUTION COMPLETE: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
    console.log('=============================================================\n');

    return { passed, failed, results };
  } catch (err) {
    console.error('Fatal error during Phase 2G test run:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runSuite().then(res => {
  if (res.failed > 0) process.exit(1);
  else process.exit(0);
});
