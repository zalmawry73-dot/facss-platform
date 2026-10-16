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

(async () => {
  console.log('=== RETEST: TC-019 & TC-020 (Field Incident Intake & Admin Visibility) ===');
  
  // 1. Login FIELD_FOCAL_POINT
  const focalLogin = await loginUser('field.focal@facss-aden.com', 'Focal@AICSFA2026');
  console.log('Focal Login Status:', focalLogin.status, 'Cookie exists?', !!focalLogin.cookie);

  if (!focalLogin.cookie) {
    throw new Error('Could not log in FIELD_FOCAL_POINT');
  }

  // 2. Submit incident payload
  const incidentPayload = {
    title: 'بلاغ أمني ميداني تجريبي معزول - إعادة اختبار الجودة',
    incidentDate: new Date().toISOString(),
    governorate: 'ADEN',
    district: 'Craiter',
    category: 'PHYSICAL_ATTACK_THREAT',
    severity: 'WARNING_HIGH',
    summary: 'تم رصد تحركات مشبوهة في المحيط الأمني للمنشأة أثناء دورية المراقبة المسائية.',
    sourceType: 'COMMUNITY_INFORMANT',
    sourceName: 'مصدر محلي موثوق #77',
    sourceContactPhone: '+967-770001122',
    rawDescription: 'تقرير تفصيلي سري مشفر يتضمن إحداثيات الموقع الحساس وملاحظات تقييم المخاطر الميدانية.',
    exactLocationDesc: 'القطاع الشرقي بالقرب من نقطة التفتيش الفرعية',
    exactLatitude: 12.7855,
    exactLongitude: 45.0187,
    initialRiskNotes: 'يوصى بتكثيف الدوريات الميدانية وتنبيه فرق العمليات.'
  };

  const submitRes = await fetch(`${BASE}/api/incidents/intake`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': focalLogin.cookie
    },
    body: JSON.stringify(incidentPayload)
  });

  const submitStatus = submitRes.status;
  const submitData = await submitRes.json();
  console.log('TC-019: Submit Incident Response Status:', submitStatus);
  console.log('TC-019: Response Payload:', JSON.stringify(submitData, null, 2));

  const isTc19Pass = submitStatus === 201 || (submitStatus === 200 && submitData.success);
  console.log('>>> TC-019 Retest Result:', isTc19Pass ? 'PASS' : 'FAIL');

  const createdNumber = submitData.incidentNumber;
  console.log('Created Incident Number:', createdNumber);

  // 3. Login SUPER_ADMIN
  const adminLogin = await loginUser('admin@facss-aden.com', 'Admin@AICSFA2026');
  console.log('Admin Login Status:', adminLogin.status, 'Cookie exists?', !!adminLogin.cookie);

  // 4. Query Admin Incidents list
  const listRes = await fetch(`${BASE}/api/admin/incidents`, {
    headers: { 'Cookie': adminLogin.cookie }
  });
  const listStatus = listRes.status;
  const listData = await listRes.json();
  console.log('TC-020: Admin Incidents List Status:', listStatus);
  
  const incidents = listData.incidents || [];
  console.log('Total incidents retrieved by Admin:', incidents.length);
  
  const found = incidents.find(inc => inc.incidentNumber === createdNumber);
  console.log('Created incident visible in Admin list?', !!found);
  if (found) {
    console.log('Found incident details in Admin:', {
      id: found.id,
      incidentNumber: found.incidentNumber,
      status: found.status,
      governorate: found.governorate,
      category: found.category
    });
  }

  const isTc20Pass = listStatus === 200 && !!found;
  console.log('>>> TC-020 Retest Result:', isTc20Pass ? 'PASS' : 'FAIL');

  console.log(JSON.stringify({
    retest_date: new Date().toISOString(),
    TC_019: { status: isTc19Pass ? 'PASS' : 'FAIL', httpStatus: submitStatus, incidentNumber: createdNumber },
    TC_020: { status: isTc20Pass ? 'PASS' : 'FAIL', httpStatus: listStatus, foundInList: !!found, incidentNumber: createdNumber }
  }));
})();
