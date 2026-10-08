const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

if (process.env.ALLOW_DEMO_SEED !== 'true') {
  console.error('\n[SAFETY BLOCK]: Demo seeding is disabled in this Clean Release environment.');
  console.error('To verify or bootstrap system master configuration safely without test data, use:');
  console.error('  node scripts/bootstrap_initial.js\n');
  console.error('If you ever intentionally need to populate fake demo test data, run with:');
  console.error('  ALLOW_DEMO_SEED=true node scripts/seed.js\n');
  process.exit(1);
}

async function main() {
  console.log('--- Seeding AICSFA Database (PostgreSQL) ---');
  console.log('Aden International Center for Safety & Field Assessments');

  // Clear existing data (in reverse relation order)
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.serviceRequestNote.deleteMany();
  await prisma.serviceRequestDocument.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.service.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.trainingRegistration.deleteMany();
  await prisma.course.deleteMany();
  await prisma.courseCategory.deleteMany();
  await prisma.researchPublication.deleteMany();
  await prisma.researchCategory.deleteMany();
  await prisma.newsArticle.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.clientProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing data.');

  // Password hashes
  const adminPassword = await bcrypt.hash('Admin@AICSFA2026', 10);
  const servicePassword = await bcrypt.hash('Service@AICSFA2026', 10);
  const trainPassword = await bcrypt.hash('Train@AICSFA2026', 10);
  const researchPassword = await bcrypt.hash('Research@AICSFA2026', 10);
  const focalPassword = await bcrypt.hash('Focal@AICSFA2026', 10);
  const clientPassword = await bcrypt.hash('Client@AICSFA2026', 10);
  const traineePassword = await bcrypt.hash('Trainee@AICSFA2026', 10);

  // Users
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@facss-aden.com',
      passwordHash: adminPassword,
      fullName: 'الإدارة العليا لمركز عدن الدولي للسلامة',
      phone: '+967-770000001',
      organization: 'AICSFA Head Office',
      role: 'SUPER_ADMIN',
      isActive: true,
    }
  });

  const serviceManager = await prisma.user.create({
    data: {
      email: 'services@facss-aden.com',
      passwordHash: servicePassword,
      fullName: 'مدير العمليات والسلامة الميدانية',
      phone: '+967-770000002',
      organization: 'AICSFA Field Safety Operations',
      role: 'SERVICE_MANAGER',
      isActive: true,
    }
  });

  const trainingManager = await prisma.user.create({
    data: {
      email: 'training@facss-aden.com',
      passwordHash: trainPassword,
      fullName: 'مدير قطاع التدريب والسلامة الميدانية',
      phone: '+967-770000003',
      organization: 'AICSFA Safety Training Academy',
      role: 'TRAINING_MANAGER',
      isActive: true,
    }
  });

  const researchManager = await prisma.user.create({
    data: {
      email: 'research@facss-aden.com',
      passwordHash: researchPassword,
      fullName: 'رئيس وحدة الأبحاث والدراسات الميدانية',
      phone: '+967-770000004',
      organization: 'AICSFA Field Research Division',
      role: 'RESEARCH_MANAGER',
      isActive: true,
    }
  });

  const fieldFocalPoint = await prisma.user.create({
    data: {
      email: 'field.focal@facss-aden.com',
      passwordHash: focalPassword,
      fullName: 'أحمد ناصر العولقي (منسق ميداني)',
      phone: '+967-770000005',
      organization: 'AICSFA Field Coordination Unit',
      role: 'FIELD_FOCAL_POINT',
      isActive: true,
    }
  });

  const clientUser = await prisma.user.create({
    data: {
      email: 'safety.officer@humanitarian-ngo.org',
      passwordHash: clientPassword,
      fullName: 'طارق المنصوري (مسؤول السلامة الميدانية)',
      phone: '+967-771122334',
      organization: 'الهيئة الإنسانية للإغاثة والتنمية',
      role: 'CLIENT',
      isActive: true,
      clientProfile: {
        create: {
          companyName: 'الهيئة الإنسانية للإغاثة والتنمية',
          sector: 'المنظمات الإنسانية والتنموية',
          taxNumber: 'NGO-YE-44210',
          address: 'عدن - خور مكسر - حي السفارات',
          accountStatus: 'ACTIVE',
        }
      }
    }
  });

  const traineeUser = await prisma.user.create({
    data: {
      email: 'trainee@facss-aden.com',
      passwordHash: traineePassword,
      fullName: 'سالم محمد ناصر البكري',
      phone: '+967-775544332',
      organization: 'طاقم عمل ميداني إنساني',
      role: 'TRAINEE',
      isActive: true,
    }
  });

  console.log('Users and Profiles created.');

  // System Settings
  const settings = [
    { key: 'site_name_ar', value: 'مركز عدن الدولي للسلامة والدراسات الميدانية', category: 'GENERAL' },
    { key: 'site_name_en', value: 'Aden International Center for Safety and Field Assessments', category: 'GENERAL' },
    { key: 'site_acronym', value: 'AICSFA', category: 'GENERAL' },
    { key: 'slogan_ar', value: '«دعم سلامة العاملين في المجال الإنساني وتعزيز الوصول الآمن»', category: 'BRANDING' },
    { key: 'slogan_en', value: 'Supporting Humanitarian Safety & Enabling Secure Field Access', category: 'BRANDING' },
    { key: 'subtitle_ar', value: 'تقييم المخاطر الميدانية، التدريب المتخصص على السلامة وإدارة الأزمات، والمسوحات والأبحاث الميدانية الموثوقة', category: 'BRANDING' },
    { key: 'subtitle_en', value: 'Field risk assessments, specialized safety & crisis training, and evidence-based field surveys', category: 'BRANDING' },
    { key: 'contact_email', value: 'info@facss-aden.com', category: 'CONTACT' },
    { key: 'contact_phone', value: '+967 2 245 800', category: 'CONTACT' },
    { key: 'contact_address_ar', value: 'العاصمة عدن - خور مكسر - حي السفارات', category: 'CONTACT' },
    { key: 'contact_address_en', value: 'Aden, Khormaksar, Diplomatic Quarter, Republic of Yemen', category: 'CONTACT' },
    { key: 'website_url', value: 'www.facss-aden.com', category: 'CONTACT' },
    { key: 'social_facebook', value: 'https://facebook.com', category: 'SOCIAL' },
    { key: 'social_twitter', value: 'https://twitter.com', category: 'SOCIAL' },
    { key: 'social_linkedin', value: 'https://linkedin.com', category: 'SOCIAL' },
    { key: 'social_whatsapp', value: '+967770000001', category: 'SOCIAL' },
  ];

  for (const s of settings) {
    await prisma.systemSetting.create({ data: s });
  }

  // Service Categories
  const catOperational = await prisma.serviceCategory.create({
    data: {
      titleAr: 'تقييم المخاطر والسلامة الميدانية',
      titleEn: 'Field Safety & Risk Assessment Services',
      slug: 'field-safety-and-risk-assessments',
      icon: 'ShieldCheck',
      order: 1,
    }
  });

  const catCapacity = await prisma.serviceCategory.create({
    data: {
      titleAr: 'التدريب وبناء القدرات الميدانية',
      titleEn: 'Field Training & Capacity Building',
      slug: 'field-training-capacity-building',
      icon: 'GraduationCap',
      order: 2,
    }
  });

  const catResearch = await prisma.serviceCategory.create({
    data: {
      titleAr: 'الأبحاث والمسوحات الميدانية الإنسانية',
      titleEn: 'Humanitarian Field Research & Surveys',
      slug: 'humanitarian-field-research-surveys',
      icon: 'FileText',
      order: 3,
    }
  });

  // Services
  const sCompoundAssessment = await prisma.service.create({
    data: {
      categoryId: catOperational.id,
      titleAr: 'تقييم السلامة والأمان للمقرات والمرافق الميدانية',
      titleEn: 'Field Compound & Facility Safety Assessment',
      slug: 'field-compound-safety-assessment',
      shortDescAr: 'تقييم شامل للسلامة الإنشائية والفيزيائية لمقرات المنظمات والمراكز التابعة لها وتحصين بيئة العمل الإنساني.',
      shortDescEn: 'Comprehensive safety and physical audit for humanitarian compounds, hubs, and field premises.',
      fullDescAr: 'تقييمٌ شاملٌ ومتخصص لسلامة المرافق والمكاتب ومستودعات التخزين الإنسانية، يشمل تدقيق نقاط الوصول، إجراءات التحصين، خطط الإخلاء، ومخارج الطوارئ، مع توفير تقرير استشاري وخطة معالجة الثغرات لضمان سلامة الطواقم.',
      fullDescEn: 'Rigorous safety evaluation of humanitarian offices, distribution centers, and warehouses, covering access points, physical fortification, evacuation plans, and risk mitigation matrices.',
      featuresAr: JSON.stringify([
        'فحص متانة محيط المنشأة ونقاط الدخول والتحكم في الوصول',
        'تقييم خطط الإخلاء الآمن وتوزيع مخارج ومعدات الطوارئ',
        'مراجعة وتدقيق معايير السلامة المهنية ومكافحة الحرائق',
        'إعداد مصفوفة معالجة المخاطر وتحديد الأولويات العاجلة',
        'إصدار تقرير تقييم ميداني شامل ومعتمد للمنظمة'
      ]),
      featuresEn: JSON.stringify([
        'Perimeter & Access Control Resilience Inspection',
        'Emergency Evacuation Protocols & Exit Auditing',
        'Occupational Safety & Fire Hazard Verification',
        'Prioritized Vulnerability Remediation Matrix',
        'Certified Field Assessment Report Delivery'
      ]),
      targetSectorsAr: JSON.stringify(['المنظمات الدولية غير الحكومية (INGOs)', 'وكالات الأمم المتحدة', 'المؤسسات الإغاثية والتنموية', 'المستشفيات والمراكز الصحية الميدانية']),
      targetSectorsEn: JSON.stringify(['International NGOs', 'UN Agencies', 'Relief & Development Foundations', 'Field Health Centers & Hospitals']),
      processAr: JSON.stringify(['مسح ميداني ومعاينة المقر', 'تحليل المخاطر المباشرة والبيئية', 'صياغة التقرير والتوصيات الوقائية', 'تسليم التقرير النهائي المعتمد']),
      processEn: JSON.stringify(['On-Site Compound Reconnaissance', 'Direct & Environmental Hazard Analysis', 'Drafting Recommendations & Mitigation Matrix', 'Final Certified Report Delivery']),
      icon: 'Building2',
      order: 1,
    }
  });

  const sRouteAssessment = await prisma.service.create({
    data: {
      categoryId: catOperational.id,
      titleAr: 'تقييم المسارات والوصول الميداني الآمن',
      titleEn: 'Safe Access & Route Security Assessment',
      slug: 'humanitarian-access-route-assessment',
      shortDescAr: 'دراسة وتقييم مسارات التحرك الميداني وتحديد مستويات المخاطر للبعثات والفرق الإغاثية.',
      shortDescEn: 'Systematic evaluation of travel corridors, transit checkpoints, and access feasibility for relief convoys.',
      fullDescAr: 'نوفّر تحليلاً ميدانياً شاملاً لمسارات التحرك وقوافل الإغاثة الإنسانية، متضمناً تقييم نقاط التماس والعبور، وتحديد المسارات البديلة، وتقديم إرشادات السلامة الاستباقية للفرق العاملة على الأرض.',
      fullDescEn: 'Comprehensive field analysis of transit routes and humanitarian convoys, detailing checkpoints, alternate routes, hazard alerts, and real-time safety advisories.',
      featuresAr: JSON.stringify([
        'تحليل مخاطر الطرق والمسارات البديلة للقوافل الإنسانية',
        'تقييم نقاط التفتيش والتنسيق الميداني المسبق',
        'رسم خرائط مناطق الخطر وتحديث تصنيفات الوصول الجغرافي',
        'إرشادات السلامة لقوافل المساعدات وفرق العمل الميداني'
      ]),
      featuresEn: JSON.stringify([
        'Humanitarian Route Risk & Alternative Corridor Analysis',
        'Checkpoint Assessment & Advance Field Coordination',
        'Access Classification & Threat Zone Mapping',
        'Convoy Safety Protocols & Travel Briefings'
      ]),
      targetSectorsAr: JSON.stringify(['المنظمات الإغاثية والإنسانية', 'فرق الاستجابة السريعة', 'البعثات الميدانية المستقلة']),
      targetSectorsEn: JSON.stringify(['Humanitarian Relief Organizations', 'Rapid Response Teams', 'Field Missions']),
      processAr: JSON.stringify(['تحديد المسار والوجهة الميدانية', 'جمع البيانات الميدانية وتحليل النقاط الحرجة', 'وضع خطة التحرك والمسارات البديلة', 'تقديم موجز السلامة والتوجيهات الميدانية']),
      processEn: JSON.stringify(['Route Definition & Destination Scoping', 'Field Data Collection & Critical Point Analysis', 'Corridor & Alternative Route Mapping', 'Safety Briefing & Operational Guidance']),
      icon: 'Route',
      order: 2,
    }
  });

  const sSafetyTraining = await prisma.service.create({
    data: {
      categoryId: catCapacity.id,
      titleAr: 'تدريب السلامة الميدانية للعاملين في المجال الإنساني (HEAT)',
      titleEn: 'Field Safety & HEAT Training for Humanitarian Workers',
      slug: 'humanitarian-field-safety-training',
      shortDescAr: 'برامج تدريبية متخصصة تشمل تدريب السلوك في البيئات عالية المخاطر (HEAT) والإسعافات الميدانية الأولية.',
      shortDescEn: 'Specialized field safety modules including Hostile Environment Awareness Training (HEAT) and emergency trauma response.',
      fullDescAr: 'برامج تدريبية عملية وتطبيقية متخصصة تؤهل الكوادر الإنسانية للتعامل مع المخاطر الميدانية، إدارة نقاط التفتيش، التصرف في حالات الاحتجاز أو الطوارئ المفاجئة، والإسعافات الأولية المنقذة للحياة.',
      fullDescEn: 'Practical simulation-based training preparing humanitarian cadres for hazardous environments, checkpoint navigation, critical incident stress management, and tactical trauma first aid.',
      featuresAr: JSON.stringify([
        'التدريب على السلوك الآمن في البيئات عالية المخاطر (HEAT)',
        'إدارة نقاط التفتيش والتفاوض الإنساني في نقاط الوصول',
        'الإسعافات الأولية الميدانية ورعاية الإصابات الطارئة',
        'خطط الإخلاء في حالات الطوارئ وإدارة الأزمات',
        'إصدار شهادات كفاءة تدريبية معتمدة وقابلة للتحقق الرقمي'
      ]),
      featuresEn: JSON.stringify([
        'Hostile Environment Awareness Training (HEAT Simulation)',
        'Checkpoint Management & Field Humanitarian Negotiation',
        'Field Trauma First Aid & Immediate Life Support',
        'Emergency Evacuation Protocols & Crisis Handling',
        'Digital Verifiable Certification Issuance'
      ]),
      targetSectorsAr: JSON.stringify(['منظمات المجتمع المدني', 'الفرق الإنسانية الميدانية', 'المنظمات الدولية', 'العاملون في الرعاية الصحية الطارئة']),
      targetSectorsEn: JSON.stringify(['Civil Society Organizations', 'Humanitarian Field Staff', 'International NGOs', 'Emergency Health Workers']),
      processAr: JSON.stringify(['تقييم الاحتياج التدريبي للجهة', 'تصميم سيناريوهات المحاكاة الميدانية', 'التنفيذ العملي والتقييم الفردي', 'إصدار الشهادات والتقييم الختامي']),
      processEn: JSON.stringify(['Institutional Needs Scoping', 'Field Simulation Scenario Design', 'Practical Delivery & Trainee Assessment', 'Certification & Final Debrief']),
      icon: 'GraduationCap',
      order: 3,
    }
  });

  const sRiskAnalysis = await prisma.service.create({
    data: {
      categoryId: catResearch.id,
      titleAr: 'تحليل المخاطر الميدانية ورسم خرائط التهديد',
      titleEn: 'Field Risk Analysis & Threat Mapping',
      slug: 'field-risk-analysis-and-threat-mapping',
      shortDescAr: 'تحليل استباقي وممنهج للبيئة التشغيلية ومصفوفات التهديد لدعم اتخاذ القرار الإنساني.',
      shortDescEn: 'Proactive operational environment analysis and threat matrices enabling evidence-based humanitarian decision-making.',
      fullDescAr: 'تحليلٌ استباقي مُعمَّق للمتغيرات الميدانية والبيئة التشغيلية، يتضمن إصدار مصفوفات المخاطر، وخرائط التهديدات، وتحديد مؤشرات الإنذار المبكر لدعم استمرارية العمليات الإنسانية والتنموية.',
      fullDescEn: 'Proactive and methodological analysis of operating environments, producing qualitative risk matrices, hazard heatmaps, and early warning indicators to sustain humanitarian access.',
      featuresAr: JSON.stringify([
        'مصفوفات تقييم المخاطر الميدانية والتهديدات السياقية',
        'خرائط الوصول الآمن وتوزيع مناطق التوتر والحوادث',
        'مؤشرات الإنذار المبكر والتقارير الرصدية الموجزة',
        'توصيات عملية لدعم التخطيط التشغيلي واستمرارية البرامج'
      ]),
      featuresEn: JSON.stringify([
        'Contextual Threat & Field Risk Assessment Matrices',
        'Access Feasibility & Incident Heatmaps',
        'Early Warning Indicators & Rapid Operational Alerts',
        'Actionable Planning Recommendations for Program Continuity'
      ]),
      targetSectorsAr: JSON.stringify(['صناع القرار في البعثات الإنسانية', 'المنظمات التنموية والدولية', 'الهيئات الاستشارية المانحة']),
      targetSectorsEn: JSON.stringify(['Humanitarian Decision Makers', 'Development Agencies & INGOs', 'Donor Advisory Bodies']),
      processAr: JSON.stringify(['رصد المؤشرات وجمع البيانات الميدانية', 'تحليل المعطيات ومقارنة السيناريوهات', 'بناء مصفوفة المخاطر والخرائط', 'تسليم التقرير التحليلي للجهة']),
      processEn: JSON.stringify(['Field Indicator Monitoring & Scoping', 'Data Triangulation & Scenario Modeling', 'Risk Matrix & Map Generation', 'Analytical Report Briefing Delivery']),
      icon: 'TrendingUp',
      order: 4,
    }
  });

  console.log('Services seeded.');

  // Course Categories
  const cCatHumanitarian = await prisma.courseCategory.create({
    data: {
      titleAr: 'برامج سلامة العاملين في المجال الإنساني',
      titleEn: 'Humanitarian Field Safety Programs',
      slug: 'humanitarian-safety-programs',
    }
  });

  const cCatEmergency = await prisma.courseCategory.create({
    data: {
      titleAr: 'السلامة الميدانية وإدارة الطوارئ',
      titleEn: 'Field Safety & Emergency Management',
      slug: 'field-safety-emergency',
    }
  });

  const course1 = await prisma.course.create({
    data: {
      categoryId: cCatHumanitarian.id,
      titleAr: 'دورة تدريب السلامة في البيئات الميدانية عالية المخاطر (HEAT Basic)',
      titleEn: 'Hostile Environment Awareness Training (HEAT Basic)',
      slug: 'heat-field-safety-training',
      descriptionAr: 'برنامج محاكاة تدريبي مكثف لطواقم العمل الإنساني يغطي التخطيط للتحركات الميدانية، وإدارة نقاط التفتيش، والتعامل مع الحوادث غير المتوقعة، والتفاوض الإنساني في نقاط الوصول.',
      descriptionEn: 'Intensive simulation-based program for aid workers covering movement planning, checkpoint management, emergency stress protocols, and field humanitarian negotiation.',
      trainerName: 'خبراء سلامة معتمدون بمركز عدن الدولي للسلامة (AICSFA Lead Instructors)',
      duration: '4 أيام (32 ساعة تدريبية تطبيقية)',
      location: 'مركز التدريب الميداني التابع لـ AICSFA - عدن',
      capacity: 20,
      hasCertificate: true,
      status: 'OPEN',
      requirementsAr: 'العاملون في المنظمات الإنسانية والفرق الميدانية، اللياقة البدنية المناسبة للتدريبات الميدانية.',
      requirementsEn: 'Active humanitarian and field development workers, suitable physical fitness for practical drills.',
    }
  });

  const course2 = await prisma.course.create({
    data: {
      categoryId: cCatEmergency.id,
      titleAr: 'الإسعافات الأولية الميدانية وإدارة الإصابات الرضحية',
      titleEn: 'Field First Aid & Trauma Care for Humanitarian Workers',
      slug: 'field-first-aid-trauma-response',
      descriptionAr: 'تدريب عملي تطبيقي على رعاية الإصابات والإخلاء الطبي الميداني في المناطق النائية ومحدودة الموارد قبل وصول الرعاية المتخصصة.',
      descriptionEn: 'Hands-on trauma response, patient stabilization, and remote evacuation techniques in resource-constrained field settings.',
      trainerName: 'مدربون متخصصون في طب الطوارئ والرعاية الميدانية',
      duration: '3 أيام (24 ساعة تدريبية)',
      location: 'قاعات المحاكاة الطبية بمركز AICSFA - عدن',
      capacity: 25,
      hasCertificate: true,
      status: 'OPEN',
      requirementsAr: 'مفتوح لكافة العاملين والمنسقين الميدانيين وفرق الإغاثة.',
      requirementsEn: 'Open to all field workers, relief coordinators, and mission logistics staff.',
    }
  });

  console.log('Courses seeded.');

  // Trainee Registration & Certificate
  const reg1 = await prisma.trainingRegistration.create({
    data: {
      courseId: course1.id,
      userId: traineeUser.id,
      fullName: traineeUser.fullName,
      nationalId: '1020304050',
      email: traineeUser.email,
      phone: traineeUser.phone || '',
      qualification: 'بكالوريوس تنمية وإغاثة إنسانية',
      status: 'COMPLETED',
      adminNotes: 'أتم الدورة بتفوق واجتاز التدريب العملي والمحاكاة الميدانية.',
    }
  });

  await prisma.attendanceRecord.createMany({
    data: [
      { registrationId: reg1.id, sessionDate: new Date('2026-08-01'), status: 'PRESENT', notes: 'حضور كامل وتفاعل متميز في تخطيط التحرك' },
      { registrationId: reg1.id, sessionDate: new Date('2026-08-08'), status: 'PRESENT', notes: 'اجتياز محاكاة التعامل مع نقاط التفتيش' },
      { registrationId: reg1.id, sessionDate: new Date('2026-08-15'), status: 'PRESENT', notes: 'تطبيق عملي لمهارات الإسعاف الميداني' },
      { registrationId: reg1.id, sessionDate: new Date('2026-08-22'), status: 'PRESENT', notes: 'المحاكاة الختامية الشاملة' },
    ]
  });

  await prisma.certificate.create({
    data: {
      certificateNumber: 'AICSFA-CERT-2026-00108',
      registrationId: reg1.id,
      studentName: traineeUser.fullName,
      courseTitle: course1.titleAr,
      issueDate: new Date('2026-08-25'),
      grade: 'ممتاز (Distinction)',
      verificationCode: 'VER-AICSFA-9921',
      pdfPath: '/uploads/certificates/cert_00108.pdf',
    }
  });

  console.log('Trainee registration and certificate created.');

  // Research Publications
  const rCat1 = await prisma.researchCategory.create({
    data: {
      titleAr: 'دراسات السلامة والوصول الإنساني',
      titleEn: 'Safety & Humanitarian Access Studies',
      slug: 'safety-and-humanitarian-access',
    }
  });

  const rCat2 = await prisma.researchCategory.create({
    data: {
      titleAr: 'تقارير الرصد الميداني الدورية',
      titleEn: 'Periodic Field Monitoring Reports',
      slug: 'periodic-field-reports',
    }
  });

  await prisma.researchPublication.create({
    data: {
      categoryId: rCat1.id,
      titleAr: 'محددات الوصول الإنساني الآمن وتأثيراتها على إيصال المساعدات في المحافظات الجنوبية',
      titleEn: 'Determinants of Safe Humanitarian Access and Aid Delivery Dynamics in Southern Governorates',
      slug: 'humanitarian-safe-access-southern-governorates',
      author: 'وحدة الأبحاث والمسوحات الميدانية بمركز عدن الدولي للسلامة (AICSFA)',
      summaryAr: 'دراسة تحليلية ميدانية تتناول التحديات التي تواجه المنظمات الإنسانية في الوصول إلى المجتمعات الأشد ضعفاً، مع تقديم توصيات عملية للتنسيق وتحسين مسارات العبور الآمن.',
      summaryEn: 'An analytical field study exploring safe access challenges for humanitarian aid actors in remote communities, offering actionable recommendations for secure field coordination.',
      contentAr: 'تُمثّل هذه الدراسة قراءة متعمقة مبنية على الرصد الميداني المباشر والمعطيات الموثقة التي يجمعها فريق مركز عدن الدولي للسلامة والدراسات الميدانية... يُعد التنسيق المبكر وفهم التوازنات المجتمعية المحلية الركيزة الأساسية لضمان الوصول الآمن واستمرارية تقديم الإغاثة دون تعطيل.',
      contentEn: 'This study presents an in-depth reading grounded in firsthand field observation and validated data compiled by AICSFA teams... Early coordination and community acceptance constitute the primary bedrock of enabling sustained humanitarian access.',
      visibility: 'PUBLIC',
      isFeatured: true,
      viewsCount: 1420,
    }
  });

  await prisma.researchPublication.create({
    data: {
      categoryId: rCat1.id,
      titleAr: 'دليل المعايير الوقائية لسلامة مقرات ومخازن المنظمات الإنسانية',
      titleEn: 'Preventive Safety Standards Guide for Humanitarian Compound and Warehouse Security',
      slug: 'humanitarian-compound-safety-standards-guide',
      author: 'فريق السلامة والتقييم الميداني (AICSFA)',
      summaryAr: 'دليل منهجي يُحدد الركائز الوقائية لتأمين مقرات المنظمات والمراكز التابعة لها ومخازن الإمداد، وتعزيز الجاهزية للطوارئ.',
      summaryEn: 'A methodological guide setting preventive standards for humanitarian offices, hub facilities, and storage compounds.',
      contentAr: 'السلامة في العمل الإنساني ترتكز على مبدأ الاستباق والوقاية. يستعرض هذا الدليل خطوات التقييم الفيزيائي لمقرات العمل الميداني، وضمان سلامة الطواقم وحماية الأصول الإغاثية.',
      contentEn: 'Safety in humanitarian action is founded upon proactive prevention. This guide explores compound assessment procedures and facility resilience protocols.',
      visibility: 'PUBLIC',
      isFeatured: true,
      viewsCount: 980,
    }
  });

  await prisma.researchPublication.create({
    data: {
      categoryId: rCat2.id,
      titleAr: 'التقرير الميداني الدوري (العدد الأول): تقييم مخاطر المسارات الميدانية والتحديات اللوجستية',
      titleEn: 'Periodic Field Report (Issue 1): Field Route Risk Assessment and Humanitarian Logistics Challenges',
      slug: 'periodic-field-report-issue-1',
      author: 'هيئة الرصد والتحليل الميداني (AICSFA)',
      summaryAr: 'تقرير رصدي دوري موجه لمنظمات الإغاثة والجهات الشريكة، يتضمن مصفوفة مخاطر شهرية لمسارات النقل والتوزيع الميداني.',
      summaryEn: 'Periodic monitoring report dedicated to humanitarian partners, featuring monthly transit risk matrices and operational access alerts.',
      contentAr: 'تقرير تحليلي دوري يوثق المستجدات الميدانية المؤثرة على حركة القوافل الإغاثية والفرق الإنسانية، متضمناً قراءات تفصيلية لخرائط الوصول ونقاط التماس.',
      contentEn: 'Periodic report reviewing field dynamics impacting humanitarian transport and aid personnel mobility across critical transit corridors.',
      visibility: 'CLIENT_ONLY',
      isFeatured: false,
      viewsCount: 310,
    }
  });

  console.log('Research publications seeded.');

  // News
  await prisma.newsArticle.create({
    data: {
      titleAr: 'مركز عدن الدولي للسلامة والدراسات الميدانية (AICSFA) يطلق برامج تدريب السلامة الميدانية للفرق الإنسانية',
      titleEn: 'AICSFA Launches Specialized Field Safety Training for Humanitarian Teams',
      slug: 'aicsfa-launches-humanitarian-safety-training',
      summaryAr: 'دشّن المركز حزمة من البرامج التدريبية الموجهة للعاملين في المنظمات الإغاثية والتنموية لتعزيز السلامة أثناء أداء المهام الميدانية في البيئات المعقدة.',
      summaryEn: 'AICSFA commenced specialized training modules empowering humanitarian field workers with vital safety and crisis navigation capabilities.',
      contentAr: 'انطلاقاً من رسالة المركز الهادفة إلى حماية الكوادر الإنسانية وتيسير الوصول الآمن للمساعدات، بدأت المنظومة التدريبية استقبال الدفعات الأولى من منسقي وموظفي المنظمات غير الحكومية في العاصمة عدن.',
      contentEn: 'Driven by its mission to safeguard humanitarian personnel and facilitate unhindered aid delivery, AICSFA began training NGO coordinators in Aden.',
      author: 'المكتب الإعلامي لمركز عدن الدولي للسلامة',
      category: 'أخبار المركز',
      status: 'PUBLISHED',
    }
  });

  await prisma.newsArticle.create({
    data: {
      titleAr: 'شراكات ميدانية لتعزيز وصول المساعدات وتقييم سلامة المراكز المجتمعية في المناطق النائية',
      titleEn: 'Field Partnerships to Enhance Aid Delivery & Assess Community Centers in Remote Areas',
      slug: 'field-partnerships-aid-access-remote-areas',
      summaryAr: 'أبرم المركز تفاهمات عمل مشتركة مع عدد من الشركاء التنمويين لإجراء مسوحات ميدانية وتقييمات سلامة للمنشآت الخدمية ومخازن التوزيع.',
      summaryEn: 'AICSFA established operational collaboration with humanitarian partners to conduct field safety evaluations of distribution facilities.',
      contentAr: 'تأتي هذه الخطوة استجابة لاحتياجات الفرق الإغاثية العاملة على الأرض، عبر تقديم دراسات سلامة للمقرات الميدانية وتحديث خرائط المخاطر بشكل دوري وموثوق.',
      contentEn: 'This initiative responds to field realities by delivering robust compound assessments and up-to-date hazard mappings to sustain vital operations.',
      author: 'إدارة التنسيق والعلاقات الميدانية',
      category: 'شراكات وتنسيق',
      status: 'PUBLISHED',
    }
  });

  console.log('News articles seeded.');

  // Sample Service Request for client
  const sReq = await prisma.serviceRequest.create({
    data: {
      requestNumber: 'AICSFA-SR-2026-000101',
      userId: clientUser.id,
      serviceId: sCompoundAssessment.id,
      organization: 'الهيئة الإنسانية للإغاثة والتنمية',
      contactName: 'طارق المنصوري',
      contactEmail: 'safety.officer@humanitarian-ngo.org',
      contactPhone: '+967-771122334',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      description: 'طلب تقييم السلامة والأمان لمقر البعثة ومركز توزيع المواد الإغاثية ومستودعات التخزين في العاصمة عدن.',
      assignedEmployeeId: serviceManager.id,
    }
  });

  await prisma.serviceRequestNote.create({
    data: {
      requestId: sReq.id,
      authorId: serviceManager.id,
      authorName: serviceManager.fullName,
      note: 'تم إنجاز المسح الميداني الأولي بنجاح وجارٍ إعداد مصفوفة معالجة المخاطر ومسودة تقرير التقييم الميداني للجهة.',
      isClientVisible: true,
    }
  });

  await prisma.serviceRequestNote.create({
    data: {
      requestId: sReq.id,
      authorId: serviceManager.id,
      authorName: serviceManager.fullName,
      note: 'ملاحظة إدارية داخلية: تم التنسيق مع فريق المسح الفني لزيارة مستودع التخزين الفرعي يوم الثلاثاء القادم.',
      isClientVisible: false,
    }
  });

  await prisma.notification.create({
    data: {
      userId: clientUser.id,
      titleAr: 'تحديث حالة طلب التقييم الميداني',
      titleEn: 'Field Assessment Request Status Updated',
      messageAr: 'طلبكم رقم AICSFA-SR-2026-000101 قيد التنفيذ والمتابعة الميدانية من قبل فريق العمليات.',
      messageEn: 'Your request AICSFA-SR-2026-000101 is currently IN_PROGRESS under active field assessment.',
      type: 'INFO',
      link: '/portal/client/requests',
    }
  });

  // Contact Message sample
  await prisma.contactMessage.create({
    data: {
      name: 'مكتب منظمة الصحة والتغذية الإنسانية',
      email: 'operations@health-ngo.example.org',
      phone: '+967-773344556',
      organization: 'منظمة الصحة والتغذية الإنسانية',
      subject: 'استفسار بشأن دورة السلامة الميدانية (HEAT) لفرق العمل',
      message: 'نود الاستفسار عن جدول دورات تدريب السلامة الميدانية وإمكانية تسجيل 12 من منسقي العمليات الميدانية في الدورة القادمة.',
      status: 'UNREAD',
    }
  });

  console.log('--- Seeding Completed Successfully! ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
