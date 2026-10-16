// Deep E2E Lifecycle Testing & Classification Suite
// Runs ONLY against isolated QA sandbox on port 3100 (facss_qa DB on port 5544)
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:3100';

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

async function api(method, endpoint, cookie, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers.Cookie = cookie;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${endpoint}`, opts);
  let data = null;
  const text = await res.text();
  try { data = JSON.parse(text); } catch (e) { data = { rawText: text.slice(0, 300) }; }
  return { status: res.status, ok: res.ok, data };
}

(async () => {
  console.log('================================================================');
  console.log('FACSS PHASE 7: DEEP E2E LIFECYCLE REVALIDATION & CLASSIFICATION');
  console.log('Target: Isolated QA Sandbox http://localhost:3100');
  console.log('================================================================\n');

  // Authenticate all relevant personas
  console.log('Authenticating personas...');
  const sessions = {
    SUPER_ADMIN: (await loginUser('admin@facss-aden.com', 'Admin@AICSFA2026')).cookie,
    CLIENT: (await loginUser('safety.officer@humanitarian-ngo.org', 'Client@AICSFA2026')).cookie,
    FIELD_FOCAL: (await loginUser('field.focal@facss-aden.com', 'Focal@AICSFA2026')).cookie,
    TRAINEE: (await loginUser('trainee@facss-aden.com', 'Trainee@AICSFA2026')).cookie,
    TRAINING_MGR: (await loginUser('training@facss-aden.com', 'Train@AICSFA2026')).cookie,
    RESEARCH_MGR: (await loginUser('research@facss-aden.com', 'Research@AICSFA2026')).cookie,
  };

  const results = {};

  // -------------------------------------------------------------
  // LIFECYCLE 1: Service Request & Final Report Delivery & Client Acknowledgment
  // -------------------------------------------------------------
  console.log('>>> [1/5] Testing Lifecycle 1: Service Request, Report Delivery & Acknowledgment');
  const l1Steps = [];
  try {
    // 1.1 Client submits request
    const s1Submit = await api('POST', '/api/requests', sessions.CLIENT, {
      organization: 'منظمة أطباء بلا حدود (QA E2E Revalidation)',
      contactName: 'م. مروان القدسي',
      contactEmail: 'safety.officer@humanitarian-ngo.org',
      contactPhone: '+967 771 998877',
      priority: 'HIGH',
      description: 'طلب تقييم شامل لسلامة المنشأة الطبية وإعداد تقرير استراتيجي نهائي.',
    });
    const reqId = s1Submit.data?.request?.id || s1Submit.data?.id;
    const reqNum = s1Submit.data?.request?.requestNumber || s1Submit.data?.requestNumber;
    l1Steps.push({ step: '1.1_Client_Submit', status: s1Submit.status, ok: s1Submit.ok, reqId, reqNum });

    // 1.2 Admin reviews and approves
    const s1Approve = await api('PATCH', `/api/requests/${reqId}`, sessions.SUPER_ADMIN, {
      status: 'APPROVED',
      note: 'تمت الموافقة وتكليف المستشار الميداني لإعداد التقرير.',
      isClientVisible: true
    });
    l1Steps.push({ step: '1.2_Admin_Approve', status: s1Approve.status, ok: s1Approve.ok });

    // 1.3 Admin uploads / issues final report document
    const s1Doc = await api('POST', `/api/requests/${reqId}/documents`, sessions.SUPER_ADMIN, {
      title: 'التقرير النهائي لتقييم المخاطر الميدانية - معتمد',
      documentType: 'FINAL_REPORT',
      fileUrl: '/storage/reports/sample-final-report.pdf',
      fileSize: 1048576,
      mimeType: 'application/pdf',
      isClientVisible: true
    });
    const docId = s1Doc.data?.document?.id || s1Doc.data?.id;
    l1Steps.push({ step: '1.3_Admin_Issue_Final_Report', status: s1Doc.status, ok: s1Doc.ok, docId });

    // 1.4 Client views document and accepts/acknowledges
    let s1Accept = { status: 0, ok: false };
    if (docId) {
      s1Accept = await api('POST', `/api/portal/client/documents/${docId}/accept`, sessions.CLIENT, {
        notes: 'تم استلام التقرير النهائي والموافقة على التوصيات الواردة فيه رسمياً.'
      });
      l1Steps.push({ step: '1.4_Client_Acknowledge_Report', status: s1Accept.status, ok: s1Accept.ok });
    } else {
      l1Steps.push({ step: '1.4_Client_Acknowledge_Report', status: 'SKIPPED_NO_DOC_ID', ok: false });
    }

    // 1.5 Final Status COMPLETED
    const s1Complete = await api('PATCH', `/api/requests/${reqId}`, sessions.SUPER_ADMIN, {
      status: 'COMPLETED',
      note: 'تم إغلاق الطلب بنجاح بعد إقرار العميل للتقرير النهائي.'
    });
    l1Steps.push({ step: '1.5_Admin_Mark_Completed', status: s1Complete.status, ok: s1Complete.ok });

    const allOk = l1Steps.every(s => s.ok);
    results.lifecycle1_service_request = {
      classification: allOk ? 'FULL_PASS' : (l1Steps.some(s => s.ok) ? 'PARTIAL' : 'BLOCKED'),
      steps: l1Steps
    };
  } catch (err) {
    results.lifecycle1_service_request = { classification: 'BLOCKED', error: err.message, steps: l1Steps };
  }
  console.log('Result L1:', results.lifecycle1_service_request.classification);

  // -------------------------------------------------------------
  // LIFECYCLE 2: Field Incident Intake, AES-256 Encryption & Admin Triage
  // -------------------------------------------------------------
  console.log('\n>>> [2/5] Testing Lifecycle 2: Field Incident Submission & Triage');
  const l2Steps = [];
  try {
    // 2.1 Focal submits encrypted incident
    const s2Submit = await api('POST', '/api/incidents/intake', sessions.FIELD_FOCAL, {
      title: 'بلاغ أمني عاجل - دورة التحقق الشاملة E2E',
      incidentDate: new Date().toISOString(),
      governorate: 'ADEN',
      district: 'Al-Mansoura',
      category: 'PHYSICAL_ATTACK_THREAT',
      severity: 'WARNING_HIGH',
      summary: 'إغلاق أمني مفاجئ على المحور الشمالي لمنطقة المنصورة.',
      sourceType: 'FIELD_OFFICER',
      sourceName: 'الملازم أول كمال اليافعي',
      sourceContactPhone: '+967 775 001122',
      rawDescription: 'إحداثيات الموقع الحساس: 12.8211 N, 44.9922 E. تم تحويل مسار القوافل الإغاثية.',
      exactLatitude: 12.8211,
      exactLongitude: 44.9922
    });
    const incNumber = s2Submit.data?.incidentNumber;
    l2Steps.push({ step: '2.1_Focal_Submit_Incident', status: s2Submit.status, ok: s2Submit.ok, incNumber });

    // 2.2 Admin lists incidents and finds the submitted incident
    const s2List = await api('GET', '/api/admin/incidents', sessions.SUPER_ADMIN);
    const incidentObj = s2List.data?.incidents?.find(i => i.incidentNumber === incNumber);
    const incId = incidentObj?.id;
    l2Steps.push({ step: '2.2_Admin_Find_Incident', status: s2List.status, ok: !!incidentObj, incId, hasOriginal: incidentObj?.hasOriginal });

    // 2.3 Admin triages incident
    let s2Triage = { status: 0, ok: false };
    if (incId) {
      s2Triage = await api('PATCH', `/api/admin/incidents/${incId}`, sessions.SUPER_ADMIN, {
        status: 'TRIAGED',
        verificationNotes: 'تم التحقق من البلاغ بالتنسيق مع غرفة العمليات المشتركة واعتماد المسار البديل.'
      });
      l2Steps.push({ step: '2.3_Admin_Triage_Incident', status: s2Triage.status, ok: s2Triage.ok, triageStatus: s2Triage.data?.status || s2Triage.data?.incident?.status });
    } else {
      l2Steps.push({ step: '2.3_Admin_Triage_Incident', status: 'SKIPPED_NO_INC_ID', ok: false });
    }

    const allOk = l2Steps.every(s => s.ok);
    results.lifecycle2_field_incident = {
      classification: allOk ? 'FULL_PASS' : (l2Steps.some(s => s.ok) ? 'PARTIAL' : 'BLOCKED'),
      steps: l2Steps
    };
  } catch (err) {
    results.lifecycle2_field_incident = { classification: 'BLOCKED', error: err.message, steps: l2Steps };
  }
  console.log('Result L2:', results.lifecycle2_field_incident.classification);

  // -------------------------------------------------------------
  // LIFECYCLE 3: Training Registration, Attendance, Evaluation & Certificate Issuance
  // -------------------------------------------------------------
  console.log('\n>>> [3/5] Testing Lifecycle 3: Training Registration, Attendance & Certification');
  const l3Steps = [];
  try {
    // 3.1 Get available course
    const s3Courses = await api('GET', '/api/training/available-courses', sessions.TRAINEE);
    const course = s3Courses.data?.courses?.[0];
    const courseId = course?.id;
    l3Steps.push({ step: '3.1_Get_Available_Course', status: s3Courses.status, ok: !!courseId, courseId });

    // 3.2 Trainee registers for course
    let regId = null;
    if (courseId) {
      const s3Reg = await api('POST', '/api/training/register', sessions.TRAINEE, {
        courseId: courseId,
        notes: 'تسجيل في الدورة التدريبية - سيناريو إعادة التحقق E2E'
      });
      regId = s3Reg.data?.registration?.id || s3Reg.data?.id;
      l3Steps.push({ step: '3.2_Trainee_Register', status: s3Reg.status, ok: s3Reg.ok || s3Reg.status === 409, regId, alreadyRegistered: s3Reg.status === 409 });
    }

    // 3.3 Record attendance
    let s3Att = { status: 0, ok: false };
    if (courseId) {
      s3Att = await api('POST', `/api/admin/training/${courseId}/attendance`, sessions.SUPER_ADMIN, {
        records: [
          { traineeId: 'cmv43pvwl0007hkkzz8rokjhb', status: 'PRESENT', sessionDate: new Date().toISOString() }
        ]
      });
      l3Steps.push({ step: '3.3_Record_Attendance', status: s3Att.status, ok: s3Att.ok, data: s3Att.data });
    }

    // 3.4 Record evaluation
    let s3Eval = { status: 0, ok: false };
    if (courseId) {
      s3Eval = await api('POST', `/api/admin/training/${courseId}/evaluations`, sessions.SUPER_ADMIN, {
        evaluations: [
          { traineeId: 'cmv43pvwl0007hkkzz8rokjhb', score: 95, practicalRating: 'EXCELLENT', passed: true }
        ]
      });
      l3Steps.push({ step: '3.4_Record_Evaluation', status: s3Eval.status, ok: s3Eval.ok, data: s3Eval.data });
    }

    // 3.5 Check certificate verification
    const s3Cert = await api('GET', '/api/verify/VER-AICSFA-9921', null);
    l3Steps.push({ step: '3.5_Verify_Certificate', status: s3Cert.status, ok: s3Cert.ok && s3Cert.data?.valid === true, certData: s3Cert.data });

    const allOk = l3Steps.every(s => s.ok);
    results.lifecycle3_training_certification = {
      classification: allOk ? 'FULL_PASS' : (l3Steps.some(s => s.ok) ? 'PARTIAL' : 'BLOCKED'),
      steps: l3Steps
    };
  } catch (err) {
    results.lifecycle3_training_certification = { classification: 'BLOCKED', error: err.message, steps: l3Steps };
  }
  console.log('Result L3:', results.lifecycle3_training_certification.classification);

  // -------------------------------------------------------------
  // LIFECYCLE 4: Equipment Inventory, Handover & Custody Protocol
  // -------------------------------------------------------------
  console.log('\n>>> [4/5] Testing Lifecycle 4: Equipment Inventory & Handover Document');
  const l4Steps = [];
  try {
    // 4.1 Admin lists inventory
    const s4Inv = await api('GET', '/api/admin/equipment/inventory', sessions.SUPER_ADMIN);
    const items = s4Inv.data?.inventory || s4Inv.data?.items || [];
    l4Steps.push({ step: '4.1_Admin_Inventory', status: s4Inv.status, ok: s4Inv.ok, totalItems: items.length });

    // 4.2 Admin lists deliveries
    const s4Del = await api('GET', '/api/admin/equipment/deliveries', sessions.SUPER_ADMIN);
    const deliveries = s4Del.data?.deliveries || [];
    const delId = deliveries[0]?.id;
    l4Steps.push({ step: '4.2_Admin_Deliveries', status: s4Del.status, ok: s4Del.ok, totalDeliveries: deliveries.length, sampleDeliveryId: delId });

    // 4.3 Check Handover Protocol document generation
    let s4Handover = { status: 0, ok: false };
    if (delId) {
      s4Handover = await api('GET', `/api/admin/equipment/deliveries/${delId}/handover`, sessions.SUPER_ADMIN);
      l4Steps.push({ step: '4.3_Handover_Document', status: s4Handover.status, ok: s4Handover.ok, handover: s4Handover.data });
    } else {
      l4Steps.push({ step: '4.3_Handover_Document', status: 'SKIPPED_NO_DELIVERY', ok: false });
    }

    const allOk = l4Steps.every(s => s.ok);
    results.lifecycle4_equipment_handover = {
      classification: allOk ? 'FULL_PASS' : (l4Steps.some(s => s.ok) ? 'PARTIAL' : 'BLOCKED'),
      steps: l4Steps
    };
  } catch (err) {
    results.lifecycle4_equipment_handover = { classification: 'BLOCKED', error: err.message, steps: l4Steps };
  }
  console.log('Result L4:', results.lifecycle4_equipment_handover.classification);

  // -------------------------------------------------------------
  // LIFECYCLE 5: Research Publication, Strategic Review & Client-Only Restriction
  // -------------------------------------------------------------
  console.log('\n>>> [5/5] Testing Lifecycle 5: Research Publication Review & Access Restriction');
  const l5Steps = [];
  try {
    // 5.1 Admin creates / lists strategic research papers
    const s5AdminPubs = await api('GET', '/api/admin/research', sessions.SUPER_ADMIN);
    const adminPubs = s5AdminPubs.data?.publications || [];
    l5Steps.push({ step: '5.1_Admin_Research_List', status: s5AdminPubs.status, ok: s5AdminPubs.ok, totalPubs: adminPubs.length });

    // 5.2 Public lists research papers
    const s5PublicPubs = await api('GET', '/api/research', null);
    const publicPubs = s5PublicPubs.data?.publications || [];
    l5Steps.push({ step: '5.2_Public_Research_List', status: s5PublicPubs.status, ok: s5PublicPubs.ok, totalPublic: publicPubs.length });

    // 5.3 Client accesses restricted research papers
    const s5ClientPubs = await api('GET', '/api/portal/client/research', sessions.CLIENT);
    const clientPubs = s5ClientPubs.data?.publications || [];
    l5Steps.push({ step: '5.3_Client_Restricted_Research', status: s5ClientPubs.status, ok: s5ClientPubs.ok, totalClient: clientPubs.length });

    // 5.4 Verify access boundary: Public cannot access a CLIENT_ONLY research paper endpoint
    const clientOnlyPaper = clientPubs.find(p => p.accessLevel === 'CLIENT_ONLY') || clientPubs[0];
    let s5Boundary = { status: 0, ok: false };
    if (clientOnlyPaper) {
      s5Boundary = await api('GET', `/api/portal/client/research/${clientOnlyPaper.id}`, null); // Unauthenticated
      const isBlocked = s5Boundary.status === 401 || s5Boundary.status === 403;
      l5Steps.push({ step: '5.4_Public_Blocked_From_Client_Paper', status: s5Boundary.status, ok: isBlocked });
    }

    const allOk = l5Steps.every(s => s.ok);
    results.lifecycle5_research_lifecycle = {
      classification: allOk ? 'FULL_PASS' : (l5Steps.some(s => s.ok) ? 'PARTIAL' : 'BLOCKED'),
      steps: l5Steps
    };
  } catch (err) {
    results.lifecycle5_research_lifecycle = { classification: 'BLOCKED', error: err.message, steps: l5Steps };
  }
  console.log('Result L5:', results.lifecycle5_research_lifecycle.classification);

  // Save detailed classification output
  const outPath = path.join(__dirname, 'out', 'deep_e2e_classification.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
  console.log('\n=== Deep E2E Evaluation Complete! Results saved to:', outPath);
})();
