/**
 * FACSS — سكربت ترحيل وتثبيت دليل الخدمات المعتمد لمركز عدن الدولي للسلامة والدراسات الميدانية
 * (Aden International Center for Safety & Field Assessment)
 * 
 * المرحلة الأولى — الأمر 4 من 4
 * 
 * مميزات السكربت:
 * 1. فحص الاتصال والتأكد من أنه يشير إلى قاعدة التطوير المحلية حصراً (localhost / 127.0.0.1).
 * 2. الحفاظ التام على السجلات والطلبات التاريخية دون حذف أو تعديل.
 * 3. إيقاف إتاحة التصنيفات والخدمات الأمنية التجارية القديمة (isActive = false).
 * 4. إنشاء وتثبيت مجالات النشاط الستة والخدمات الميدانية الإنسانية الـ 12 المعتمدة بالعربية والإنجليزية.
 * 5. قابلية التكرار التامة (Idempotent) باستخدام upsert دون إنشاء تكرارات.
 */

const fs = require('fs');
const path = require('path');

// تحميل الإعدادات من .env بأمان
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n=============================================================');
  console.log('  مركز عدن الدولي للسلامة والدراسات الميدانية');
  console.log('  Aden International Center for Safety & Field Assessment');
  console.log('  ترحيل دليل الخدمات والمجالات المعتمدة — الأمر 4 من المرحلة 1');
  console.log('=============================================================\n');

  // 1. التحقق من أمان الاتصال المحلي
  const dbUrl = process.env.DATABASE_URL || '';
  const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
  if (!isLocal) {
    console.error('✗ خطأ أمني: قاعدة البيانات المحددة ليست محلية. توقف الترحيل فوراً.');
    process.exit(1);
  }
  console.log('✓ تم التحقق من أمان الاتصال بقاعدة التطوير المحلية (127.0.0.1).');

  // 2. إيقاف التصنيفات القديمة (إن وجدت)
  const oldCategorySlugs = [
    'operational-security-services',
    'electronic-security-solutions',
    'strategic-security-studies'
  ];

  for (const oldSlug of oldCategorySlugs) {
    const exists = await prisma.serviceCategory.findUnique({ where: { slug: oldSlug } });
    if (exists) {
      await prisma.serviceCategory.update({
        where: { slug: oldSlug },
        data: { isActive: false }
      });
      console.log(`- تم إيقاف التصنيف القديم من العرض العام: [${oldSlug}]`);
    }
  }

  // إيقاف أي خدمات تجارية أمنية قديمة من استقبال أي طلبات جديدة
  const oldServiceSlugs = [
    'security-and-safety-training',
    'guarding-services',
    'security-assessments',
    'cctv-and-surveillance',
    'access-control-and-safety',
    'security-risk-analysis'
  ];

  for (const oldSlug of oldServiceSlugs) {
    const srv = await prisma.service.findUnique({ where: { slug: oldSlug } });
    if (srv && srv.isActive) {
      await prisma.service.update({
        where: { slug: oldSlug },
        data: { isActive: false }
      });
      console.log(`- تم إيقاف الخدمة القديمة من استقبال طلبات جديدة: [${oldSlug}]`);
    }
  }

  // 3. تعريف وإنشاء التصنيفات الستة المعتمدة وفق وثيقة العميل
  const approvedCategories = [
    {
      slug: 'field-monitoring-early-warning',
      titleAr: 'الرصد الميداني والتنبيه المبكر',
      titleEn: 'Field Monitoring & Early Warning',
      icon: 'ShieldAlert',
      order: 1,
      isActive: true,
      services: [
        {
          slug: 'field-monitoring-risk-register',
          titleAr: 'الرصد الميداني وتحديث سجل المخاطر',
          titleEn: 'Field Monitoring & Risk Register',
          shortDescAr: 'رصد المؤشرات الميدانية، التحقق الأولي من الوقائع، وتحديث سجل المخاطر لحماية العاملين في الميدان.',
          shortDescEn: 'Monitoring field indicators, initial incident verification, and dynamic risk register logging for field personnel.',
          fullDescAr: 'خدمة مهنية مخصصة لدعم سلامة المنظمات والفرق الميدانية في عدن والمحافظات المجاورة، من خلال استقبال مؤشرات التهديد، والتحقق الأولي الصارم من مصداقية المصادر وفق مبادئ الحياد وعدم الإضرار، وتحديث سجل المخاطر التشغيلية دورياً لتمكين اتخاذ قرارات ميدانية مستنيرة.',
          fullDescEn: 'Professional service supporting the safety of organizations and field teams in Aden and neighboring governorates, by recording threat indicators, rigorous source verification adhering to neutrality and do-no-harm principles, and updating operational risk registers for informed decision-making.',
          featuresAr: JSON.stringify(['استقبال البلاغات والمؤشرات الميدانية', 'التحقق الأولي من موثوقية المصادر', 'تصنيف مستويات الحساسية والمخاطر', 'تحديث دوري لسجل المخاطر التشغيلية']),
          featuresEn: JSON.stringify(['Intake of Field Indicators & Reports', 'Rigorous Source Credibility Verification', 'Sensitivity & Risk Tier Classification', 'Continuous Operational Risk Register Updates']),
          targetSectorsAr: JSON.stringify(['المنظمات الإنسانية الدولية', 'وكالات الإغاثة والبعثات الميدانية', 'المنظمات المحلية غير الحكومية']),
          targetSectorsEn: JSON.stringify(['International NGOs', 'Relief Agencies & Field Missions', 'National NGOs']),
          processAr: JSON.stringify(['استقبال المؤشرات الميدانية', 'الفحص والتحقق من المصدر', 'تصنيف درجة التأكد والمخاطر', 'التحديث والمشاركة الآمنة']),
          processEn: JSON.stringify(['Indicator Intake', 'Source Verification', 'Certainty & Risk Classification', 'Update & Secure Dissemination']),
          order: 1,
          icon: 'Radio',
        },
        {
          slug: 'early-warning-incident-alerts',
          titleAr: 'التنبيه المبكر والإخطارات العاجلة',
          titleEn: 'Early Warning & Urgent Incident Alerts',
          shortDescAr: 'إصدار التنبيهات المبكرة والإخطارات التحذيرية حول المستجدات المؤثرة على حركة الفرق الميدانية.',
          shortDescEn: 'Issuing early warning alerts and urgent advisories regarding local developments affecting field movement.',
          fullDescAr: 'إعداد وإصدار تنبيهات مهنية مبكرة تخطر المنظمات والشركاء الإنسانيين بالتطورات الطارئة أو التغيرات الميدانية المفاجئة في مسارات الحركة ونقاط العبور، وفق تصنيفات واضحة وقوائم توزيع مصرح لها لحماية سلامة الكوادر.',
          fullDescEn: 'Preparing and issuing structured early warning advisories alerting organizations and humanitarian partners to urgent developments or unexpected changes along movement corridors and transit points, following clear classifications and authorized distribution lists.',
          featuresAr: JSON.stringify(['تنبيهات عاجلة للحوادث المؤثرة', 'تحديد نطاق التأثير الجغرافي والزمني', 'توزيع آمن لقوائم مصرح لها', 'توصيات وقائية وإجرائية فورية']),
          featuresEn: JSON.stringify(['Urgent Incident Bulletins', 'Geographic & Temporal Impact Scoping', 'Secure Whitelist Dissemination', 'Immediate Precautionary Advisories']),
          targetSectorsAr: JSON.stringify(['المنظمات الإنسانية الدولية', 'المنظمات المحلية', 'فرق الاستجابة الميدانية']),
          targetSectorsEn: JSON.stringify(['International NGOs', 'National NGOs', 'Field Response Teams']),
          processAr: JSON.stringify(['رصد الحدث الطارئ', 'المراجعة والاعتماد التحليلي', 'الإصدار المباشر للمصرح لهم', 'متابعة الأثر والمستجدات']),
          processEn: JSON.stringify(['Emergency Incident Detection', 'Analytical Review & Clearance', 'Targeted Dissemination', 'Impact & Evolution Tracking']),
          order: 2,
          icon: 'Bell',
        }
      ]
    },
    {
      slug: 'access-risk-analysis',
      titleAr: 'التحليل وتقييم مخاطر الوصول الإنساني والحركة',
      titleEn: 'Humanitarian Access & Movement Risk Assessment',
      icon: 'Compass',
      order: 2,
      isActive: true,
      services: [
        {
          slug: 'humanitarian-access-risk-assessment',
          titleAr: 'تقييم مخاطر الوصول الإنساني ومسارات الحركة',
          titleEn: 'Humanitarian Access & Movement Route Risk Assessment',
          shortDescAr: 'تقييم منهجي لعوائق الوصول ومسارات الحركة والمعابر لضمان تدفق المساعدات بأمان.',
          shortDescEn: 'Methodical assessment of access impediments, movement corridors, and transit routes for safe aid delivery.',
          fullDescAr: 'دراسة ميدانية تخصصية تحلل عوائق الوصول الإنساني المادية والإجرائية، وتقيّم سلامة المعابر والطرق الحيوية، وتضع مصفوفات تقدير المخاطر لدعم التخطيط الآمن لحركة القوافل والفرق الإنسانية.',
          fullDescEn: 'Specialized field assessment analyzing physical and procedural humanitarian access impediments, evaluating safety along transit corridors and routes, and generating risk matrices to enable secure mission movement.',
          featuresAr: JSON.stringify(['تقييم أمان الطرق ونقاط العبور', 'تحديد عوائق الوصول المادية والإجرائية', 'مصفوفات تقييم احتمالية وشدة المخاطر', 'خطط بديلة وتوصيات لحركة آمنة']),
          featuresEn: JSON.stringify(['Transit Route & Crossing Safety Audits', 'Physical & Procedural Access Impediment Scoping', 'Risk Severity & Probability Matrices', 'Contingency Movement Routing Recommendations']),
          targetSectorsAr: JSON.stringify(['المنظمات الإنسانية والبعثات الإغاثية', 'برامج الإمداد والخدمات اللوجستية', 'الشركاء الميدانيون']),
          targetSectorsEn: JSON.stringify(['Humanitarian Organizations & Relief Missions', 'Logistics & Supply Clusters', 'Field Partners']),
          processAr: JSON.stringify(['تحديد المسار والنطاق الميداني', 'جمع مؤشرات السلامة والحركة', 'تحليل المخاطر والمصفوفة', 'تسليم تقرير التقييم والتوصيات']),
          processEn: JSON.stringify(['Route & Scope Scoping', 'Safety & Movement Indicator Gathering', 'Risk Matrix Analysis', 'Assessment Handover & Briefing']),
          order: 1,
          icon: 'MapPin',
        },
        {
          slug: 'context-and-stakeholder-analysis',
          titleAr: 'تحليل السياق المحلي وأصحاب المصلحة',
          titleEn: 'Local Context & Stakeholder Analysis',
          shortDescAr: 'تحليلات معمقة لديناميكيات البيئة المحلية وأصحاب المصلحة الفاعلين في مناطق التدخل.',
          shortDescEn: 'In-depth analytical context mapping and stakeholder engagement profiling across intervention areas.',
          fullDescAr: 'تقديم تحليلات دورية وخاصة تفكك تعقيدات السياق الاجتماعي والمحلي في مناطق التدخل، وترسم خرائط العلاقات والتأثير لأصحاب المصلحة المحليين بما يدعم فهم البيئة التشغيلية وحساسية النزاع.',
          fullDescEn: 'Delivering periodic and customized contextual analyses mapping local social dynamics across intervention zones, identifying local stakeholder networks to enhance operational situational awareness and conflict sensitivity.',
          featuresAr: JSON.stringify(['رسم خرائط أصحاب المصلحة المحليين', 'تحليل ديناميكيات البيئة المجتمعية', 'تقييم حساسية النزاع وعدم الإضرار', 'مؤشرات اتجاهات الاستقرار الميداني']),
          featuresEn: JSON.stringify(['Local Stakeholder Mapping', 'Community Context Dynamics', 'Conflict Sensitivity & Do-No-Harm Review', 'Field Stability Trend Indicators']),
          targetSectorsAr: JSON.stringify(['إدارات البرامج والمنظمات الإنسانية', 'جهات التخطيط والتقييم', 'الجهات المانحة والشركاء']),
          targetSectorsEn: JSON.stringify(['Humanitarian Program Managers', 'Planning & Evaluation Teams', 'Donors & Implementing Partners']),
          processAr: JSON.stringify(['تحديد النطاق الجغرافي والبرامجي', 'جمع البيانات السياقية الميدانية', 'التحليل التركيبي والخرائط', 'صياغة التقرير التحليلي النهائي']),
          processEn: JSON.stringify(['Geographic & Programmatic Scoping', 'Field Contextual Data Collection', 'Synthesis & Stakeholder Mapping', 'Final Analytical Report Delivery']),
          order: 2,
          icon: 'TrendingUp',
        }
      ]
    },
    {
      slug: 'training-capacity-building',
      titleAr: 'التدريب وبناء القدرات',
      titleEn: 'Training & Capacity Building',
      icon: 'GraduationCap',
      order: 3,
      isActive: true,
      services: [
        {
          slug: 'field-safety-and-risk-training',
          titleAr: 'التدريب على السلامة الميدانية وإدارة المخاطر',
          titleEn: 'Field Safety & Risk Management Training',
          shortDescAr: 'برامج تدريبية وتطبيقية لرفع جاهزية الكوادر الميدانية في إدارة المخاطر وبروتوكولات الأمان.',
          shortDescEn: 'Practical training courses elevating field personnel preparedness in risk management and safety protocols.',
          fullDescAr: 'تصميم وتنفيذ ورش عمل وبرامج تدريبية تخصصية للعاملين في المجال الإنساني، تركز على مبادئ السلامة الشخصية والميدانية، تقييم المخاطر الفردية والجماعية، الاتصالات أثناء الطوارئ، وإجراءات السلامة في بيئات النزاع.',
          fullDescEn: 'Designing and delivering specialized workshops and training courses for aid workers, focusing on personal and team field safety, collective risk assessment, emergency crisis communications, and safety protocols in conflict-affected areas.',
          featuresAr: JSON.stringify(['بروتوكولات السلامة الشخصية والميدانية', 'إدارة المخاطر والتخطيط الاستباقي', 'إجراءات السلامة أثناء التنقل والعمل الميداني', 'إدارة الاتصالات والتعامل مع الطوارئ']),
          featuresEn: JSON.stringify(['Personal & Field Safety Protocols', 'Proactive Risk Assessment & Management', 'Movement & Transit Safety Protocols', 'Emergency Communications & Crisis Handling']),
          targetSectorsAr: JSON.stringify(['الفرق الميدانية والكوادر الإنسانية', 'منسقو السلامة في المنظمات', 'المتطوعون وفرق الإغاثة']),
          targetSectorsEn: JSON.stringify(['Field Teams & Aid Workers', 'Organizational Safety Focal Points', 'Volunteers & Relief Teams']),
          processAr: JSON.stringify(['تحديد الاحتياج التدريبي للمنظمة', 'تصميم الحقيبة المخصصة', 'التنفيذ التفاعلي والنظري والعملي', 'التقييم القبلي والبعدي وقياس الأثر']),
          processEn: JSON.stringify(['Training Needs Assessment', 'Curriculum Customization', 'Interactive Practical Delivery', 'Pre/Post Assessment & Evaluation']),
          order: 1,
          icon: 'Shield',
        },
        {
          slug: 'humanitarian-negotiation-training',
          titleAr: 'التدريب على التفاوض الإنساني والقبول',
          titleEn: 'Humanitarian Negotiation & Acceptance Training',
          shortDescAr: 'تأهيل الكوادر في مهارات التفاوض الميداني لتسهيل الوصول وبناء القبول المجتمعي.',
          shortDescEn: 'Qualifying cadres in frontline negotiation skills to facilitate humanitarian access and build community acceptance.',
          fullDescAr: 'دورات تخصصية لبناء قدرات مديري المشاريع وفرق الوصول الميداني في مهارات التفاوض الإنساني غير السياسي، صياغة رسائل الوصول، وتطبيق استراتيجيات كسب القبول المجتمعي في المناطق الحساسة.',
          fullDescEn: 'Specialized courses building capacity of project managers and access teams in non-political humanitarian frontline negotiations, access messaging, and implementing community acceptance strategies in sensitive operational settings.',
          featuresAr: JSON.stringify(['أسس التفاوض الإنساني القائم على المبادئ', 'إعداد وصياغة رسائل الوصول الإنساني', 'استراتيجيات كسب القبول المجتمعي', 'محاكاة وسيناريوهات تفاوض ميدانية']),
          featuresEn: JSON.stringify(['Principles-Based Humanitarian Negotiation', 'Access Messaging & Positioning', 'Community Acceptance Strategies', 'Field Negotiation Simulations']),
          targetSectorsAr: JSON.stringify(['منسقو الوصول الإنساني', 'مديرو العمليات الميدانية', 'الشركاء المحليون']),
          targetSectorsEn: JSON.stringify(['Humanitarian Access Officers', 'Field Operations Coordinators', 'Local Implementing Partners']),
          processAr: JSON.stringify(['تحليل تحديات الوصول التفاوضية', 'إعداد سيناريوهات المحاكاة', 'عقد ورش العمل التفاعلية', 'إعداد دليل إرشادي للوصول']),
          processEn: JSON.stringify(['Negotiation Challenge Scoping', 'Simulation Scenario Drafting', 'Interactive Workshop Delivery', 'Access Guidance Debrief']),
          order: 2,
          icon: 'Briefcase',
        }
      ]
    },
    {
      slug: 'psychological-first-aid-referral',
      titleAr: 'الدعم النفسي الأولي والتوعية والإحالة',
      titleEn: 'Psychological First Aid, Awareness & Referral',
      icon: 'HeartHandshake',
      order: 4,
      isActive: true,
      services: [
        {
          slug: 'psychological-first-aid-awareness',
          titleAr: 'التوعية بالدعم النفسي الأولي للعاملين الميدانيين',
          titleEn: 'Psychological First Aid Awareness for Field Workers',
          shortDescAr: 'توعية العاملين في الميدان بأساسيات الدعم النفسي الأولي والتعامل مع الصدمات وضغوط العمل.',
          shortDescEn: 'Sensitizing frontline aid workers on psychological first aid fundamentals, trauma response, and stress management.',
          fullDescAr: 'جلسات وورش توعوية تقدم المفاهيم المهنية الأساسية للدعم النفسي الأولي (PFA) في السياق الإنساني، مع التركيز على التعرف على مؤشرات الإنهاك والصدمات لدى الزملاء والمجتمعات المتأثرة دون وصم.',
          fullDescEn: 'Sensitization sessions and workshops delivering foundational Psychological First Aid (PFA) concepts in humanitarian settings, focusing on identifying signs of acute stress and secondary trauma among colleagues and affected communities without stigmatization.',
          featuresAr: JSON.stringify(['مبادئ الإسعاف النفسي الأولي (انظر، استمع، اربط)', 'التعامل مع الإجهاد الشديد والإنهاك المهني', 'مهارات الاستماع الفعال ودعم الزملاء', 'تعزيز ثقافة الصحة النفسية في الميدان']),
          featuresEn: JSON.stringify(['PFA Principles (Look, Listen, Link)', 'Managing Acute Stress & Burnout', 'Active Listening & Peer Support Skills', 'Cultivating Mental Well-being in the Field']),
          targetSectorsAr: JSON.stringify(['الكوادر الإنسانية الميدانية', 'الفرق الطبية والإغاثية', 'مسؤولو الموارد البشرية والرفاه']),
          targetSectorsEn: JSON.stringify(['Frontline Aid Workers', 'Medical & Relief Personnel', 'HR & Staff Welfare Officers']),
          processAr: JSON.stringify(['تقييم بيئة العمل والضغوط', 'تقديم الجلسات التوعوية التفاعلية', 'توزيع أدلة التهدئة الذاتية', 'قياس الوعي وتقديم التوصيات']),
          processEn: JSON.stringify(['Workplace Stress Contextualization', 'Interactive Sensitization Sessions', 'Self-Care Guides Distribution', 'Awareness Review & Recommendations']),
          order: 1,
          icon: 'Heart',
        },
        {
          slug: 'specialized-referral-and-welfare',
          titleAr: 'مسارات الإحالة التخصصية ومتابعة الرفاه الوظيفي',
          titleEn: 'Specialized Referral Pathways & Staff Welfare',
          shortDescAr: 'تصميم مسارات الإحالة الآمنة لخدمات الدعم النفسي التخصصي المرخصة ومتابعة الرفاه.',
          shortDescEn: 'Designing confidential referral pathways to licensed mental health professionals and welfare follow-up.',
          fullDescAr: 'تقديم الدعم الاستشاري للمنظمات لبناء مسارات إحالة واضحة وسرية تربط العاملين المحتاجين لدعم نفسي متقدم بجهات طبية ونفسية تخصصية مرخصة، مع صون الخصوصية التامة ومتابعة سياسات الرفاه المؤسسي.',
          fullDescEn: 'Providing advisory support to humanitarian entities in establishing confidential, dignified referral mechanisms connecting personnel in need of specialized mental healthcare to licensed clinical providers, safeguarding privacy and institutional welfare policies.',
          featuresAr: JSON.stringify(['تصميم خرائط ومسارات الإحالة التخصصية', 'ضمان سرية وخصوصية البيانات الفردية', 'تحديد الجهات والعيادات المرخصة المعتمدة', 'استشارات سياسات الرفاه الوظيفي للمنظمات']),
          featuresEn: JSON.stringify(['Referral Pathway Architecture', 'Strict Confidentiality & Privacy Protocols', 'Vetted Licensed Clinical Provider Mapping', 'Staff Welfare Advisory & Frameworks']),
          targetSectorsAr: JSON.stringify(['إدارات الموارد البشرية في المنظمات', 'منسقو برامج الرعاية المؤسسية', 'القيادات الإشرافية الميدانية']),
          targetSectorsEn: JSON.stringify(['Humanitarian HR Management', 'Staff Care Coordinators', 'Field Supervisors']),
          processAr: JSON.stringify(['فحص سياسات الرعاية القائمة', 'رسم مسار الإحالة المعتمد', 'تأكيد بروتوكولات حماية البيانات', 'متابعة مؤشرات الرعاية والرفاه']),
          processEn: JSON.stringify(['Existing Care Review', 'Referral Pathway Mapping', 'Data Protection Clearance', 'Welfare Metric Tracking']),
          order: 2,
          icon: 'Users',
        }
      ]
    },
    {
      slug: 'coordination-negotiation-acceptance',
      titleAr: 'التنسيق والتفاوض والقبول المجتمعي',
      titleEn: 'Coordination, Negotiation & Community Acceptance',
      icon: 'Users',
      order: 5,
      isActive: true,
      services: [
        {
          slug: 'community-acceptance-support',
          titleAr: 'دعم بناء القبول المجتمعي والتنسيق',
          titleEn: 'Community Acceptance & Coordination Support',
          shortDescAr: 'استشارات مهنية لبناء الثقة والقبول المجتمعي لتسهيل تنفيذ البرامج الإنسانية.',
          shortDescEn: 'Professional advisory building community trust and acceptance to enable humanitarian program delivery.',
          fullDescAr: 'مساعدة المنظمات والبعثات على تصميم خطط القبول المجتمعي والتواصل الفعال مع الشخصيات والجهات الفاعلة في المجتمعات المحلية، بما يعزز حماية العاملين ويضمن فهم الأهداف الإنسانية المحايدة للأنشطة.',
          fullDescEn: 'Assisting missions and organizations in designing localized community acceptance strategies and constructive engagement with community leaders, enhancing aid worker security and reinforcing community understanding of neutral humanitarian objectives.',
          featuresAr: JSON.stringify(['تقييم مستويات القبول المجتمعي الحالي', 'إعداد استراتيجيات التواصل مع المجتمعات', 'صياغة الرسائل المؤسسية المعززة للثقة', 'رصد مؤشرات التغير في المزاج العام المحلي']),
          featuresEn: JSON.stringify(['Baseline Community Acceptance Audits', 'Community Engagement Strategies', 'Trust-Building Institutional Messaging', 'Local Perception & Sentiment Monitoring']),
          targetSectorsAr: JSON.stringify(['فرق تنفيذ المشاريع الإنسانية', 'مسؤولو العلاقات المجتمعية', 'المنظمات التنموية والإغاثية']),
          targetSectorsEn: JSON.stringify(['Project Implementation Units', 'Community Relations Officers', 'Development & Relief Agencies']),
          processAr: JSON.stringify(['تقييم البيئة المجتمعية المستهدفة', 'تحديد قنوات التواصل الملائمة', 'صياغة خطة القبول المجتمعي', 'المتابعة الميدانية والتقييم الدوري']),
          processEn: JSON.stringify(['Target Community Environment Review', 'Appropriate Channel Identification', 'Acceptance Plan Formulation', 'Continuous Field Feedback']),
          order: 1,
          icon: 'Users',
        },
        {
          slug: 'humanitarian-access-facilitation',
          titleAr: 'تسهيل التنسيق والتفاوض غير السياسي',
          titleEn: 'Humanitarian Access Coordination & Non-Political Negotiation',
          shortDescAr: 'تيسير التنسيق وتسهيل التواصل الفني غير السياسي لتذليل عقبات الوصول الميداني.',
          shortDescEn: 'Facilitating non-political technical dialogue and coordination to overcome field access constraints.',
          fullDescAr: 'تقديم الدعم الاستشاري والمساندة الفنية في صياغة مذكرات ورسائل طلب الوصول الآمن، وتسهيل الاجتماعات التنسيقية مع الأطراف المعنية غير السياسية، بما يتوافق بدقة مع مبادئ الحياد والقوانين النافذة.',
          fullDescEn: 'Providing advisory support and technical facilitation in drafting safe access notification memoranda and convening coordination sessions with relevant non-political actors, adhering strictly to humanitarian neutrality and relevant legal frameworks.',
          featuresAr: JSON.stringify(['إعداد مسودات مذكرات الوصول الفنية', 'تيسير اللقاءات التنسيقية وتحديد المتطلبات', 'الدعم الفني في تجاوز نقاط الانسداد الحركي', 'الالتزام التام بالحياد الإنساني والشفافية']),
          featuresEn: JSON.stringify(['Technical Access Memo Drafting', 'Coordination Dialogue Facilitation', 'Bottleneck Deconfliction Support', 'Strict Adherence to Neutrality & Transparency']),
          targetSectorsAr: JSON.stringify(['منظمات الإغاثة الدولية والمحلية', 'منسقو العمليات واللوجستيات', 'بعثات التقييم الميداني']),
          targetSectorsEn: JSON.stringify(['International & Local Aid Agencies', 'Operations & Logistics Coordinators', 'Field Assessment Missions']),
          processAr: JSON.stringify(['استقبال طبيعة عائق الوصول', 'مراجعة الأطر والمبادئ الحاكمة', 'صياغة رسائل التنسيق الفنية', 'توثيق نتائج التنسيق والوصول']),
          processEn: JSON.stringify(['Access Bottleneck Scoping', 'Principles & Context Review', 'Technical Access Messaging Formulation', 'Coordination Outcomes Documentation']),
          order: 2,
          icon: 'Handshake',
        }
      ]
    },
    {
      slug: 'knowledge-products-reports',
      titleAr: 'المنتجات المعرفية والدراسات والتقارير',
      titleEn: 'Knowledge Products, Studies & Reports',
      icon: 'FileText',
      order: 6,
      isActive: true,
      services: [
        {
          slug: 'periodic-field-reports-bulletins',
          titleAr: 'التقارير الدورية وموجزات مخاطر الحركة',
          titleEn: 'Periodic Field Reports & Movement Risk Briefs',
          shortDescAr: 'إصدار تقارير تحليلية دورية وموجزات أسبوعية وشهرية ترصد تطورات بيئة الوصول.',
          shortDescEn: 'Issuing periodic analytical reports, weekly bulletins, and monthly reviews tracking access trends.',
          fullDescAr: 'إعداد ونشر تقارير دورية منهجية وموجزات ترصد وتحلل ديناميكيات السلامة الميدانية ومسارات الحركة في المحافظات المستهدفة، لتقديم مادة معرفية موثوقة تساعد الشركاء على بناء استراتيجياتهم الميدانية.',
          fullDescEn: 'Drafting and disseminating methodological periodic reports and briefs tracking and analyzing field safety dynamics and movement trends in targeted governorates, providing evidence-based insights to inform partner field strategies.',
          featuresAr: JSON.stringify(['موجزات دورية لحالة المعابر والمسارات', 'تحليل اتجاهات الحوادث والمخاطر', 'جداول بيانية ومؤشرات مقارنة', 'توزيع إلكتروني آمن للمصرح لهم']),
          featuresEn: JSON.stringify(['Periodic Movement & Corridor Briefs', 'Incident Trend & Risk Evolution Analysis', 'Statistical Charts & Comparative Indicators', 'Secure Digital Transmission to Whitelist']),
          targetSectorsAr: JSON.stringify(['مكاتب التنسيق الإنساني', 'إدارات الأمن والسلامة في المنظمات', 'الباحثون وصناع القرار']),
          targetSectorsEn: JSON.stringify(['Humanitarian Coordination Desks', 'Organizational Safety & Security Directors', 'Researchers & Decision Makers']),
          processAr: JSON.stringify(['جمع وتجميع البيانات الميدانية', 'التحليل الإحصائي والسياقي', 'المراجعة والتدقيق المنهجي', 'الإصدار والتوزيع الآمن']),
          processEn: JSON.stringify(['Data Aggregation', 'Statistical & Contextual Analysis', 'Methodical Quality Review', 'Dissemination to Authorized Recipients']),
          order: 1,
          icon: 'FileText',
        },
        {
          slug: 'custom-field-studies-risk-maps',
          titleAr: 'الدراسات الميدانية المخصصة وخرائط المخاطر',
          titleEn: 'Custom Field Studies & Analytical Risk Mapping',
          shortDescAr: 'إعداد دراسات سياقية معمقة وخرائط تفاعلية للمخاطر بحسب الطلب الجغرافي والقطاعي.',
          shortDescEn: 'Drafting in-depth contextual studies and analytical risk heatmaps tailored to geographic requests.',
          fullDescAr: 'إنتاج دراسات مسحية وميدانية معمقة مصممة خصيصاً لتلبية احتياجات المنظمات عند بدء التدخل في مناطق جديدة، تشمل خرائط المخاطر التحليلية، تقييم البيئة الأمنية والمجتمعية، وتوصيات تنفيذية متكاملة.',
          fullDescEn: 'Producing custom-designed field studies and assessments answering specific organizational requirements prior to entering new geographic operational environments, including analytical risk heatmaps, community assessments, and actionable recommendations.',
          featuresAr: JSON.stringify(['دراسات ميدانية سياقية مخصصة', 'خرائط تحليلية لتوزيع مستويات الخطر', 'تقييم بيئة التدخل للمشاريع الجديدة', 'توصيات تنفيذية لإدارة المخاطر']),
          featuresEn: JSON.stringify(['Custom Field Contextual Studies', 'Analytical Risk Distribution Heatmaps', 'New Intervention Area Baseline Assessments', 'Actionable Mitigation Recommendations']),
          targetSectorsAr: JSON.stringify(['المنظمات المصممة لتدخلات جديدة', 'وكالات التقييم والمتابعة', 'المؤسسات المانحة والشركاء']),
          targetSectorsEn: JSON.stringify(['Agencies Launching New Programs', 'Evaluation & Monitoring Missions', 'Donors & Partner Entities']),
          processAr: JSON.stringify(['تحديد نطاق الدراسة المخصصة', 'المسح الميداني وجمع البيانات', 'التحليل المعمق ورسم الخرائط', 'جلسة مناقشة وتسليم الدراسة']),
          processEn: JSON.stringify(['Custom Study Scoping', 'Field Data Collection & Survey', 'In-Depth Analysis & Mapping', 'Debriefing & Final Delivery']),
          order: 2,
          icon: 'Layers',
        }
      ]
    }
  ];

  let totalCategoriesCreated = 0;
  let totalServicesCreated = 0;

  for (const catData of approvedCategories) {
    const { services, ...catFields } = catData;

    const category = await prisma.serviceCategory.upsert({
      where: { slug: catFields.slug },
      update: {
        titleAr: catFields.titleAr,
        titleEn: catFields.titleEn,
        icon: catFields.icon,
        order: catFields.order,
        isActive: true,
      },
      create: {
        titleAr: catFields.titleAr,
        titleEn: catFields.titleEn,
        slug: catFields.slug,
        icon: catFields.icon,
        order: catFields.order,
        isActive: true,
      }
    });
    totalCategoriesCreated++;
    console.log(`\n[+] تصنيف معتمد: ${category.titleAr} (${category.slug})`);

    for (const srvData of services) {
      const service = await prisma.service.upsert({
        where: { slug: srvData.slug },
        update: {
          categoryId: category.id,
          titleAr: srvData.titleAr,
          titleEn: srvData.titleEn,
          shortDescAr: srvData.shortDescAr,
          shortDescEn: srvData.shortDescEn,
          fullDescAr: srvData.fullDescAr,
          fullDescEn: srvData.fullDescEn,
          featuresAr: srvData.featuresAr,
          featuresEn: srvData.featuresEn,
          targetSectorsAr: srvData.targetSectorsAr,
          targetSectorsEn: srvData.targetSectorsEn,
          processAr: srvData.processAr,
          processEn: srvData.processEn,
          icon: srvData.icon,
          order: srvData.order,
          isActive: true,
        },
        create: {
          categoryId: category.id,
          titleAr: srvData.titleAr,
          titleEn: srvData.titleEn,
          slug: srvData.slug,
          shortDescAr: srvData.shortDescAr,
          shortDescEn: srvData.shortDescEn,
          fullDescAr: srvData.fullDescAr,
          fullDescEn: srvData.fullDescEn,
          featuresAr: srvData.featuresAr,
          featuresEn: srvData.featuresEn,
          targetSectorsAr: srvData.targetSectorsAr,
          targetSectorsEn: srvData.targetSectorsEn,
          processAr: srvData.processAr,
          processEn: srvData.processEn,
          icon: srvData.icon,
          order: srvData.order,
          isActive: true,
        }
      });
      totalServicesCreated++;
      console.log(`    - خدمة معتمدة: ${service.titleAr} [${service.slug}]`);
    }
  }

  console.log('\n=============================================================');
  console.log(`✓ اكتمل ترحيل دليل الخدمات بنجاح تام!`);
  console.log(`- إجمالي التصنيفات المعتمدة النشطة: ${totalCategoriesCreated}`);
  console.log(`- إجمالي الخدمات المعتمدة النشطة: ${totalServicesCreated}`);
  console.log('=============================================================\n');
}

main()
  .catch((err) => {
    console.error('✗ خطأ أثناء تشغيل سكربت الترحيل:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
