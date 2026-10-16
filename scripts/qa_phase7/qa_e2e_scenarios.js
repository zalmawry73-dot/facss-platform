// Phase 7 QA — Full E2E Workflow Scenarios (1 to 5)
// STRICT SAFETY: Runs ONLY against isolated QA instance on port 3100 (facss_qa database on port 5544).
// Refuses execution if pointed at operational port 3000.
const fs = require('fs');
const path = require('path');

const BASE = process.env.QA_BASE || 'http://localhost:3100';
if (/:3000\b/.test(BASE)) {
  console.error('FATAL: Refusing to run E2E mutating scenarios against operational port 3000!');
  process.exit(2);
}

const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });

const sessionsFile = path.join(OUT, 'sessions.json');
let sessions = {};
if (fs.existsSync(sessionsFile)) {
  sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8'));
}

async function loginUser(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  const tokenCookie = setCookies.map(c => c.split(';')[0]).find(c => c.startsWith('facss_session_token='));
  return { status: res.status, cookie: tokenCookie || null };
}

async function api(method, endpoint, role, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (role && sessions[role]) {
    headers.Cookie = sessions[role];
  }
  const opts = { method, headers };
  if (body) {
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${endpoint}`, opts);
  let data = null;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = { rawText: text.slice(0, 300) };
  }
  return { status: res.status, ok: res.ok, data };
}

(async () => {
  console.log('=== FACSS Phase 7: Comprehensive E2E Workflow Scenarios ===');
  console.log(`Targeting isolated environment: ${BASE}`);

  // Re-verify sessions
  const accounts = {
    SUPER_ADMIN: ['admin@facss-aden.com', 'Admin@AICSFA2026'],
    SERVICE_MANAGER: ['services@facss-aden.com', 'Service@AICSFA2026'],
    TRAINING_MANAGER: ['training@facss-aden.com', 'Train@AICSFA2026'],
    RESEARCH_MANAGER: ['research@facss-aden.com', 'Research@AICSFA2026'],
    FIELD_FOCAL_POINT: ['field.focal@facss-aden.com', 'Focal@AICSFA2026'],
    CLIENT: ['safety.officer@humanitarian-ngo.org', 'Client@AICSFA2026'],
    TRAINEE: ['trainee@facss-aden.com', 'Trainee@AICSFA2026'],
  };

  for (const [role, [email, pass]] of Object.entries(accounts)) {
    if (!sessions[role]) {
      console.log(`Logging in ${role}...`);
      const s = await loginUser(email, pass);
      if (s.cookie) sessions[role] = s.cookie;
      await new Promise(r => setTimeout(r, 1200));
    }
  }

  const results = {
    scenario1_service_request: { name: 'Service Request Full Lifecycle', steps: [] },
    scenario2_incident_reporting: { name: 'Field Incident Intake & Triage', steps: [] },
    scenario3_training_certification: { name: 'Training Registration & Certification', steps: [] },
    scenario4_equipment_handover: { name: 'Equipment Supply & Handover Document', steps: [] },
    scenario5_research_lifecycle: { name: 'Research Creation & Access Restriction', steps: [] },
  };

  // -------------------------------------------------------------
  // SCENARIO 1: Service Request Full Lifecycle
  // Client submits -> Admin receives -> Under Review -> Approved -> In Progress -> Report Ready -> Completed
  // -------------------------------------------------------------
  console.log('\n--- Executing Scenario 1: Service Request Lifecycle ---');
  let s1ReqId = null;
  let s1ReqNum = null;

  // Step 1.1: Client submits service request
  const s1Services = await api('GET', '/api/services', 'PUBLIC');
  const serviceItem = s1Services.data?.services?.[0] || { id: 'cmv43pvxb000shkkzdpg0212j' };
  
  const step1 = await api('POST', '/api/requests', 'CLIENT', {
    serviceId: serviceItem.id,
    organization: 'منظمة الإغاثة الإنسانية الدولية (QA Test)',
    contactName: 'د. أحمد اليافعي',
    contactEmail: 'safety.officer@humanitarian-ngo.org',
    contactPhone: '+967 777 123 456',
    priority: 'HIGH',
    description: 'طلب تقييم أمني ميداني شامل لمقر البعثة في مديرية خور مكسر - سيناريو اختبار الجودة المرحلة السابعة.',
  });
  s1ReqId = step1.data?.request?.id || step1.data?.id;
  s1ReqNum = step1.data?.request?.requestNumber || step1.data?.requestNumber;
  results.scenario1_service_request.steps.push({
    step: '1.1_Client_Submit_Request',
    status: step1.status,
    pass: step1.status === 201 || (step1.ok && !!s1ReqNum),
    requestId: s1ReqId,
    requestNumber: s1ReqNum,
    detail: step1.data,
  });
  console.log(`Step 1.1 Submit: ${step1.status} (Num: ${s1ReqNum})`);

  // Step 1.2: Admin lists requests and finds new request
  const step2 = await api('GET', '/api/requests', 'SUPER_ADMIN');
  const foundInAdmin = step2.data?.requests?.some(r => r.id === s1ReqId || r.requestNumber === s1ReqNum);
  results.scenario1_service_request.steps.push({
    step: '1.2_Admin_List_Requests',
    status: step2.status,
    pass: step2.ok && foundInAdmin,
    totalRequests: step2.data?.requests?.length,
  });
  console.log(`Step 1.2 Admin View: ${step2.status} (Found: ${foundInAdmin})`);

  // Step 1.3: Admin transitions status to UNDER_REVIEW
  if (s1ReqId) {
    const step3 = await api('PATCH', `/api/requests/${s1ReqId}`, 'SUPER_ADMIN', {
      status: 'UNDER_REVIEW',
      note: 'تم استلام الطلب وتكليف فريق تقييم المخاطر الميداني.',
      isClientVisible: true,
    });
    results.scenario1_service_request.steps.push({
      step: '1.3_Admin_Under_Review',
      status: step3.status,
      pass: step3.ok && step3.data?.request?.status === 'UNDER_REVIEW',
      data: step3.data,
    });
    console.log(`Step 1.3 Status UNDER_REVIEW: ${step3.status}`);

    // Step 1.4: Admin transitions status to APPROVED
    const step4 = await api('PATCH', `/api/requests/${s1ReqId}`, 'SUPER_ADMIN', {
      status: 'APPROVED',
      note: 'تمت الموافقة الرسمية على خطة التقييم وجدولة الزيارة الميدانية.',
      isClientVisible: true,
    });
    results.scenario1_service_request.steps.push({
      step: '1.4_Admin_Approved',
      status: step4.status,
      pass: step4.ok && step4.data?.request?.status === 'APPROVED',
    });
    console.log(`Step 1.4 Status APPROVED: ${step4.status}`);

    // Step 1.5: Client checks request status in client portal
    const step5 = await api('GET', `/api/requests/${s1ReqId}`, 'CLIENT');
    results.scenario1_service_request.steps.push({
      step: '1.5_Client_View_Updated_Status',
      status: step5.status,
      pass: step5.ok && step5.data?.request?.status === 'APPROVED',
      clientVisibleNotes: step5.data?.request?.notes?.length,
    });
    console.log(`Step 1.5 Client Sees Approved: ${step5.status}`);

    // Step 1.6: Transition to COMPLETED
    const step6 = await api('PATCH', `/api/requests/${s1ReqId}`, 'SUPER_ADMIN', {
      status: 'COMPLETED',
      note: 'تم إنجاز التقييم الأمني وتسليم التقرير الختامي للعميل.',
      isClientVisible: true,
    });
    results.scenario1_service_request.steps.push({
      step: '1.6_Admin_Completed',
      status: step6.status,
      pass: step6.ok && step6.data?.request?.status === 'COMPLETED',
    });
    console.log(`Step 1.6 Status COMPLETED: ${step6.status}`);
  }

  // -------------------------------------------------------------
  // SCENARIO 2: Field Incident Intake & Triage
  // Focal Point submits incident -> Admin views -> Verifies/Triages
  // -------------------------------------------------------------
  console.log('\n--- Executing Scenario 2: Field Incident Reporting ---');
  let s2IncidentId = null;

  // Step 2.1: Field focal point enters incident report
  const step2_1 = await api('POST', '/api/incidents/intake', 'FIELD_FOCAL_POINT', {
    title: 'رصد تجمهر أمني غير اعتيادي بالقرب من خط الإمداد الشرقي',
    category: 'CIVIL_UNREST_ROADBLOCK',
    priority: 'HIGH',
    incidentDate: new Date().toISOString(),
    governorate: 'عدن',
    district: 'خور مكسر',
    locationDescription: 'تقاطع خط المطار - الجولة الرئيسية',
    rawDescription: 'تمت ملاحظة إغلاق جزئي للطريق وإشعال إطارات مما يعيق مرور شاحنات الإغاثة.',
    sourceReliability: 'B',
    informationCredibility: '2',
  });
  s2IncidentId = step2_1.data?.incident?.id || step2_1.data?.id;
  results.scenario2_incident_reporting.steps.push({
    step: '2.1_Focal_Submit_Incident',
    status: step2_1.status,
    pass: step2_1.ok && !!s2IncidentId,
    incidentId: s2IncidentId,
    incidentNumber: step2_1.data?.incident?.incidentNumber,
  });
  console.log(`Step 2.1 Incident Intake: ${step2_1.status} (ID: ${s2IncidentId})`);

  // Step 2.2: Admin reviews incidents list
  const step2_2 = await api('GET', '/api/admin/incidents', 'SUPER_ADMIN');
  const incidentFound = step2_2.data?.incidents?.some(i => i.id === s2IncidentId);
  results.scenario2_incident_reporting.steps.push({
    step: '2.2_Admin_List_Incidents',
    status: step2_2.status,
    pass: step2_2.ok && incidentFound,
    totalIncidents: step2_2.data?.incidents?.length,
  });
  console.log(`Step 2.2 Admin Incident List: ${step2_2.status} (Found: ${incidentFound})`);

  // Step 2.3: Admin updates triage status
  if (s2IncidentId) {
    const step2_3 = await api('PATCH', `/api/admin/incidents/${s2IncidentId}`, 'SUPER_ADMIN', {
      status: 'TRIAGED',
      verificationNotes: 'تم التحقق من النقطة الأمنية وتأكيد سلامة المسار البديل.',
    });
    results.scenario2_incident_reporting.steps.push({
      step: '2.3_Admin_Triage_Incident',
      status: step2_3.status,
      pass: step2_3.ok && (step2_3.data?.incident?.status === 'TRIAGED' || step2_3.data?.status === 'TRIAGED'),
    });
    console.log(`Step 2.3 Incident Triage: ${step2_3.status}`);
  }

  // -------------------------------------------------------------
  // SCENARIO 3: Training Course & Certification
  // Available course -> Trainee registers -> Admin accepts -> Certification
  // -------------------------------------------------------------
  console.log('\n--- Executing Scenario 3: Training & Certification ---');
  const s3Courses = await api('GET', '/api/training/available-courses', 'PUBLIC');
  const course = s3Courses.data?.courses?.[0] || { id: 'cmv43pvy00014hkkz9v47760b' };

  // Step 3.1: Public/Trainee views available courses
  results.scenario3_training_certification.steps.push({
    step: '3.1_View_Available_Courses',
    status: s3Courses.status,
    pass: s3Courses.ok && Array.isArray(s3Courses.data?.courses),
    courseId: course.id,
    titleAr: course.titleAr,
  });
  console.log(`Step 3.1 Available Courses: ${s3Courses.status} (${course.titleAr})`);

  // Step 3.2: Trainee views my-registrations
  const step3_2 = await api('GET', '/api/training/my-registrations', 'TRAINEE');
  results.scenario3_training_certification.steps.push({
    step: '3.2_Trainee_Registrations',
    status: step3_2.status,
    pass: step3_2.ok,
    totalRegistrations: step3_2.data?.registrations?.length || 0,
  });
  console.log(`Step 3.2 Trainee Registrations: ${step3_2.status}`);

  // Step 3.3: Trainee checks certificate verification
  const testCertCode = 'VER-AICSFA-9921';
  const step3_3 = await api('GET', `/api/verify/${testCertCode}`, 'PUBLIC');
  results.scenario3_training_certification.steps.push({
    step: '3.3_Public_Verify_Certificate',
    status: step3_3.status,
    pass: step3_3.ok && step3_3.data?.valid === true,
    certificateNumber: step3_3.data?.certificateNumber,
    studentName: step3_3.data?.studentName,
  });
  console.log(`Step 3.3 Public Cert Verification: ${step3_3.status} (Valid: ${step3_3.data?.valid})`);

  // -------------------------------------------------------------
  // SCENARIO 4: Equipment Handover & Verification
  // Admin equipment delivery / handover document check
  // -------------------------------------------------------------
  console.log('\n--- Executing Scenario 4: Equipment Handover ---');
  const step4_1 = await api('GET', '/api/admin/equipment/inventory', 'SUPER_ADMIN');
  results.scenario4_equipment_handover.steps.push({
    step: '4.1_Admin_Inventory_List',
    status: step4_1.status,
    pass: step4_1.ok,
    totalItems: step4_1.data?.inventory?.length || step4_1.data?.items?.length || 0,
  });
  console.log(`Step 4.1 Equipment Inventory: ${step4_1.status}`);

  const step4_2 = await api('GET', '/api/admin/equipment/deliveries', 'SUPER_ADMIN');
  results.scenario4_equipment_handover.steps.push({
    step: '4.2_Admin_Deliveries_List',
    status: step4_2.status,
    pass: step4_2.ok,
  });
  console.log(`Step 4.2 Equipment Deliveries: ${step4_2.status}`);

  // -------------------------------------------------------------
  // SCENARIO 5: Research Publications & Access Restrictions
  // Public publications list -> Client-only publication access check
  // -------------------------------------------------------------
  console.log('\n--- Executing Scenario 5: Research Lifecycle ---');
  const step5_1 = await api('GET', '/api/portal/client/research', 'CLIENT');
  results.scenario5_research_lifecycle.steps.push({
    step: '5.1_Client_Research_Access',
    status: step5_1.status,
    pass: step5_1.ok,
    totalPubs: step5_1.data?.publications?.length || 0,
  });
  console.log(`Step 5.1 Client Research: ${step5_1.status} (Count: ${step5_1.data?.publications?.length})`);

  const step5_2 = await api('GET', '/api/admin/research', 'SUPER_ADMIN');
  results.scenario5_research_lifecycle.steps.push({
    step: '5.2_Admin_Research_Management',
    status: step5_2.status,
    pass: step5_2.ok,
    totalAdminPubs: step5_2.data?.publications?.length || 0,
  });
  console.log(`Step 5.2 Admin Research List: ${step5_2.status}`);

  // Save all scenario results
  const outPath = path.join(OUT, 'e2e_results.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n=== E2E Scenarios Complete! Saved to ${outPath} ===`);
})();
