const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding FACSS Database (PostgreSQL) ---');

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
  const adminPassword = await bcrypt.hash('Admin@FACSS2026', 10);
  const servicePassword = await bcrypt.hash('Service@FACSS2026', 10);
  const trainPassword = await bcrypt.hash('Train@FACSS2026', 10);
  const researchPassword = await bcrypt.hash('Research@FACSS2026', 10);
  const clientPassword = await bcrypt.hash('Client@FACSS2026', 10);
  const traineePassword = await bcrypt.hash('Trainee@FACSS2026', 10);

  // Users
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@facss-aden.com',
      passwordHash: adminPassword,
      fullName: 'الإدارة العليا لمركز عدن الأول',
      phone: '+967-770000001',
      organization: 'FACSS Head Office',
      role: 'SUPER_ADMIN',
      isActive: true,
    }
  });

  const serviceManager = await prisma.user.create({
    data: {
      email: 'services@facss-aden.com',
      passwordHash: servicePassword,
      fullName: 'مدير العمليات والخدمات الأمنية',
      phone: '+967-770000002',
      organization: 'FACSS Security Operations',
      role: 'SERVICE_MANAGER',
      isActive: true,
    }
  });

  const trainingManager = await prisma.user.create({
    data: {
      email: 'training@facss-aden.com',
      passwordHash: trainPassword,
      fullName: 'مدير قطاع التدريب والتأهيل الأمني',
      phone: '+967-770000003',
      organization: 'FACSS Training Academy',
      role: 'TRAINING_MANAGER',
      isActive: true,
    }
  });

  const researchManager = await prisma.user.create({
    data: {
      email: 'research@facss-aden.com',
      passwordHash: researchPassword,
      fullName: 'رئيس وحدة الدراسات والبحوث الاستراتيجية',
      phone: '+967-770000004',
      organization: 'FACSS Strategic Research Division',
      role: 'RESEARCH_MANAGER',
      isActive: true,
    }
  });

  const clientUser = await prisma.user.create({
    data: {
      email: 'client@yemen-bank.com',
      passwordHash: clientPassword,
      fullName: 'عبدالله السقاف (مدير الأمن والسلامة)',
      phone: '+967-771122334',
      organization: 'بنك اليمن الوطني التجاري',
      role: 'CLIENT',
      isActive: true,
      clientProfile: {
        create: {
          companyName: 'بنك اليمن الوطني التجاري',
          sector: 'البنوك والمصارف',
          taxNumber: 'TAX-YE-98741',
          address: 'عدن - كريتر - شارع المصارف',
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
      organization: 'متدرب مستقل / خريج',
      role: 'TRAINEE',
      isActive: true,
    }
  });

  console.log('Users and Profiles created.');

  // System Settings
  const settings = [
    { key: 'site_name_ar', value: 'مركز عدن الأول للخدمات الأمنية والدراسات الاستراتيجية', category: 'GENERAL' },
    { key: 'site_name_en', value: 'Aden First Center for Security Services and Strategic Studies', category: 'GENERAL' },
    { key: 'site_acronym', value: 'FACSS', category: 'GENERAL' },
    { key: 'slogan_ar', value: '«أمانٌ يبدأ من عدن»', category: 'BRANDING' },
    { key: 'slogan_en', value: 'First in Security, First in Trust', category: 'BRANDING' },
    { key: 'subtitle_ar', value: 'منظومةٌ أمنيةٌ متكاملة: من التدريب إلى الحراسات، إلى التحليل الأمني وتقييم المخاطر، والأبحاث والدراسات الأمنية والاستراتيجية', category: 'BRANDING' },
    { key: 'subtitle_en', value: 'Comprehensive Security Ecosystem: From Training to Guarding, to Security Analysis & Risk Assessment, and Strategic & Security Research', category: 'BRANDING' },
    { key: 'contact_email', value: 'info@facss-aden.com', category: 'CONTACT' },
    { key: 'contact_phone', value: 'PHONE_PLACEHOLDER', category: 'CONTACT' },
    { key: 'contact_address_ar', value: 'عدن، الجمهورية اليمنية', category: 'CONTACT' },
    { key: 'contact_address_en', value: 'Aden, Republic of Yemen', category: 'CONTACT' },
    { key: 'website_url', value: 'www.facss-aden.com', category: 'CONTACT' },
    { key: 'social_facebook', value: 'FACEBOOK_URL_PLACEHOLDER', category: 'SOCIAL' },
    { key: 'social_twitter', value: 'TWITTER_URL_PLACEHOLDER', category: 'SOCIAL' },
    { key: 'social_linkedin', value: 'LINKEDIN_URL_PLACEHOLDER', category: 'SOCIAL' },
    { key: 'social_whatsapp', value: 'WHATSAPP_PLACEHOLDER', category: 'SOCIAL' },
  ];

  for (const s of settings) {
    await prisma.systemSetting.create({ data: s });
  }

  // Service Categories
  const catOperational = await prisma.serviceCategory.create({
    data: {
      titleAr: 'الخدمات الأمنية التشغيلية',
      titleEn: 'Operational Security Services',
      slug: 'operational-security-services',
      icon: 'ShieldCheck',
      order: 1,
    }
  });

  const catElectronic = await prisma.serviceCategory.create({
    data: {
      titleAr: 'الأنظمة والحلول الأمنية الإلكترونية',
      titleEn: 'Electronic Security & Advanced Systems',
      slug: 'electronic-security-solutions',
      icon: 'Cpu',
      order: 2,
    }
  });

  const catStrategic = await prisma.serviceCategory.create({
    data: {
      titleAr: 'الدراسات الأمنية الاستراتيجية',
      titleEn: 'Strategic Security Studies',
      slug: 'strategic-security-studies',
      icon: 'FileText',
      order: 3,
    }
  });

  // Services
  const sTraining = await prisma.service.create({
    data: {
      categoryId: catOperational.id,
      titleAr: 'تدريب أمن وسلامة',
      titleEn: 'Security and Safety Training',
      slug: 'security-and-safety-training',
      shortDescAr: 'برامج تأهيلٍ واعتمادٍ للكوادر الأمنية وفق أرقى المعايير الدولية المعتمدة.',
      shortDescEn: 'Accredited qualification and certification programs for security personnel to global standards.',
      fullDescAr: 'برامج تأهيلٍ واعتمادٍ متخصصة للكوادر الأمنية، تشمل الدورات الأساسية للحراس، حماية الشخصيات، التعامل مع الطوارئ والإخلاء، السلامة المهنية، أمن المعلومات، والإسعافات الأولية.',
      fullDescEn: 'Specialized qualification and certification programs for security cadres, covering basic guard training, VIP close protection, emergency response & evacuation, occupational safety, info-sec, and tactical first aid.',
      featuresAr: JSON.stringify([
        'الدورات الأساسية للحراس وتأهيل الأفراد',
        'حماية الشخصيات الهامة والمواكب الدبلوماسية',
        'التعامل مع الطوارئ وخطط الإخلاء الآمن',
        'السلامة والصحة المهنية ومكافحة الحرائق',
        'أمن المعلومات والاتصالات الحساسة',
        'الإسعافات الأولية الميدانية التكتيكية'
      ]),
      featuresEn: JSON.stringify([
        'Basic Guard Qualification & Drills',
        'VIP Close Protection & Convoy Security',
        'Emergency Handling & Evacuation Protocols',
        'Occupational Health & Safety (OHS)',
        'Information & Communications Security',
        'Tactical Field First Aid'
      ]),
      targetSectorsAr: JSON.stringify(['الجهات الحكومية', 'الشركات والمنشآت', 'البنوك', 'المؤسسات التعليمية']),
      targetSectorsEn: JSON.stringify(['Government Entities', 'Corporations & Facilities', 'Banks', 'Educational Institutions']),
      processAr: JSON.stringify(['تحديد الاحتياج التدريبي', 'تصميم المنهاج المعتمد', 'التدريب النظري والميداني', 'التقييم وإصدار الشهادات']),
      processEn: JSON.stringify(['Needs Assessment', 'Curriculum Design', 'Theoretical & Field Drills', 'Evaluation & Certification']),
      icon: 'GraduationCap',
      order: 1,
    }
  });

  const sGuarding = await prisma.service.create({
    data: {
      categoryId: catOperational.id,
      titleAr: 'خدمات الحراسات والحماية الميدانية',
      titleEn: 'Guarding & Field Protection Services',
      slug: 'guarding-services',
      shortDescAr: 'حراسة المنشآت الحيوية، حماية الشخصيات، وتأمين الفعاليات ونقل الأموال والممتلكات الثمينة.',
      shortDescEn: 'Facility protection, VIP protection, event security, cash-in-transit and valuables escort.',
      fullDescAr: 'نوفّر خدمات حراسة المنشآت الحكومية والخاصة، حماية الشخصيات المهمة، تأمين الفعاليات والمناسبات الكبرى، حراسة ومرافقة نقل الأموال والممتلكات الثمينة، وتسيير دوريات ثابتة ومتنقلة على مدار الساعة.',
      fullDescEn: 'Comprehensive protection for governmental and commercial premises, VIP escorts, high-profile event security, cash and valuables in transit security, with 24/7 static posts and mobile patrols.',
      featuresAr: JSON.stringify([
        'حراسة المنشآت الحكومية والمصرفية والخاصة',
        'حماية الشخصيات المهمة والوفود الزائرة',
        'تأمين المؤتمرات والفعاليات الجماهيرية',
        'حراسة ومرافقة نقل الأموال والمقتنيات الثمينة',
        'دوريات أمنية راكبة وراجلة على مدار الساعة',
        'تطبيق إجراءات التشغيل الموحدة (SOPs)'
      ]),
      featuresEn: JSON.stringify([
        'Government, Banking & Commercial Facility Guarding',
        'VIP & Executive Escort Services',
        'Major Event & Conference Security',
        'Cash-in-Transit (CIT) & Valuables Escort',
        '24/7 Fixed Posts & Mobile Patrols',
        'Strict Standard Operating Procedures (SOPs)'
      ]),
      targetSectorsAr: JSON.stringify(['البنوك والمصارف', 'الشركات النفطية والموانئ', 'البعثات الدبلوماسية', 'المنشآت الصناعية']),
      targetSectorsEn: JSON.stringify(['Banks & Financial Institutions', 'Oil & Port Facilities', 'Diplomatic Missions', 'Industrial Complexes']),
      processAr: JSON.stringify(['مسح الموقع الميداني', 'وضع خطة التمركز والتوزيع', 'نشر الكوادر والتجهيزات', 'الرقابة والإشراف الدوري']),
      processEn: JSON.stringify(['Field Site Reconnaissance', 'Deployment & Post Planning', 'Personnel & Equipment Stationing', 'Continuous Supervision']),
      icon: 'Shield',
      order: 2,
    }
  });

  const sPhysicalAssessment = await prisma.service.create({
    data: {
      categoryId: catOperational.id,
      titleAr: 'تقييم الأمن المادي',
      titleEn: 'Physical Security Assessment',
      slug: 'physical-security-assessment',
      shortDescAr: 'تقييمٌ شاملٌ للأمن المادي للمباني والمنشآت والأصول وتحصين نقاط الضعف.',
      shortDescEn: 'Comprehensive audit of physical premises, vital assets, perimeter defenses and structural resilience.',
      fullDescAr: 'تقييمٌ شاملٌ ودقيق للأمن المادي للمباني والمنشآت والأصول الحيوية، يشمل فحص نقاط الدخول، السياجات الخارجية، الإضاءة الأمنية، أنظمة المراقبة الإلكترونية، التحكم في الوصول، ومتانة البنية التحتية الوقائية.',
      fullDescEn: 'Detailed physical audit of buildings, compounds, and infrastructure: entry control points, perimeter fencing, security lighting, CCTV coverage, access gates, and architectural physical resilience.',
      featuresAr: JSON.stringify([
        'فحص نقاط الدخول والخروج والتحكم في الوصول',
        'تقييم كفاءة السياجات الأمنية والمحيط الخارجي',
        'تدقيق توزيع الإضاءة الأمنية وأنظمة المراقبة',
        'فحص متانة البنية التحتية ومقاومة الاختراق',
        'إصدار تقرير تقييم تفصيلي مدعوم بالتوصيات',
        'وضع مصفوفة معالجة الثغرات حسب الأولوية'
      ]),
      featuresEn: JSON.stringify([
        'Entry/Exit Point & Access Flow Inspection',
        'Perimeter Defense & Fence Vulnerability Audit',
        'Surveillance & Security Lighting Verification',
        'Structural Resilience & Breach Resistance Testing',
        'Comprehensive Audit Report with Actionable Solutions',
        'Prioritized Vulnerability Mitigation Matrix'
      ]),
      targetSectorsAr: JSON.stringify(['المنظمات الدولية', 'المؤسسات العامة', 'المجمعات التجارية', 'المستشفيات']),
      targetSectorsEn: JSON.stringify(['International NGOs', 'Public Institutions', 'Commercial Malls', 'Hospitals']),
      processAr: JSON.stringify(['الفحص الميداني التفتيشي', 'تحليل نقاط الضعف المحتملة', 'إعداد التقرير والمصفوفة', 'تسليم التوصيات وخطة العلاج']),
      processEn: JSON.stringify(['On-Site Physical Audit', 'Vulnerability Analysis', 'Report & Matrix Compilation', 'Remediation Roadmap Delivery']),
      icon: 'Building2',
      order: 3,
    }
  });

  const sConsultations = await prisma.service.create({
    data: {
      categoryId: catOperational.id,
      titleAr: 'استشارات أمنية استراتيجية',
      titleEn: 'Security Consultations',
      slug: 'security-consultations',
      shortDescAr: 'تصميم المنظومات الأمنية المتكاملة، وتطوير السياسات والإجراءات ودعم الامتثال.',
      shortDescEn: 'End-to-end security architecture design, policy formulation, SOP authoring, and regulatory compliance.',
      fullDescAr: 'نقدّم استشارات متخصصة في تصميم المنظومات الأمنية المتكاملة، اختيار وتركيب أنظمة المراقبة والإنذار المتقدمة، تطوير السياسات والإجراءات التشغيلية الموحدة (SOPs)، ودعم الامتثال للأنظمة والمعايير الدولية.',
      fullDescEn: 'Expert consultancy in designing integrated security ecosystems, selecting surveillance and alarm technologies, formulating organizational security policies, drafting SOPs, and ensuring regulatory compliance.',
      featuresAr: JSON.stringify([
        'تصميم وتخطيط المنظومات الأمنية الشاملة',
        'صياغة السياسات الأمنية وإجراءات التشغيل الموحدة SOPs',
        'اختيار التجهيزات الفنية والتقنية والمفاضلة بينها',
        'خطط استمرارية الأعمال وإدارة الأزمات',
        'مراجعة الامتثال للمعايير الأمنية المعتمدة',
        'استشارات أمن سلسلة الإمداد والخدمات اللوجستية'
      ]),
      featuresEn: JSON.stringify([
        'Holistic Security System Architecture',
        'Security Policy & SOP Drafting',
        'Technical Equipment Specification & Selection',
        'Business Continuity & Crisis Management Plans',
        'Regulatory & Standard Compliance Auditing',
        'Supply Chain & Logistics Security Advisory'
      ]),
      targetSectorsAr: JSON.stringify(['الشركات النفطية', 'البنوك', 'المصانع الكبرى', 'الجهات الحكومية']),
      targetSectorsEn: JSON.stringify(['Oil Companies', 'Banks', 'Major Manufacturing', 'Government Bodies']),
      processAr: JSON.stringify(['جلسة استكشافية وتحليل الاحتياج', 'دراسة السياق التشغيلي والتنظيمي', 'صياغة وثائق السياسات والتصاميم', 'المرافقة والإشراف على التطبيق']),
      processEn: JSON.stringify(['Discovery & Needs Consultation', 'Operational Context Study', 'Policy & Architecture Formulation', 'Implementation Mentorship']),
      icon: 'Briefcase',
      order: 4,
    }
  });

  const sElectronicSolutions = await prisma.service.create({
    data: {
      categoryId: catElectronic.id,
      titleAr: 'الخدمات الإلكترونية وأنظمة الأمن المتقدمة',
      titleEn: 'Electronic Security & Advanced Systems',
      slug: 'electronic-security-solutions',
      shortDescAr: 'حلول أمنية إلكترونية متكاملة تغطي كافة متطلبات الأمن التقني والسلامة من الحرائق.',
      shortDescEn: 'Complete technical electronic security systems, access management, surveillance, and fire safety systems.',
      fullDescAr: 'نوفّر حلولاً أمنية إلكترونية متكاملة تغطي جميع أنواع الأمن التقني: أنظمة CCTV، التحكم في الدخول، أنظمة الحضور والانصراف، إدارة المفاتيح، إدارة المباني BMS، الشبكات، التعرف على الوجوه، RFID، الحواجز الأمنية، أجهزة تفتيش الحقائب والأفراد، غرف العمليات، معدات الإطفاء ومكافحة الحرائق، أجهزة الإنذار المبكر، وملابس ومعدات الوقاية والسلامة.',
      fullDescEn: 'Integrated electronic security solutions covering: CCTV & video surveillance, Access Control, Time & Attendance, Key Management Systems, BMS, Networking Hardware, Facial Recognition, RFID tracking, Security Barriers, Handheld & Stationary inspection devices, Central Monitoring Control Rooms, Firefighting equipment, Early Fire & Burglar alarms, and Protective Safety PPE.',
      featuresAr: JSON.stringify([
        'أنظمة المراقبة التلفزيونية CCTV والمراقبة بالفيديو المتطورة',
        'أنظمة التحكم في الدخول Access Control والبوابات الإلكترونية',
        'أنظمة الحضور والانصراف وإدارة المفاتيح Key Management',
        'أنظمة إدارة المباني Building Management Systems (BMS)',
        'تجهيزات الشبكات Networking Hardware والبنية التحتية',
        'أنظمة التعرف على الوجوه Facial Recognition وتقنية RFID',
        'الحواجز الأمنية Security Barriers وموانع الاقتحام',
        'أجهزة تفتيش الحقائب والأفراد (يدوية وثابتة X-Ray)',
        'غرف عمليات المراقبة المتكاملة وشاشات الرصد المركزية',
        'طفايات الحريق اليدوية والتلقائية وخراطيم ومضخات الإطفاء',
        'أجهزة الإنذار المبكر ضد الحريق والإنذار ضد السرقة',
        'ملابس الأمن والسلامة والمعدات الواقية والكمامات'
      ]),
      featuresEn: JSON.stringify([
        'Advanced CCTV & IP Video Surveillance Systems',
        'Access Control Systems & Automated Turnstiles',
        'Time & Attendance & Intelligent Key Management Systems',
        'Building Management Systems (BMS)',
        'Networking Hardware & Secure Infrastructure',
        'Facial Recognition & RFID Asset/Personnel Tracking',
        'Security Barriers & Anti-Ramming Bollards',
        'Personnel & Baggage Inspection Devices (Handheld & X-Ray)',
        'Integrated Security Operations Center (SOC) Control Rooms',
        'Fire Extinguishers, Foam/Water Hoses & Fire Pumps',
        'Early Smoke/Fire Alarms & Anti-Intrusion Alarms',
        'Safety PPE, Helmets, Protective Vests & Respirators'
      ]),
      targetSectorsAr: JSON.stringify(['المنازل ومراكز الأعمال', 'المجمعات التجارية والمطاعم', 'المصانع والمستودعات', 'الجامعات والمدارس']),
      targetSectorsEn: JSON.stringify(['Residential & Business Centers', 'Malls & Restaurants', 'Factories & Warehouses', 'Universities & Schools']),
      processAr: JSON.stringify(['المخطط الهندسي الفني', 'التوريد والتركيب المعتمد', 'الربط والبرمجة المركزية', 'التدريب والصيانة الدورية']),
      processEn: JSON.stringify(['Engineering Design', 'Certified Procurement & Installation', 'Central Configuration', 'Training & Periodic Maintenance']),
      icon: 'Cpu',
      order: 5,
    }
  });

  // Strategic Studies Services
  const sRiskAnalysis = await prisma.service.create({
    data: {
      categoryId: catStrategic.id,
      titleAr: 'تحليل المخاطر الأمنية',
      titleEn: 'Security Risk Analysis',
      slug: 'security-risk-analysis',
      shortDescAr: 'تحليلٌ مُعمَّقٌ للتهديدات ونقاط الضعف والسيناريوهات المُحتملة وإنتاج مصفوفات المخاطر.',
      shortDescEn: 'In-depth threat & vulnerability modeling, risk matrices, and actionable mitigation roadmaps.',
      fullDescAr: 'تحليلٌ استباقي مُعمَّق للتهديدات ونقاط الضعف والسيناريوهات المحتملة، يتضمن إنتاج مصفوفات المخاطر وخرائط الأولويات، وتقديم توصيات دقيقة قابلة للتنفيذ تدعم اتخاذ القرار المؤسسي والوطني.',
      fullDescEn: 'Proactive and methodological analysis of threats, vulnerabilities, and incident scenarios, delivering comprehensive risk matrices, priority heatmaps, and actionable recommendations.',
      featuresAr: JSON.stringify([
        'تحديد وتحليل مصادر التهديد المباشرة وغير المباشرة',
        'إنتاج مصفوفات المخاطر الكمية والنوعية',
        'خرائط توزيع الأولويات وفق احتمالية وتأثير المخاطر',
        'تطوير سيناريوهات التعامل مع الطوارئ والأزمات',
        'توصيات عملية دقيقة قابلة للتنفيذ الفوري'
      ]),
      featuresEn: JSON.stringify([
        'Identification of Direct & Indirect Threat Vectors',
        'Quantitative & Qualitative Risk Matrix Production',
        'Impact vs Probability Prioritization Heatmaps',
        'Incident & Emergency Scenario Modeling',
        'Actionable Immediate Implementation Recommendations'
      ]),
      targetSectorsAr: JSON.stringify(['صناع القرار', 'الشركات الكبرى', 'المنظمات الدولية', 'المؤسسات المالية']),
      targetSectorsEn: JSON.stringify(['Decision Makers', 'Corporations', 'International NGOs', 'Financial Institutions']),
      processAr: JSON.stringify(['جمع البيانات الاستخبارية والميدانية', 'تحليل الثغرات والسيناريوهات', 'بناء مصفوفة المخاطر', 'رفع التقرير الاستراتيجي']),
      processEn: JSON.stringify(['Field Intelligence Collection', 'Vulnerability & Scenario Modeling', 'Matrix Formulation', 'Strategic Delivery']),
      icon: 'TrendingUp',
      order: 6,
    }
  });

  console.log('Services seeded.');

  // Courses
  const cCatGeneral = await prisma.courseCategory.create({
    data: {
      titleAr: 'برامج التأهيل الأمني الميداني',
      titleEn: 'Field Security Qualification Programs',
      slug: 'field-security-programs',
    }
  });

  const cCatSafety = await prisma.courseCategory.create({
    data: {
      titleAr: 'السلامة وإدارة الطوارئ',
      titleEn: 'Safety & Emergency Management',
      slug: 'safety-and-emergency',
    }
  });

  const course1 = await prisma.course.create({
    data: {
      categoryId: cCatGeneral.id,
      titleAr: 'الدورة الأساسية لتأهيل حراس المنشآت الحيوية',
      titleEn: 'Basic Guard & Vital Facility Security Qualification',
      slug: 'basic-guard-qualification',
      descriptionAr: 'برنامج مكثف لتأهيل الحراس وفق المعايير الدولية يشمل مهارات التفتيش، إدارة بوابات الدخول، التعامل مع الحوادث، واستخدام أجهزة المراقبة والتفتيش.',
      descriptionEn: 'Intensive qualification program for security guards following international standards: access control, inspection techniques, incident reporting, and modern surveillance tool utilization.',
      trainerName: 'كادر تدريب معتمد دولياً (FACSS Master Trainers)',
      duration: '4 أسابيع (80 ساعة تدريبية)',
      location: 'مركز تدريب FACSS - عدن',
      capacity: 30,
      hasCertificate: true,
      status: 'OPEN',
      requirementsAr: 'اللياقة البدنية، حسن السيرة والسلوك، إتمام التعليم الثانوي كحد أدنى.',
      requirementsEn: 'Physical fitness, good conduct certificate, minimum secondary education.',
    }
  });

  const course2 = await prisma.course.create({
    data: {
      categoryId: cCatGeneral.id,
      titleAr: 'دورة حماية الشخصيات المهمة والمواكب (VIP Close Protection)',
      titleEn: 'VIP Close Protection & Convoy Security Course',
      slug: 'vip-close-protection',
      descriptionAr: 'تأهيل متقدم لكوادر الحماية اللصيقة للشخصيات الدبلوماسية ورجال الأعمال والوفود الزائرة، مع تدريبات تكتيكية على القيادة الدفاعية والمرافقة الأمنية.',
      descriptionEn: 'Advanced course for close protection teams safeguarding diplomats, executives, and delegations, featuring defensive driving and escort protocols.',
      trainerName: 'خبراء حماية الشخصيات والعمليات الخاصة',
      duration: '3 أسابيع (60 ساعة تدريبية)',
      location: 'ميدان التدريب التكتيكي - عدن',
      capacity: 20,
      hasCertificate: true,
      status: 'OPEN',
      requirementsAr: 'خبرة أمنية سابقة لا تقل عن سنتين، اجتياز الفحص البدني والنفسي.',
      requirementsEn: 'Minimum 2 years of field security background, physical and psychological clearance.',
    }
  });

  const course3 = await prisma.course.create({
    data: {
      categoryId: cCatSafety.id,
      titleAr: 'إدارة الطوارئ والإخلاء والإنقاذ والإسعافات الأولية التكتيكية',
      titleEn: 'Emergency Response, Evacuation & Tactical First Aid',
      slug: 'emergency-response-tactical-first-aid',
      descriptionAr: 'برنامج عملي متقدم في التخطيط والاستجابة لحوادث الحريق والكوارث وتطبيق خطط الإخلاء الآمن وإجراءات الإسعاف الأولي السريع للمصابين.',
      descriptionEn: 'Practical training on emergency planning, fire suppression, crisis evacuation, and lifesaving tactical first aid.',
      trainerName: 'مدربون معتمدون في الدفاع المدني والرعاية الطارئة',
      duration: 'أسبوعان (40 ساعة تدريبية)',
      location: 'قاعات المحاكاة بمركز FACSS - عدن',
      capacity: 25,
      hasCertificate: true,
      status: 'OPEN',
      requirementsAr: 'مفتوح لكافة الكوادر الأمنية ومسؤولي السلامة في المنشآت.',
      requirementsEn: 'Open to all security personnel and facility safety officers.',
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
      qualification: 'دبلوم حاسوب وعلوم أمنية',
      status: 'COMPLETED',
      adminNotes: 'أتم الدورة بتفوق واجتاز الاختبار النظري والميداني.',
    }
  });

  await prisma.attendanceRecord.createMany({
    data: [
      { registrationId: reg1.id, sessionDate: new Date('2026-08-01'), status: 'PRESENT', notes: 'حضور كامل وتفاعل متميز' },
      { registrationId: reg1.id, sessionDate: new Date('2026-08-08'), status: 'PRESENT', notes: 'اجتياز تدريب الإخلاء العملي' },
      { registrationId: reg1.id, sessionDate: new Date('2026-08-15'), status: 'PRESENT', notes: 'تطبيق عملي لأجهزة التفتيش' },
      { registrationId: reg1.id, sessionDate: new Date('2026-08-22'), status: 'PRESENT', notes: 'الاختبار الختامي الشامل' },
    ]
  });

  await prisma.certificate.create({
    data: {
      certificateNumber: 'FACSS-CERT-2026-00108',
      registrationId: reg1.id,
      studentName: traineeUser.fullName,
      courseTitle: course1.titleAr,
      issueDate: new Date('2026-08-25'),
      grade: 'ممتاز (Excellent)',
      verificationCode: 'VER-FACSS-9921',
      pdfPath: '/uploads/certificates/cert_00108.pdf',
    }
  });

  console.log('Trainee registration and certificate created.');

  // Research Publications
  const rCat1 = await prisma.researchCategory.create({
    data: {
      titleAr: 'دراسات أمنية واستراتيجية',
      titleEn: 'Strategic & Security Studies',
      slug: 'strategic-security-studies',
    }
  });

  const rCat2 = await prisma.researchCategory.create({
    data: {
      titleAr: 'تقارير دورية وتحليل سياسات',
      titleEn: 'Periodic Reports & Policy Analysis',
      slug: 'periodic-reports',
    }
  });

  await prisma.researchPublication.create({
    data: {
      categoryId: rCat1.id,
      titleAr: 'تقييم بيئة التهديدات الأمنية وتأثيراتها على سلاسل الإمداد والمنشآت الحيوية في اليمن',
      titleEn: 'Assessment of the Security Threat Environment and Impacts on Vital Supply Chains in Yemen',
      slug: 'security-threat-assessment-yemen-supply-chains',
      author: 'وحدة الدراسات الاستراتيجية بمركز عدن الأول (FACSS)',
      summaryAr: 'دراسة تحليلية شاملة تتناول التحولات في بيئة التهديدات الميدانية وانعكاساتها المباشرة على حركة الموانئ والشحن البري وسلاسل الإمداد الحيوية في خليج عدن والمحافظات المجاورة.',
      summaryEn: 'Comprehensive analytical study exploring field threat dynamics and direct repercussions on port traffic, land transport, and essential supply lines in the Gulf of Aden region.',
      contentAr: 'تُمثّل هذه الدراسة قراءة متعمقة مبنية على المعرفة الميدانية الوثيقة التي يتمتع بها فريق مركز عدن الأول (FACSS)... الوقاية المسبقة والاستثمار في المرونة المؤسسية وسلاسل الإمداد تشكل الركيزة الأساسية للحد من الخسائر التشغيلية.',
      contentEn: 'This study presents an in-depth reading grounded in firsthand field knowledge possessed by FACSS cadres... Preemptive prevention and supply chain resilience form the essential bedrock of minimizing operational disruption.',
      visibility: 'PUBLIC',
      isFeatured: true,
      viewsCount: 1420,
    }
  });

  await prisma.researchPublication.create({
    data: {
      categoryId: rCat1.id,
      titleAr: 'الإطار الاستراتيجي لتقييم الأمن المادي ومؤشرات جاهزية الطوارئ في المؤسسات العامة والخاصة',
      titleEn: 'Strategic Framework for Physical Security Assessment & Emergency Readiness Indicators',
      slug: 'strategic-framework-physical-security-assessment',
      author: 'فريق الاستشارات الأمنية وتقييم المخاطر (FACSS)',
      summaryAr: 'دليل منهجي يُحدد الركائز الست للمقاربة الوقائية في تأمين المنشآت الحيوية والانتقال من منطق الاستجابة الارتكاسية إلى الاستباق الوقائي.',
      summaryEn: 'A methodological guide detailing the 6 preventive pillars in vital facility protection, shifting from reactive response to proactive containment.',
      contentAr: 'الأمن في جوهره هو الوقاية قبل الاستجابة. تركز هذه الورقة البحثية على منهجية التقييم المادي الميداني للأصول والبوابات والمحيطات الأمنية وتطبيق إجراءات التشغيل الموحدة (SOPs).',
      contentEn: 'Security in its core is prevention before response. This research paper elaborates on physical on-site audit methodology for assets, entry points, perimeter fencing, and SOP implementation.',
      visibility: 'PUBLIC',
      isFeatured: true,
      viewsCount: 980,
    }
  });

  await prisma.researchPublication.create({
    data: {
      categoryId: rCat2.id,
      titleAr: 'التقرير الأمني الدوري (العدد الأول): المؤثرات الإقليمية على أمن الملاحة والموانئ',
      titleEn: 'Periodic Security Report (Issue 1): Regional Dynamics Impacting Maritime & Port Security',
      slug: 'periodic-security-report-issue-1',
      author: 'هيئة التحرير والتحليل الاستراتيجي (FACSS)',
      summaryAr: 'تقرير رصدي دوري موجه لصناع القرار والمؤسسات الملاحية والنفطية، يتضمن مصفوفة مخاطر شهرية وتوصيات إجرائية محددة.',
      summaryEn: 'Periodic monitoring report intended for decision-makers and maritime/oil entities, featuring monthly risk matrices and concrete operational recommendations.',
      contentAr: 'تقرير تحليلي دوري يستعرض تطورات البيئة الأمنية الإقليمية والدولية وتأثيرها المباشر على النشاط الاقتصادي والموانئ البحرية في الجمهورية اليمنية.',
      contentEn: 'Periodic report reviewing regional and international security developments and their direct impact on maritime ports and economic stability in Yemen.',
      visibility: 'CLIENT_ONLY',
      isFeatured: false,
      viewsCount: 310,
    }
  });

  console.log('Research publications seeded.');

  // News
  await prisma.newsArticle.create({
    data: {
      titleAr: 'مركز عدن الأول (FACSS) يُدشّن المنظومة التدريبية المتخصصة لتأهيل الشباب في المهن الأمنية',
      titleEn: 'FACSS Launches Specialized Security Training Program Empowering Yemeni Youth',
      slug: 'facss-launches-youth-security-training-ecosystem',
      summaryAr: 'ضمن رؤيته التنموية والمجتمعية، أعلن مركز عدن الأول عن بدء التسجيل في حزمة الدورات الأمنية المعتمدة لفتح آفاق العمل الاحترافي أمام الكفاءات الشابة.',
      summaryEn: 'As part of its developmental vision, FACSS announced open enrollment for accredited security courses, preparing youth for high-demand professional careers.',
      contentAr: 'انطلاقاً من رسالة المركز الهادفة إلى تأهيل الكوادر الوطنية وفتح المجال للشباب اليمني لدخول المهن الأمنية والدفاع المدني والسلامة بمعايير عالمية، بدأت المنظومة التدريبية استقبال أولى الدفعات في مقر المركز بعدن.',
      contentEn: 'Guided by its institutional mission to qualify national talent and open doors for Yemeni youth into security, guarding, and civil defense with global standards, FACSS commenced welcoming its first cohorts in Aden.',
      author: 'المكتب الإعلامي لمركز عدن الأول',
      category: 'أخبار المركز',
      status: 'PUBLISHED',
    }
  });

  await prisma.newsArticle.create({
    data: {
      titleAr: 'شراكات استراتيجية لتعزيز الحماية المادية وأمن سلاسل الإمداد في المنشآت الحيوية',
      titleEn: 'Strategic Partnerships to Bolster Physical Security & Supply Chain Resilience in Vital Sectors',
      slug: 'strategic-partnerships-physical-security-supply-chains',
      summaryAr: 'أبرم مركز عدن الأول سلسلة من مذكرات التفاهم لتقديم الاستشارات وتقييم الأمن المادي لعدد من البنوك والمنشآت الصناعية والمؤسسات العامة.',
      summaryEn: 'FACSS concluded several MoUs to provide physical security assessments and consultations for commercial banks, industrial complexes, and public corporations.',
      contentAr: 'تأتي هذه الخطوة تفعيلاً لمنهجية المركز القائمة على الربط بين الخبرة الميدانية الطويلة والمنهج الأكاديمي، بما يضمن حماية الأصول الحيوية واستمرارية الأعمال.',
      contentEn: 'This milestone activates FACSS methodology of blending deep field expertise with academic rigor, ensuring vital asset protection and robust business continuity.',
      author: 'إدارة العلاقات المؤسسية',
      category: 'شراكات واستشارات',
      status: 'PUBLISHED',
    }
  });

  console.log('News articles seeded.');

  // Sample Service Request for client
  const sReq = await prisma.serviceRequest.create({
    data: {
      requestNumber: 'FACSS-SR-2026-000101',
      userId: clientUser.id,
      serviceId: sPhysicalAssessment.id,
      organization: 'بنك اليمن الوطني التجاري',
      contactName: 'عبدالله السقاف',
      contactEmail: 'client@yemen-bank.com',
      contactPhone: '+967-771122334',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      description: 'طلب تقييم شامل للأمن المادي للمقر الرئيسي للبنك وفروعه الثلاثة في عدن، متضمناً فحص بوابات الدخول وكاميرات المراقبة وغرفة التحكم المركزية.',
      assignedEmployeeId: serviceManager.id,
    }
  });

  await prisma.serviceRequestNote.create({
    data: {
      requestId: sReq.id,
      authorId: serviceManager.id,
      authorName: serviceManager.fullName,
      note: 'تم إنجاز المسح الميداني الأولي بنجاح وجارٍ إعداد مصفوفة المخاطر والتقرير النهائي للبنك.',
      isClientVisible: true,
    }
  });

  await prisma.serviceRequestNote.create({
    data: {
      requestId: sReq.id,
      authorId: serviceManager.id,
      authorName: serviceManager.fullName,
      note: 'ملاحظة إدارية داخلية: تم التنسيق مع فريق التفتيش الفني لزيارة الفرع الثاني يوم الثلاثاء القادم.',
      isClientVisible: false,
    }
  });

  await prisma.notification.create({
    data: {
      userId: clientUser.id,
      titleAr: 'تحديث حالة طلب الخدمة',
      titleEn: 'Service Request Status Updated',
      messageAr: 'طلبكم رقم FACSS-SR-2026-000101 قيد التنفيذ والمتابعة الميدانية من قبل مدير العمليات.',
      messageEn: 'Your request FACSS-SR-2026-000101 is currently IN_PROGRESS under active field assessment.',
      type: 'INFO',
      link: '/portal/client/requests',
    }
  });

  // Contact Message sample
  await prisma.contactMessage.create({
    data: {
      name: 'مؤسسة موانئ خليج عدن',
      email: 'security-affairs@aden-ports.example.com',
      phone: '+967-773344556',
      organization: 'مؤسسة الموانئ',
      subject: 'طلب استشارة أمنية وتدريب كوادر الحراسة البحرية',
      message: 'نود الاطلاع على برامج التدريب الأمني المتخصصة لحراس الأرصفة وتأمين المنشآت الحيوية في الميناء.',
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
