/**
 * scripts/seed_institutional_content.js
 * 
 * Synchronizes institutional content from the three files:
 * 1. قطاعات المركز.txt -> ContentBlock section: 'activity_fields' (6 sectors)
 * 2. الهيكل التنظيمي للمركز.txt -> ContentBlock section: 'org_structure' (10 structural blocks)
 * 3. محتوى الصفحة الرئيسية.txt -> ContentBlock sections:
 *    - 'identity': vision & mission
 *    - 'principles': 5 guiding values
 *    - 'lifecycle': 7 workflow stages
 * 
 * Applies to:
 * - Local PostgreSQL (port 5433)
 * - Cloud Neon PostgreSQL (facss_clean)
 */

const { PrismaClient } = require('@prisma/client');

const SECTORS_DATA = [
  {
    section: 'activity_fields',
    key: 'sector_field_monitoring',
    titleAr: 'قطاع المراقبة الميدانية وتقديم الاستشارات الأمنية',
    titleEn: 'Field Monitoring & Security Advisory Sector',
    descriptionAr: 'الهدف المحوري: توفير تغطية معلوماتية واستطلاعية مستمرة (ميدانياً ورقمياً)، ورصد وتحليل المصادر المفتوحة، وتحويل البيانات إلى تنبيهات واستشارات عملياتية واستباقية لحماية بيئات العمل.\nالأهمية الاستراتيجية: يُعد القطاع عين المؤسسة الاستباقية؛ حيث يمنح الإدارة والشركاء القدرة على التنبؤ بالخطر قبل وقوعه، واتخاذ قرارات مبنية على معلومات دقيقة ومحدثة لحماية الكوادر والأصول.',
    descriptionEn: 'Core Objective: Providing continuous intelligence and reconnaissance coverage (field & digital), OSINT monitoring, and proactive alerts to protect operating environments.\nStrategic Importance: Serves as the organization proactive eye, empowering leadership and partners to anticipate risks and protect assets and personnel.',
    icon: 'ShieldAlert',
    link: '/services',
    order: 1,
    isVisible: true,
  },
  {
    section: 'activity_fields',
    key: 'sector_field_studies',
    titleAr: 'قطاع الدراسات الميدانية وإدارة المخاطر',
    titleEn: 'Field Studies & Risk Management Sector',
    descriptionAr: 'الهدف المحوري: تقديم أبحاث أمنية واجتماعية تحليليّة وتقييمات شمولية تدعم اتخاذ القرارات الاستثمارية والعملياتية، وتعمل على الحد من المخاطر وضمان جودة واستدامة المشاريع.\nالأهمية الاستراتيجية: يُمكّن عمال الإغاثة الإنسانية والبعثات والمستثمرين وصناع القرار من التوسع والعمل في البيئات المعقدة بثقة، عبر تحويل التحديات الميدانية إلى فرص مدروسة ومحمية.',
    descriptionEn: 'Core Objective: Delivering analytical security and social research and holistic assessments supporting investment and operational decision-making.\nStrategic Importance: Enables humanitarian workers, missions, and investors to operate in complex environments with confidence.',
    icon: 'SearchCheck',
    link: '/research',
    order: 2,
    isVisible: true,
  },
  {
    section: 'activity_fields',
    key: 'sector_maritime_analysis',
    titleAr: 'قطاع الدراسات والتحليلات البحرية (البحر الأحمر، باب المندب وخليج عدن)',
    titleEn: 'Maritime Studies & Analysis Sector (Red Sea, Bab al-Mandab & Gulf of Aden)',
    descriptionAr: 'الهدف المحوري: رصد وتتبع المتغيرات والتطورات الأمنية البحرية، وتحليل أثرها على الملاحة وسلاسل الإمداد والاستقرار المحلي والإقليمي، ودراسة التنبؤات الأمنية للشركات الملاحية والجهات ذات العلاقة.\nالأهمية الاستراتيجية: توفير رؤية استراتيجية دقيقة لأحد أهم الممرات الملاحية في العالم، مما يساعد القطاعات الملاحية والتجارية على تأمين مساراتها وإدارة أزماتها البحرية بفاعلية.',
    descriptionEn: 'Core Objective: Monitoring maritime security developments and analyzing impacts on navigation, supply chains, and regional stability.\nStrategic Importance: Providing strategic foresight for vital global maritime corridors to secure commercial shipping routes.',
    icon: 'Compass',
    link: '/research',
    order: 3,
    isVisible: true,
  },
  {
    section: 'activity_fields',
    key: 'sector_training_coordination',
    titleAr: 'قطاع التدريب والتأهيل والتنسيق المجتمعي',
    titleEn: 'Training, Capacity Building & Community Coordination Sector',
    descriptionAr: 'الهدف المحوري: رفع كفاءة وجاهزية الكوادر الأمنية وعمال الإغاثة الإنسانية في الميدان، وتسهيل الوصول الإنساني والعملياتي من خلال بناء شراكات مجتمعية وتكتيكية متينة.\nالأهمية الاستراتيجية: يضمن بناء جسور الثقة مع المجتمعات المحلية، ويحقق أعلى مستويات الجاهزية للكوادر البشرية لتنفيذ المهام بأمان وسلاسة في بيئة عمل خطرة ومعقدة.',
    descriptionEn: 'Core Objective: Enhancing readiness of security personnel and humanitarian workers, facilitating access through community partnerships.\nStrategic Importance: Builds bridges of trust with local communities and ensures operational readiness in high-risk environments.',
    icon: 'GraduationCap',
    link: '/training',
    order: 4,
    isVisible: true,
  },
  {
    section: 'activity_fields',
    key: 'sector_systems_supply',
    titleAr: 'قطاع توريد أنظمة السلامة والأمن والحلول التقنية',
    titleEn: 'Safety & Security Systems Supply & Tech Solutions Sector',
    descriptionAr: 'الهدف المحوري: توفير وتكامل الأنظمة التقنية والمعدات الميدانية المتطورة لرفع الجاهزية التشغيلية للأنظمة الأمنية والسلامة لكافة القطاعات.\nالأهمية الاستراتيجية: يُشكل خط الدفاع التكنولوجي الأساسي الذي يسد الفجوات التشغيلية، ويضمن رفع كفاءة وسائل الحماية بأحدث الممارسات والتقنيات العالمية.',
    descriptionEn: 'Core Objective: Providing advanced integrated security systems and field equipment to elevate operational readiness across all sectors.\nStrategic Importance: Acts as a primary technological defense line closing operational gaps with international best practices.',
    icon: 'Settings',
    link: '/services',
    order: 5,
    isVisible: true,
  },
  {
    section: 'activity_fields',
    key: 'sector_security_protection',
    titleAr: 'قطاع الحراسات وحماية الشخصيات والتنقل الآمن',
    titleEn: 'Guarding, VIP Protection & Secure Movement Sector',
    descriptionAr: 'الهدف المحوري: تقديم حلول أمنية متكاملة ترتكز على مبادئ الوقاية والاهتمام بالجاهزية لحماية المقرات والأصول، وتوفير وسائل نقل ملائمة حسب طبيعة جغرافية المناطق ودرجة خطورتها لضمان تأمين التحركات الميدانية واستمرارية الأعمال.\nالأهمية الاستراتيجية: يوفر بيئة آمنة ومحمية بالكامل تضمن للمؤسسات والأفراد ممارسة أعمالهم وتحركاتهم دون تعطيل أو مخاطر تؤثر على السلامة الجسدية أو المادية.',
    descriptionEn: 'Core Objective: Delivering comprehensive protection solutions for sites, assets, and personnel, ensuring secure transit and business continuity.\nStrategic Importance: Ensures a fully secured operational perimeter for organizations and teams to operate without physical risks.',
    icon: 'Shield',
    link: '/services',
    order: 6,
    isVisible: true,
  },
];

const ORG_STRUCTURE_DATA = [
  {
    section: 'org_structure',
    key: 'org_governance_intro',
    titleAr: 'مقدمة الهيكل التنظيمي والحوكمة المؤسسية',
    titleEn: 'Organizational Structure & Governance Introduction',
    descriptionAr: 'يستند الهيكل التنظيمي لـ "مركز الحلول المتكاملة للأمن والسلامة والدراسات الميدانية والاستراتيجية" إلى مبادئ الحوكمة المؤسسية، ووضوح خطوط السلطة والمسؤولية، والفصل التام بين الأنشطة التشغيلية والأنشطة البحثية الاستراتيجية لضمان الحيادية والمهنية المطلقة، مع الالتزام التام بالتنسيق المباشر مع الأجهزة الرسمية المختصة.',
    descriptionEn: 'The organizational structure of FACSS is based on corporate governance principles, clear lines of authority and responsibility, and complete separation of operational activities from strategic research activities to ensure absolute neutrality and professionalism.',
    icon: 'Building2',
    link: null,
    order: 1,
    isVisible: true,
  },
  {
    section: 'org_structure',
    key: 'org_general_manager',
    titleAr: 'القيادة العليا — المدير العام / المؤسس',
    titleEn: 'Top Leadership — General Manager / Founder',
    descriptionAr: 'القيادة الإستراتيجية للمركز، رسم السياسات العامة، وتوجيه مسار التطور المؤسسي، وتمثيل المركز رسمياً أمام الجهات الحكومية والمنظمات الدولية.',
    descriptionEn: 'Strategic leadership of the center, setting general policies, guiding institutional development, and officially representing the center before government entities and international organizations.',
    icon: 'Target',
    link: null,
    order: 2,
    isVisible: true,
  },
  {
    section: 'org_structure',
    key: 'org_strategic_studies',
    titleAr: 'قطاع الدراسات والاستراتيجيات (وحدة مستقلة)',
    titleEn: 'Strategic Studies Sector (Independent Unit)',
    descriptionAr: 'مدير قطاع الأبحاث والدراسات الاستراتيجية: إدارة الذراع البحثية والتحليلية بمعايير أكاديمية صارمة، الالتزام التام بالحياد المهني، وحظر تضارب المصالح لضمان موضوعية المخرجات.',
    descriptionEn: 'Director of Research & Strategic Studies: Managing the research and analytical arm with strict academic standards, absolute commitment to professional neutrality, and prohibition of conflict of interest.',
    icon: 'Compass',
    link: null,
    order: 3,
    isVisible: true,
  },
  {
    section: 'org_structure',
    key: 'org_finance_accounting',
    titleAr: 'الإدارات المساندة — المحاسب المالي',
    titleEn: 'Supporting Administrations — Financial Accountant',
    descriptionAr: 'إدارة الدورة المحاسبية، إعداد الميزانيات، المتابعة المالية والضريبية، وإصدار التقارير المالية الدورية لضمان الانضباط والشفافية المالية.',
    descriptionEn: 'Managing the accounting cycle, budgeting, financial and tax monitoring, and periodic financial reporting.',
    icon: 'Scale',
    link: null,
    order: 4,
    isVisible: true,
  },
  {
    section: 'org_structure',
    key: 'org_reception_support',
    titleAr: 'الإدارات المساندة — الاستقبال والخدمات المساندة',
    titleEn: 'Supporting Administrations — Reception & Support Officer',
    descriptionAr: 'استقبال العملاء، تنظيم المواعيد، إدارة الاتصالات الإدارية، وتنسيق الخدمات المكتبية واللوجستية المساندة.',
    descriptionEn: 'Receiving clients, organizing appointments, managing administrative communications, and coordinating supporting office services.',
    icon: 'Users2',
    link: null,
    order: 5,
    isVisible: true,
  },
  {
    section: 'org_structure',
    key: 'org_legal_compliance',
    titleAr: 'الشؤون القانونية والامتثال',
    titleEn: 'Legal Affairs & Compliance',
    descriptionAr: 'مراجعة وصياغة العقود والاتفاقيات، ضمان الالتزام باللوائح والتشريعات النافذة، وتطبيق معايير «واجب الرعاية» (Duty of Care).',
    descriptionEn: 'Reviewing and drafting contracts, ensuring compliance with active regulations, and applying Duty of Care standards.',
    icon: 'ShieldAlert',
    link: null,
    order: 6,
    isVisible: true,
  },
  {
    section: 'org_structure',
    key: 'org_field_coordinators',
    titleAr: 'القطاعات التشغيلية — منسقون ميدانيون (وظيفتان)',
    titleEn: 'Specialized Operational Sectors — Field Coordinators (2 Posts)',
    descriptionAr: 'إدارة وتنسيق المهام الميدانية، التواصل المباشر مع الفرق على الأرض، إعداد تقارير الرصد اليومية، وتسهيل الوصول الإنساني والعملياتي الآمن.',
    descriptionEn: 'Managing and coordinating field tasks, communicating with ground teams, preparing daily monitoring reports, and facilitating humanitarian and operational access.',
    icon: 'Activity',
    link: null,
    order: 7,
    isVisible: true,
  },
  {
    section: 'org_structure',
    key: 'org_ops_security_manager',
    titleAr: 'القطاعات التشغيلية — مدير عمليات وأمن (مرحلة ثانية)',
    titleEn: 'Specialized Operational Sectors — Operations & Security Manager (Phase 2)',
    descriptionAr: 'التخطيط التشغيلي للخطط الأمنية، إدارة غرف العمليات والإنذار المبكر، والإشراف المباشر على فرق الحراسات وتأمين التحركات الميدانية.',
    descriptionEn: 'Operational planning of security schemes, management of operations and early warning rooms, and supervision of guarding and safe movement teams.',
    icon: 'Shield',
    link: null,
    order: 8,
    isVisible: true,
  },
  {
    section: 'org_structure',
    key: 'org_research_independence',
    titleAr: 'ضوابط الحوكمة — استقلالية البحث والحياد',
    titleEn: 'Governance Controls — Research Independence',
    descriptionAr: 'يُفصل قطاع الأبحاث والدراسات الاستراتيجية إدارياً عن القطاعات التجارية وتنفيذ العمليات، لمنع أي تأثير تجاري على نزاهة وموضوعية المخرجات البحثية.',
    descriptionEn: 'The research and strategic studies sector is administratively separated from commercial and operational sectors to prevent any commercial influence on the integrity and objectivity of research outputs.',
    icon: 'Layers',
    link: null,
    order: 9,
    isVisible: true,
  },
  {
    section: 'org_structure',
    key: 'org_official_compliance',
    titleAr: 'ضوابط الحوكمة — الامتثال والتنسيق الرسمي مع الدولة',
    titleEn: 'Governance Controls — Compliance & Official Coordination',
    descriptionAr: 'تخضع كافة الأنشطة التشغيلية والحراسات والتدريب للترخيص الرسمي والتنسيق المسبق والمستمر مع الجهات الحكومية والأمنية المختصة في الدولة.',
    descriptionEn: 'All operational activities, guarding, and training are subject to official licensing and prior, continuous coordination with the relevant government and security authorities.',
    icon: 'BadgeCheck',
    link: null,
    order: 10,
    isVisible: true,
  },
];

const HOMEPAGE_AND_IDENTITY_DATA = [
  // 1. Identity (Vision & Mission)
  {
    section: 'identity',
    key: 'vision',
    titleAr: 'الرؤية',
    titleEn: 'Vision',
    descriptionAr: 'الريادة والتميز الإقليمي في تقديم خدمات الأمن والسلامة والدراسات الميدانية المتكاملة وفق أحدث المنهجيات المعتمدة.',
    descriptionEn: 'Regional leadership and excellence in providing integrated safety, security, and field studies in accordance with accredited methodologies.',
    icon: 'Target',
    link: null,
    order: 1,
    isVisible: true,
  },
  {
    section: 'identity',
    key: 'mission',
    titleAr: 'الرسالة',
    titleEn: 'Mission',
    descriptionAr: 'توفير بيئة آمنة وحلول ميدانية مبتكرة تدعمها دراسات دقيقة ومعايير عالمية لحماية الأرواح والممتلكات واستدامة الأعمال.',
    descriptionEn: 'Providing a safe environment and innovative field solutions backed by rigorous studies and global standards to protect lives, assets, and business continuity.',
    icon: 'Compass',
    link: null,
    order: 2,
    isVisible: true,
  },

  // 2. Principles & Values
  {
    section: 'principles',
    key: 'value_integrity',
    titleAr: 'النزاهة والشفافية',
    titleEn: 'Integrity & Transparency',
    descriptionAr: 'الالتزام التام بالأمانة المهنية والمصداقية العالية في كافة التعاملات والأنشطة الميدانية والمؤسسية.',
    descriptionEn: 'Absolute commitment to professional integrity and high credibility across all operational and institutional engagements.',
    icon: 'Scale',
    link: null,
    order: 1,
    isVisible: true,
  },
  {
    section: 'principles',
    key: 'value_professionalism',
    titleAr: 'الاحترافية والتميز',
    titleEn: 'Professionalism & Excellence',
    descriptionAr: 'تطبيق أعلى معايير الجودة والكفاءة في تقديم خدمات الأمن والسلامة والدراسات الميدانية.',
    descriptionEn: 'Applying the highest standards of quality and efficiency in delivering safety, security, and field research services.',
    icon: 'BadgeCheck',
    link: null,
    order: 2,
    isVisible: true,
  },
  {
    section: 'principles',
    key: 'value_responsibility',
    titleAr: 'المسؤولية والحفاظ على الأرواح',
    titleEn: 'Social Responsibility & Safety',
    descriptionAr: 'اعتبار حماية الأرواح والممتلكات وبناء بيئة آمنة أولوية قصوى ومسؤولية أخلاقية لا تتجزأ.',
    descriptionEn: 'Treating life protection, asset preservation, and safe environment building as an utmost priority and indivisible ethical obligation.',
    icon: 'Shield',
    link: null,
    order: 3,
    isVisible: true,
  },
  {
    section: 'principles',
    key: 'value_agility',
    titleAr: 'الاستجابة السريعة والمرونة',
    titleEn: 'Rapid Response & Agility',
    descriptionAr: 'الجاهزية التامة للتعامل الفوري مع الطوارئ والمتغيرات الميدانية بكفاءة وحرص عالٍ.',
    descriptionEn: 'Full readiness for immediate response to emergencies and dynamic field developments with efficiency and high vigilance.',
    icon: 'Activity',
    link: null,
    order: 4,
    isVisible: true,
  },
  {
    section: 'principles',
    key: 'value_innovation',
    titleAr: 'الابتكار والتطوير المستمر',
    titleEn: 'Innovation & Improvement',
    descriptionAr: 'تبني أحدث الحلول والتقنيات وتطوير المنهجيات الميدانية باستمرار لمواكبة التحديات المستجدة.',
    descriptionEn: 'Adopting modern solutions and technologies, continually evolving field methodologies to keep pace with emerging challenges.',
    icon: 'Compass',
    link: null,
    order: 5,
    isVisible: true,
  },

  // 3. Workflow Stages (Lifecycle)
  {
    section: 'lifecycle',
    key: 'stage_1',
    titleAr: '1. رصد وتجميع البيانات الأولية',
    titleEn: '1. Data Collection & Field Gathering',
    descriptionAr: 'جمع وتوثيق البيانات والمعلومات الميدانية من مصادرها الأولية بدقة عالية.',
    descriptionEn: 'Collecting and documenting primary field data and information from original sources with high accuracy.',
    icon: 'SearchCheck',
    link: null,
    order: 1,
    isVisible: true,
  },
  {
    section: 'lifecycle',
    key: 'stage_2',
    titleAr: '2. الفحص والتحليل الأولي',
    titleEn: '2. Initial Screening & Analysis',
    descriptionAr: 'معالجة البيانات وتصنيفها للتحقق من الموثوقية والدقة.',
    descriptionEn: 'Processing and categorizing data to verify credibility and accuracy.',
    icon: 'Layers',
    link: null,
    order: 2,
    isVisible: true,
  },
  {
    section: 'lifecycle',
    key: 'stage_3',
    titleAr: '3. تقييم المخاطر وتحديد الاحتياجات',
    titleEn: '3. Risk Assessment & Gap Analysis',
    descriptionAr: 'تحليل المخاطر المحتملة وتحديد متطلبات السلامة والأمن الميداني.',
    descriptionEn: 'Analyzing potential hazards and pinpointing field safety and operational requirements.',
    icon: 'ShieldAlert',
    link: null,
    order: 3,
    isVisible: true,
  },
  {
    section: 'lifecycle',
    key: 'stage_4',
    titleAr: '4. إعداد الدراسات الميدانية',
    titleEn: '4. Field Studies Development',
    descriptionAr: 'صياغة دراسات شاملة تدعم اتخاذ القرار وتستند إلى أدلة معيارية.',
    descriptionEn: 'Drafting rigorous comprehensive field studies rooted in empirical evidence to support strategic decision-making.',
    icon: 'Compass',
    link: null,
    order: 4,
    isVisible: true,
  },
  {
    section: 'lifecycle',
    key: 'stage_5',
    titleAr: '5. تصميم الخطط والحلول',
    titleEn: '5. Solution Design & Planning',
    descriptionAr: 'بلورة الخطط التكتيكية والتشغيلية المناسبة لسير العمل وتفادي المخاطر.',
    descriptionEn: 'Formulating tactical and operational frameworks tailored to workflow continuity and risk mitigation.',
    icon: 'Target',
    link: null,
    order: 5,
    isVisible: true,
  },
  {
    section: 'lifecycle',
    key: 'stage_6',
    titleAr: '6. التنفيذ والمتابعة الميدانية',
    titleEn: '6. Execution & On-Site Monitoring',
    descriptionAr: 'تطبيق الأنشطة والحلول ميدانياً مع المتابعة والإشراف المستمر.',
    descriptionEn: 'Deploying on-ground solutions and actions accompanied by continuous supervision and real-time oversight.',
    icon: 'Activity',
    link: null,
    order: 6,
    isVisible: true,
  },
  {
    section: 'lifecycle',
    key: 'stage_7',
    titleAr: '7. التقييم والتقرير النهائي',
    titleEn: '7. Final Evaluation & Reporting',
    descriptionAr: 'مراجعة المخرجات وإعداد التقرير النهائي للمنتج الميداني والمؤشرات المتحققة.',
    descriptionEn: 'Reviewing outcomes and delivering comprehensive closeout reporting with verified operational KPIs.',
    icon: 'BadgeCheck',
    link: null,
    order: 7,
    isVisible: true,
  },
];

const ALL_NEW_BLOCKS = [
  ...SECTORS_DATA,
  ...ORG_STRUCTURE_DATA,
  ...HOMEPAGE_AND_IDENTITY_DATA,
];

async function syncToDatabase(prisma, dbLabel) {
  console.log(`\n=============================================================`);
  console.log(`  SYNCING TO ${dbLabel}`);
  console.log(`=============================================================`);

  let count = 0;
  for (const item of ALL_NEW_BLOCKS) {
    await prisma.contentBlock.upsert({
      where: {
        section_key: {
          section: item.section,
          key: item.key,
        },
      },
      update: {
        titleAr: item.titleAr,
        titleEn: item.titleEn,
        descriptionAr: item.descriptionAr,
        descriptionEn: item.descriptionEn,
        icon: item.icon,
        link: item.link,
        order: item.order,
        isVisible: item.isVisible,
        updatedByName: 'المدير العام (FACSS Super Admin)',
      },
      create: {
        section: item.section,
        key: item.key,
        titleAr: item.titleAr,
        titleEn: item.titleEn,
        descriptionAr: item.descriptionAr,
        descriptionEn: item.descriptionEn,
        icon: item.icon,
        link: item.link,
        order: item.order,
        isVisible: item.isVisible,
        updatedByName: 'المدير العام (FACSS Super Admin)',
      },
    });
    count++;
    console.log(`  ✓ [${item.section}] ${item.key} — ${item.titleAr}`);
  }

  const total = await prisma.contentBlock.count();
  const bySection = await prisma.contentBlock.groupBy({
    by: ['section'],
    _count: { key: true },
  });

  console.log(`\n  ★ Synced ${count} blocks to ${dbLabel}. Total ContentBlocks: ${total}`);
  console.log(`  ★ Breakdown by section:`);
  for (const s of bySection) {
    console.log(`    - ${s.section}: ${s._count.key} blocks`);
  }
}

async function main() {
  console.log('Starting Institutional Content Seed...');
  console.log(`Total blocks to insert/update: ${ALL_NEW_BLOCKS.length}`);

  // 1. Local Database
  const localPrisma = new PrismaClient();
  try {
    await syncToDatabase(localPrisma, 'LOCAL POSTGRESQL (Port 5433)');
  } catch (err) {
    console.error('Local sync failed:', err);
  } finally {
    await localPrisma.$disconnect();
  }

  // 2. Cloud Neon Database
  const neonUrl = "postgresql://neondb_owner:npg_JAcyQoO0m5Gs@ep-plain-river-b1x6n7oh-pooler.c-5.eu-central-1.aws.neon.tech/facss_clean?sslmode=require&connect_timeout=30";
  const neonPrisma = new PrismaClient({ datasources: { db: { url: neonUrl } } });
  try {
    await syncToDatabase(neonPrisma, 'CLOUD NEON POSTGRESQL (facss_clean)');
  } catch (err) {
    console.error('Neon sync failed:', err);
  } finally {
    await neonPrisma.$disconnect();
  }

  console.log('\nAll synchronization completed successfully!');
}

main().catch(console.error);
