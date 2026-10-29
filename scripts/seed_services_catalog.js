/**
 * scripts/seed_services_catalog.js
 * 
 * Seeds the 6 institutional sectors as ServiceCategory records,
 * and populates their official field services under each sector.
 * 
 * Synchronizes to:
 * 1. Local PostgreSQL (port 5433)
 * 2. Cloud Neon PostgreSQL (facss_clean)
 */

const { PrismaClient } = require('@prisma/client');

const SECTORS_CATALOG = [
  {
    slug: 'sector_field_monitoring',
    titleAr: 'قطاع المراقبة الميدانية وتقديم الاستشارات الأمنية',
    titleEn: 'Field Monitoring & Security Advisory Sector',
    icon: 'ShieldAlert',
    order: 1,
    services: [
      {
        slug: 'early-warning-incident-alerts',
        titleAr: 'نظام الرصد الميداني والتنبيه المبكر بالحوادث',
        titleEn: 'Field Monitoring & Early Incident Warning System',
        shortDescAr: 'تغطية معلوماتية واستطلاعية مستمرة لرصد المتغيرات الميدانية وإصدار تنبيهات أمنية فورية مبنية على مصادر موثوقة.',
        shortDescEn: 'Continuous intelligence and reconnaissance coverage monitoring field developments and issuing verified security alerts.',
        fullDescAr: 'خدمة رصد ميداني واستخباري متكاملة تشمل متابعة التطورات الأمنية والاضطرابات الميدانية على مدار الساعة، وإصدار تنبيهات مبكرة ومذكرات أمنية عاجلة للبعثات والمنظمات لحماية الكوادر والأصول وتفادي المخاطر قبل وقوعها.',
        fullDescEn: 'Integrated field and intelligence monitoring covering 24/7 security developments, issuing early alerts and urgent operational security flashes to protect mission personnel and organizational assets.',
        featuresAr: JSON.stringify([
          'رصد استباقي على مدار الساعة (24/7) عبر شبكة ميدانية موثوقة',
          'تنبيهات فورية ومصنفة بحسب درجة الخطورة والموقع الجغرافي',
          'تقارير أمنية موجزة تدعم قرارات سلامة الحركة والعمل الميداني'
        ]),
        featuresEn: JSON.stringify([
          '24/7 proactive monitoring through a trusted field network',
          'Instant severity and location-classified security alerts',
          'Concise security flashes supporting movement and field safety decisions'
        ]),
        targetSectorsAr: JSON.stringify(['المنظمات الدولية (INGOs)', 'وكالات الأمم المتحدة', 'الشركات والبعثات الميدانية']),
        targetSectorsEn: JSON.stringify(['INGOs', 'UN Agencies', 'Companies & Field Missions']),
        icon: 'ShieldAlert',
        order: 1,
      },
      {
        slug: 'security-consulting-protocols',
        titleAr: 'الاستشارات الأمنية وتدقيق بروتوكولات السلامة',
        titleEn: 'Security Advisory & Safety Protocol Auditing',
        shortDescAr: 'تقديم استشارات عملياتية استباقية وتدقيق خطط الطوارئ والسلامة الميدانية للمنشآت والبعثات.',
        shortDescEn: 'Delivering proactive operational advisory and auditing emergency and field safety plans for facilities and missions.',
        fullDescAr: 'تقييم ومراجعة بروتوكولات السلامة الحالية للمنظمات والمؤسسات، وتطوير خطط الطوارئ والإخلاء وتقديم توصيات تنفيذية تضمن الامتثال لأعلى معايير واجب الرعاية (Duty of Care) وتحد من المخاطر التشغيلية.',
        fullDescEn: 'Reviewing and auditing current organizational safety protocols, upgrading contingency and evacuation plans, and delivering actionable recommendations ensuring Duty of Care compliance.',
        featuresAr: JSON.stringify([
          'تدقيق وتطوير خطط الطوارئ وإجراءات الإخلاء الميداني',
          'مراجعة وتحديث متطلبات واجب الرعاية (Duty of Care)',
          'استشارات أمنية عملياتية مخصصة لبيئات العمل الحساسة'
        ]),
        featuresEn: JSON.stringify([
          'Emergency and evacuation contingency planning audit',
          'Duty of Care compliance review and upgrade',
          'Custom operational security advisory for sensitive operating environments'
        ]),
        targetSectorsAr: JSON.stringify(['المنظمات غير الحكومية', 'الشركات التجارية والمؤسسات', 'البعثات الدبلوماسية والإغاثية']),
        targetSectorsEn: JSON.stringify(['NGOs', 'Commercial Corporations', 'Diplomatic & Relief Missions']),
        icon: 'Shield',
        order: 2,
      },
    ],
  },
  {
    slug: 'sector_field_studies',
    titleAr: 'قطاع الدراسات الميدانية وإدارة المخاطر',
    titleEn: 'Field Studies & Risk Management Sector',
    icon: 'SearchCheck',
    order: 2,
    services: [
      {
        slug: 'field-risk-assessment-matrices',
        titleAr: 'تقييم المخاطر الميدانية ومصفوفات التهديد',
        titleEn: 'Field Risk Assessment & Threat Matrices',
        shortDescAr: 'تحليل أمني تحليلي شامل لتقييم مستويات التهديد وتحديد مصفوفات المخاطر والفرص في بيئات العمل المعقدة.',
        shortDescEn: 'Comprehensive analytical security analysis assessing threat levels and formulating risk matrices in complex operational environments.',
        fullDescAr: 'إعداد دراسات أمنية واجتماعية وتقييمات شمولية تدعم اتخاذ القرارات الاستثمارية والعملياتية، وتعمل على الحد من المخاطر وضمان جودة واستدامة المشاريع الإنسانية والتنموية في مختلف المحافظات.',
        fullDescEn: 'Developing comprehensive security and social research and assessments supporting investment and operational decisions, ensuring the sustainability of humanitarian and developmental projects.',
        featuresAr: JSON.stringify([
          'مصفوفات تقييم مخاطر شاملة ومعيارية تغطي النواحي الأمنية والاجتماعية',
          'تحليل معمق للسياق المحلي والجهات الفاعلة ومسارات الحركة الحيوية',
          'توصيات تخفيف عملية وقابلة للتنفيذ تدعم استمرارية المشاريع'
        ]),
        featuresEn: JSON.stringify([
          'Standardized comprehensive risk matrices covering security and social aspects',
          'In-depth local context, stakeholder, and transit corridor mapping',
          'Actionable practical mitigation recommendations supporting project continuity'
        ]),
        targetSectorsAr: JSON.stringify(['صناع القرار والمستثمرون', 'المنظمات الإنسانية والتنموية', 'المؤسسات المانحة']),
        targetSectorsEn: JSON.stringify(['Decision Makers & Investors', 'Humanitarian & Development NGOs', 'Donor Agencies']),
        icon: 'SearchCheck',
        order: 1,
      },
      {
        slug: 'third-party-monitoring-tpm',
        titleAr: 'المراقبة والتقييم الميداني المستقل من طرف ثالث (TPM)',
        titleEn: 'Independent Third-Party Monitoring (TPM)',
        shortDescAr: 'التحقق المستقل والمحايد من تنفيذ المشاريع وضمان الجودة والامتثال في المناطق التي يصعب الوصول إليها.',
        shortDescEn: 'Independent neutral verification of project implementation and quality compliance in hard-to-reach areas.',
        fullDescAr: 'خدمات تتبع ورصد ميداني مستقلة لمشاريع الإغاثة والتنمية من خلال فرق استقصاء ميدانية مؤهلة، لضمان وصول المساعدات لمستحقيها ومطابقة المخرجات مع خطط المشاريع وتزويد المانحين بتقارير موثوقة ومحايدة.',
        fullDescEn: 'Independent field tracking for relief and development projects via qualified local field teams, ensuring aid delivery to eligible beneficiaries and matching project outputs to approved plans.',
        featuresAr: JSON.stringify([
          'تحقق ميداني محايد وموثق بالأدلة والزيارات الميدانية',
          'تغطية واسعة للمناطق النائية والحساسة التي يصعب وصول الفرق الدولية إليها',
          'تقارير تقييم دورية ومستقلة وفق أرقى المعايير المؤسسية'
        ]),
        featuresEn: JSON.stringify([
          'Neutral evidence-based field verification and on-site visits',
          'Extensive reach across remote and hard-to-access field locations',
          'Periodic independent evaluation reporting matching international standards'
        ]),
        targetSectorsAr: JSON.stringify(['الجهات المانحة الدولية', 'المنظمات الإنسانية الرئيسية', 'مشاريع التنمية المستدامة']),
        targetSectorsEn: JSON.stringify(['International Donors', 'Major Humanitarian Agencies', 'Sustainable Development Projects']),
        icon: 'BadgeCheck',
        order: 2,
      },
    ],
  },
  {
    slug: 'sector_maritime_analysis',
    titleAr: 'قطاع الدراسات والتحليلات البحرية (البحر الأحمر، باب المندب وخليج عدن)',
    titleEn: 'Maritime Studies & Analysis Sector (Red Sea, Bab al-Mandab & Gulf of Aden)',
    icon: 'Compass',
    order: 3,
    services: [
      {
        slug: 'maritime-risk-navigation-analysis',
        titleAr: 'رصد وتحليل المخاطر الملاحية والأمن البحري',
        titleEn: 'Maritime Navigation Risk & Security Analysis',
        shortDescAr: 'رصد وتتبع المتغيرات الأمنية البحرية وتحليل أثرها على الملاحة وسلاسل الإمداد في مضيق باب المندب وخليج عدن.',
        shortDescEn: 'Tracking maritime security shifts and analyzing impacts on shipping and supply chains in Bab al-Mandab and the Gulf of Aden.',
        fullDescAr: 'توفير رؤية استراتيجية دقيقة لأحد أهم الممرات الملاحية في العالم، تشمل دراسات تحليلية وتنبؤات أمنية حول سلامة الممرات البحرية والموانئ وسلاسل الإمداد، مما يساعد الشركات الملاحية والتجارية على تأمين مساراتها وإدارة أزماتها بفاعلية.',
        fullDescEn: 'Providing strategic foresight for one of the world most critical maritime corridors, including analytical studies and security forecasts on maritime routes, ports, and global supply chains.',
        featuresAr: JSON.stringify([
          'تقييمات ملاحية دورية لمضيق باب المندب وخليج عدن والبحر الأحمر',
          'تحليل المخاطر المؤثرة على سلاسل الإمداد والشحن التجاري الدولي',
          'توصيات أمنية ملاحية واستباقية للخطوط البحرية وإدارة الأزمات'
        ]),
        featuresEn: JSON.stringify([
          'Periodic maritime navigation assessments for Bab al-Mandab and Gulf of Aden',
          'Risk analysis impacting commercial shipping and international supply lines',
          'Proactive maritime security advisories and crisis management support'
        ]),
        targetSectorsAr: JSON.stringify(['شركات الملاحة والنقل البحري', 'شركات التأمين التجاري والبحري', 'المؤسسات الاقتصادية والموانئ']),
        targetSectorsEn: JSON.stringify(['Shipping & Maritime Lines', 'Commercial Maritime Insurers', 'Economic Ports & Maritime Authorities']),
        icon: 'Compass',
        order: 1,
      },
    ],
  },
  {
    slug: 'sector_training_coordination',
    titleAr: 'قطاع التدريب والتأهيل والتنسيق المجتمعي',
    titleEn: 'Training, Capacity Building & Community Coordination Sector',
    icon: 'GraduationCap',
    order: 4,
    services: [
      {
        slug: 'field-safety-heat-training',
        titleAr: 'التدريب على السلامة الميدانية والأمن الشخصي (HEAT / Field Safety)',
        titleEn: 'Hostile Environment Awareness & Field Safety Training',
        shortDescAr: 'رفع كفاءة وجاهزية الكوادر الميدانية وعمال الإغاثة للتعامل مع التهديدات وحالات الطوارئ في البيئات المعقدة.',
        shortDescEn: 'Enhancing the operational readiness of field staff and aid workers in hostile and volatile environments.',
        fullDescAr: 'برامج تدريبية وتطبيقية تحاكي سيناريوهات الواقع الميداني، تشمل إجراءات السلامة الشخصية، إدارة نقاط التفتيش، الإسعافات الأولية الميدانية في الإصابات الحرجة (Trauma First Aid)، وبروتوكولات الإخلاء وإدارة الحوادث.',
        fullDescEn: 'Practical simulation-based training covering personal security protocols, checkpoint negotiations, field trauma first aid, emergency evacuation drills, and critical incident management.',
        featuresAr: JSON.stringify([
          'محاكاة وتطبيقات ميدانية حية لسيناريوهات الطوارئ والبيئات الحرجة',
          'تدريب معتمد على إدارة الحوادث الميدانية والإسعاف التكتيكي الأولي',
          'تأهيل مخصص لعمال الإغاثة الإنسانية والفرق الاستقصائية والبحثية'
        ]),
        featuresEn: JSON.stringify([
          'Realistic live simulations of emergency and critical field scenarios',
          'Accredited field incident response and tactical trauma first aid training',
          'Tailored qualification modules for humanitarian aid workers and field teams'
        ]),
        targetSectorsAr: JSON.stringify(['عمال الإغاثة والمنظمات الإنسانية', 'الفرق الميدانية والاستطلاعية', 'المؤسسات والشركات العاملة في الميدان']),
        targetSectorsEn: JSON.stringify(['Aid Workers & Humanitarian NGOs', 'Field & Reconnaissance Teams', 'Field-Operating Corporations']),
        icon: 'GraduationCap',
        order: 1,
      },
      {
        slug: 'community-coordination-access',
        titleAr: 'التنسيق المجتمعي وتسهيل الوصول الإنساني والعملياتي',
        titleEn: 'Community Coordination & Humanitarian Access Facilitation',
        shortDescAr: 'بناء جسور الثقة مع المجتمعات المحلية والجهات الفاعلة لتسهيل حركة الفرق والمشاريع الميدانية بأمان.',
        shortDescEn: 'Building trust with local communities and stakeholders to ensure safe transit and unhindered humanitarian access.',
        fullDescAr: 'تسهيل الوصول العملياتي والإنساني من خلال بناء شراكات مجتمعية وتكتيكية متينة، والتواصل المباشر مع الأعيان والجهات الفاعلة محلياً لفض أي توترات وضمان القبول المجتمعي للأنشطة والمشاريع المنفذة.',
        fullDescEn: 'Facilitating operational and humanitarian access by forging solid community partnerships, engaging local leaders and stakeholders to resolve tensions, and securing broad community acceptance.',
        featuresAr: JSON.stringify([
          'بناء شراكات وتفاهمات مجتمعية وتكتيكية متينة مع القيادات المحلية',
          'إزالة معوقات الوصول الميداني وتأمين ممرات التحرك للمشاريع',
          'تحليل القبول المجتمعي والحد من النزاعات الحساسة وتفادي الاحتكاك'
        ]),
        featuresEn: JSON.stringify([
          'Solid community partnerships with local leaders and key influencers',
          'Unblocking field access hurdles and securing movement corridors',
          'Community acceptance analysis and sensitive conflict mitigation'
        ]),
        targetSectorsAr: JSON.stringify(['البعثات الإنسانية والدولية', 'مشاريع التنمية المجتمعية', 'المنظمات الإغاثية الميدانية']),
        targetSectorsEn: JSON.stringify(['Humanitarian & International Missions', 'Community Development Projects', 'Field Relief Organizations']),
        icon: 'Users2',
        order: 2,
      },
    ],
  },
  {
    slug: 'sector_systems_supply',
    titleAr: 'قطاع توريد أنظمة السلامة والأمن والحلول التقنية',
    titleEn: 'Safety & Security Systems Supply & Tech Solutions Sector',
    icon: 'Settings',
    order: 5,
    services: [
      {
        slug: 'security-systems-tech-solutions',
        titleAr: 'توريد وتكامل أنظمة السلامة والمراقبة والحلول التقنية',
        titleEn: 'Safety & Surveillance Systems Integration & Supply',
        shortDescAr: 'توفير وتكامل أحدث معدات وأنظمة السلامة والأمن الميداني والحلول التقنية المتطورة لرفع الجاهزية التشغيلية.',
        shortDescEn: 'Supplying and integrating advanced security, surveillance, and safety tech solutions to elevate operational readiness.',
        fullDescAr: 'توفير وتجهيز المنشآت والفرق بالمعدات والأنظمة التقنية المعتمدة دولياً، تشمل أنظمة المراقبة الذكية، أجهزة الاتصالات اللاسلكية الميدانية، وتجهيزات السلامة المهنية ومعدات الإنقاذ والوقاية التي تسد الفجوات التشغيلية.',
        fullDescEn: 'Equipping facilities and teams with internationally certified safety equipment, intelligent surveillance systems, field communications hardware, PPE, and tactical gear to close operational defense gaps.',
        featuresAr: JSON.stringify([
          'أنظمة مراقبة وتحكم أمني ذكية ومتكاملة للمنشآت والمقرات',
          'أجهزة اتصالات ميدانية وتتبع متقدمة تضمن الاتصال الدائم للفرق',
          'توريد وتجهيز معدات الوقاية والسلامة المهنية والإنقاذ المعتمدة عالمياً'
        ]),
        featuresEn: JSON.stringify([
          'Integrated smart surveillance and access control for compounds and offices',
          'Advanced field tracking and radio communication ensuring uninterrupted connectivity',
          'Supply of internationally certified PPE, safety gear, and rescue equipment'
        ]),
        targetSectorsAr: JSON.stringify(['المقرات الدبلوماسية والمنظمات', 'المستودعات والمنشآت الحيوية', 'الشركات الصناعية والتجارية']),
        targetSectorsEn: JSON.stringify(['Diplomatic Compounds & INGOs', 'Warehouses & Vital Facilities', 'Industrial & Commercial Entities']),
        icon: 'Settings',
        order: 1,
      },
    ],
  },
  {
    slug: 'sector_security_protection',
    titleAr: 'قطاع الحراسات وحماية الشخصيات والتنقل الآمن',
    titleEn: 'Guarding, VIP Protection & Secure Movement Sector',
    icon: 'Shield',
    order: 6,
    services: [
      {
        slug: 'facility-guarding-asset-protection',
        titleAr: 'الحراسات الميدانية وتأمين المقرات والأصول',
        titleEn: 'On-Site Guarding & Physical Asset Protection',
        shortDescAr: 'حلول أمنية متكاملة ترتكز على مبادئ الوقاية والجاهزية العالية لحماية المقرات الدبلوماسية والمؤسسية والأصول الحيوية.',
        shortDescEn: 'Comprehensive protection solutions grounded in prevention and readiness to secure institutional facilities and vital assets.',
        fullDescAr: 'توفير فرق حراسة مدربة ومؤهلة وفق معايير الحوكمة والترخيص الرسمي، لتأمين المنشآت والمقرات والمستودعات على مدار الساعة، وإدارة نقاط الدخول والتحكم الأمني بمهنية وانضباط لحماية الأرواح والممتلكات.',
        fullDescEn: 'Deploying officially licensed, highly trained guards to secure facilities, compounds, and warehouses 24/7, managing access points and perimeter security with high discipline to safeguard life and property.',
        featuresAr: JSON.stringify([
          'حراسات مدربة ومرخصة رسمياً تعمل وفق أعلى معايير الانضباط والجاهزية (24/7)',
          'إدارة وتأمين نقاط الدخول وتفتيش المركبات والتحكم الأمني الدقيق',
          'بروتوكولات استجابة طوارئ سريعة للمنشآت وغرف عمليات ومتابعة مستمرة'
        ]),
        featuresEn: JSON.stringify([
          '24/7 officially licensed and trained guards operating with utmost discipline',
          'Access point management, vehicle inspection, and perimeter control',
          'Rapid facility emergency protocols with continuous operations room monitoring'
        ]),
        targetSectorsAr: JSON.stringify(['المقرات الدبلوماسية والدولية', 'المؤسسات والشركات الكبرى', 'المستودعات والمنشآت الإغاثية']),
        targetSectorsEn: JSON.stringify(['Diplomatic & International Compounds', 'Major Corporations', 'Relief Warehouses & Facilities']),
        icon: 'Shield',
        order: 1,
      },
      {
        slug: 'secure-movement-convoy-protection',
        titleAr: 'التنقل الآمن وتأمين حركة الوفود والشخصيات',
        titleEn: 'Secure Movement & VIP Convoy Protection',
        shortDescAr: 'تأمين التحركات الميدانية وتوفير وسائل نقل ملائمة لحماية الوفود والبعثات في مختلف التضاريس ومستويات الخطورة.',
        shortDescEn: 'Securing field movements and providing suitable transportation to protect delegations and missions across varied terrains and risk levels.',
        fullDescAr: 'تخطيط وتنفيذ خطط التنقل الآمن للوفود والبعثات الإنسانية والدولية، مع استطلاع المسارات مسبقاً وتوفير مركبات مناسبة مجهزة بوسائل السلامة والاتصال لضمان سلامة الكوادر واستمرارية المهام دون تعطيل.',
        fullDescEn: 'Planning and executing secure transit schemes for humanitarian delegations and VIPs, pre-scouting corridors, deploying appropriate transport equipped with safety and communications gear to ensure safety.',
        featuresAr: JSON.stringify([
          'استطلاع مسبق وتأمين مسارات التحرك الميداني والممرات الحيوية',
          'وسائل نقل ملائمة ومجهزة تتناسب مع طبيعة جغرافية المناطق ودرجة خطورتها',
          'مرافقة أمنية مؤهلة وتواصل وتتبع مباشر عبر غرفة العمليات والإنذار المبكر'
        ]),
        featuresEn: JSON.stringify([
          'Pre-movement route reconnaissance and secure corridor clearance',
          'Terrain and risk-appropriate transport equipped with essential safety gear',
          'Qualified escort personnel with continuous tracking via operations control room'
        ]),
        targetSectorsAr: JSON.stringify(['الوفود والبعثات الدبلوماسية', 'فرق الإغاثة والتقييم الدولي', 'كبار الشخصيات والمستثمرون']),
        targetSectorsEn: JSON.stringify(['Diplomatic & Official Delegations', 'International Relief & Assessment Teams', 'VIPs & Foreign Investors']),
        icon: 'Lock',
        order: 2,
      },
    ],
  },
];

async function syncCatalogToDatabase(prisma, dbLabel) {
  console.log(`\n=============================================================`);
  console.log(`  SYNCING SERVICES CATALOG TO ${dbLabel}`);
  console.log(`=============================================================`);

  let totalCats = 0;
  let totalSrvs = 0;

  for (const catData of SECTORS_CATALOG) {
    const category = await prisma.serviceCategory.upsert({
      where: { slug: catData.slug },
      update: {
        titleAr: catData.titleAr,
        titleEn: catData.titleEn,
        icon: catData.icon,
        order: catData.order,
        isActive: true,
      },
      create: {
        slug: catData.slug,
        titleAr: catData.titleAr,
        titleEn: catData.titleEn,
        icon: catData.icon,
        order: catData.order,
        isActive: true,
      },
    });
    totalCats++;
    console.log(`\n  [Category] ${category.titleAr} (slug: ${category.slug})`);

    for (const srvData of catData.services) {
      const srv = await prisma.service.upsert({
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
          icon: srvData.icon,
          order: srvData.order,
          isActive: true,
        },
        create: {
          categoryId: category.id,
          slug: srvData.slug,
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
          icon: srvData.icon,
          order: srvData.order,
          isActive: true,
        },
      });
      totalSrvs++;
      console.log(`    ✓ Service: ${srv.titleAr} (${srv.slug})`);
    }
  }

  const catCount = await prisma.serviceCategory.count();
  const srvCount = await prisma.service.count();
  console.log(`\n  ★ ${dbLabel} complete! Categories: ${catCount}, Services: ${srvCount}`);
}

async function main() {
  console.log('Starting Official Services Catalog Seeding...');

  // 1. Local Database
  const localPrisma = new PrismaClient();
  try {
    await syncCatalogToDatabase(localPrisma, 'LOCAL POSTGRESQL (Port 5433)');
  } catch (err) {
    console.error('Local sync error:', err);
  } finally {
    await localPrisma.$disconnect();
  }

  // 2. Neon Cloud Database
  const neonUrl = "postgresql://neondb_owner:npg_JAcyQoO0m5Gs@ep-plain-river-b1x6n7oh-pooler.c-5.eu-central-1.aws.neon.tech/facss_clean?sslmode=require&connect_timeout=30";
  const neonPrisma = new PrismaClient({ datasources: { db: { url: neonUrl } } });
  try {
    await syncCatalogToDatabase(neonPrisma, 'CLOUD NEON POSTGRESQL (facss_clean)');
  } catch (err) {
    console.error('Neon sync error:', err);
  } finally {
    await neonPrisma.$disconnect();
  }

  console.log('\nAll operations finished successfully!');
}

main().catch(console.error);
