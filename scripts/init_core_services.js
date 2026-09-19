/**
 * FACSS — اعتماد وتثبيت الخدمات المؤسسية الأساسية للمركز (اختياري بموافقة صاحب المشروع)
 * 
 * هذا السكربت مخصص للخدمات المؤسسية التشغيلية للمركز.
 * لا يتم إنشاء أي خدمة إلا بعد موافقة صريحة وتفاعلية من صاحب المشروع بكتابة "YES".
 * 
 * قائمة الخدمات الست الأساسية المعروضة للاعتماد:
 * 1. تدريب أمن وسلامة (security-and-safety-training)
 * 2. خدمات الحراسات والحماية الميدانية (guarding-services)
 * 3. التقييم والتدقيق الأمني للمنشآت (security-assessments)
 * 4. كاميرات المراقبة والأنظمة الذكية (cctv-and-surveillance)
 * 5. أنظمة التحكم بالدخول ومعدات السلامة (access-control-and-safety)
 * 6. تحليل المخاطر الأمنية والدراسات الاستراتيجية (security-risk-analysis)
 * 
 * الاستخدام: node scripts/init_core_services.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Load environment configuration from .env safely
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
const prisma = new PrismaClient();

function askQuestion(rl, query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  console.log('\n=============================================================');
  console.log('  FACSS — اعتماد وتثبيت دليل الخدمات المؤسسية للمركز');
  console.log('  Aden First Center for Security Services & Strategic Studies');
  console.log('=============================================================\n');

  console.log('يتضمن هذا الدليل 6 خدمات مؤسسية رئيسية مطابقة لهوية مركز عدن الأول:');
  console.log('  1. [الخدمات التشغيلية] تدريب أمن وسلامة (security-and-safety-training)');
  console.log('  2. [الخدمات التشغيلية] خدمات الحراسات والحماية الميدانية (guarding-services)');
  console.log('  3. [الخدمات التشغيلية] التقييم والتدقيق الأمني للمنشآت (security-assessments)');
  console.log('  4. [الأنظمة الإلكترونية] كاميرات المراقبة والأنظمة الذكية (cctv-and-surveillance)');
  console.log('  5. [الأنظمة الإلكترونية] أنظمة التحكم بالدخول ومعدات السلامة (access-control-and-safety)');
  console.log('  6. [الدراسات الاستراتيجية] تحليل المخاطر الأمنية والدراسات الاستراتيجية (security-risk-analysis)\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const answer = await askQuestion(rl, 'هل توافق على اعتماد وتثبيت هذه الخدمات المؤسسية الست في قاعدتك المحلية؟\n(اكتب YES بالإنجليزية للموافقة، أو اضغط Enter للإلغاء): ');

    if (answer.trim() !== 'YES') {
      console.log('\n[تم الإلغاء]: لم يتم إجراء أي تغيير في قاعدة البيانات.');
      console.log('تظل قائمة الخدمات فارغة كما طلبت حتى تقرر اعتمادها لاحقاً.\n');
      return;
    }

    console.log('\nجارٍ التحقق من وجود تصنيفات الخدمات المؤسسية...');
    const catOperational = await prisma.serviceCategory.findUnique({ where: { slug: 'operational-security-services' } });
    const catElectronic = await prisma.serviceCategory.findUnique({ where: { slug: 'electronic-security-solutions' } });
    const catStrategic = await prisma.serviceCategory.findUnique({ where: { slug: 'strategic-security-studies' } });

    if (!catOperational || !catElectronic || !catStrategic) {
      console.error('✗ خطأ: لم يتم العثور على تصنيفات الخدمات الهيكلية.');
      console.error('  يرجى تشغيل node scripts/init_system_taxonomy.js أولاً لإنشاء التصنيفات.\n');
      return;
    }

    console.log('جارٍ تثبيت الخدمات الست المعتمدة...');

    // 1. Training
    await prisma.service.upsert({
      where: { slug: 'security-and-safety-training' },
      update: {},
      create: {
        categoryId: catOperational.id,
        titleAr: 'تدريب أمن وسلامة',
        titleEn: 'Security and Safety Training',
        slug: 'security-and-safety-training',
        shortDescAr: 'برامج تأهيلٍ وتدريبٍ للكوادر الأمنية وفق معايير مهنية دقيقة.',
        shortDescEn: 'Qualification and training programs for security personnel to professional standards.',
        fullDescAr: 'برامج تأهيلٍ وتدريبٍ متخصصة للكوادر الأمنية، تشمل الدورات الأساسية للحراس، حماية الشخصيات، التعامل مع الطوارئ والإخلاء، السلامة المهنية، وأمن المنشآت.',
        fullDescEn: 'Specialized qualification and training programs covering basic guard skills, VIP protection, emergency response & evacuation, and facility safety.',
        featuresAr: JSON.stringify(['تأهيل الحراس والأفراد', 'حماية الشخصيات المهمة', 'إدارة الطوارئ والإخلاء', 'السلامة والصحة المهنية']),
        featuresEn: JSON.stringify(['Guard Qualification', 'VIP Protection', 'Emergency & Evacuation', 'Occupational Health & Safety']),
        targetSectorsAr: JSON.stringify(['الجهات الحكومية', 'الشركات والمنشآت', 'المؤسسات المالية', 'المرافق الحيوية']),
        targetSectorsEn: JSON.stringify(['Government Entities', 'Enterprises & Facilities', 'Financial Institutions', 'Vital Utilities']),
        processAr: JSON.stringify(['تحديد الاحتياج', 'تصميم البرنامج', 'التنفيذ العملي والنظري', 'التقييم']),
        processEn: JSON.stringify(['Needs Assessment', 'Program Design', 'Theoretical & Practical Execution', 'Evaluation']),
        icon: 'GraduationCap',
        order: 1,
      },
    });

    // 2. Guarding
    await prisma.service.upsert({
      where: { slug: 'guarding-services' },
      update: {},
      create: {
        categoryId: catOperational.id,
        titleAr: 'خدمات الحراسات والحماية الميدانية',
        titleEn: 'Guarding & Field Protection Services',
        slug: 'guarding-services',
        shortDescAr: 'حراسة المنشآت الحيوية، حماية الشخصيات، وتأمين الفعاليات ونقل الأموال.',
        shortDescEn: 'Facility protection, VIP protection, event security, and cash-in-transit security.',
        fullDescAr: 'نوفر خدمات حراسة المنشآت الحيوية والتجارية، تأمين المقرات والوفود، ومرافقة نقل الأموال والممتلكات وفق خطط انتشار أمني متقدمة.',
        fullDescEn: 'Comprehensive protection for facilities, personnel, corporate venues, and cash-in-transit with structured security deployment.',
        featuresAr: JSON.stringify(['حراسة المنشآت والمقرات', 'تأمين المؤتمرات والفعاليات', 'حراسة نقل الأموال', 'دوريات أمنية منتظمة']),
        featuresEn: JSON.stringify(['Facility Security', 'Event & Conference Security', 'Cash-in-Transit Escort', 'Regular Security Patrols']),
        targetSectorsAr: JSON.stringify(['البنوك والمصارف', 'الشركات التجارية', 'المؤسسات التعليمية والصحية']),
        targetSectorsEn: JSON.stringify(['Banks', 'Commercial Companies', 'Educational & Health Institutions']),
        processAr: JSON.stringify(['المسح الميداني للموقع', 'خطة التمركز والانتشار', 'نشر الأفراد والتجهيزات', 'المتابعة الميدانية']),
        processEn: JSON.stringify(['Site Survey', 'Deployment Planning', 'Post Manning', 'Field Supervision']),
        icon: 'Shield',
        order: 2,
      },
    });

    // 3. Security Assessments
    await prisma.service.upsert({
      where: { slug: 'security-assessments' },
      update: {},
      create: {
        categoryId: catOperational.id,
        titleAr: 'التقييم والتدقيق الأمني للمنشآت',
        titleEn: 'Facility Security Audits & Assessments',
        slug: 'security-assessments',
        shortDescAr: 'فحصٌ ميداني شامل للثغرات الأمنية وإجراءات السلامة وخطط الاستجابة.',
        shortDescEn: 'Comprehensive physical vulnerability assessments, safety audits, and emergency protocols.',
        fullDescAr: 'دراسة ميدانية متخصصة لتحديد الثغرات ونقاط الضعف في المنشآت والمقرات وتقديم تقارير تدقيق استشارية وتوصيات هندسية وإجرائية.',
        fullDescEn: 'Specialized field assessments identifying vulnerabilities, audit reports, and engineering-operational recommendations.',
        featuresAr: JSON.stringify(['فحص المنافذ والأسوار', 'تقييم أنظمة المراقبة والإنذار', 'مراجعة إجراءات الدخول', 'خطة سد الثغرات']),
        featuresEn: JSON.stringify(['Perimeter Vulnerability Inspection', 'Surveillance Audit', 'Access Control Review', 'Mitigation Plan']),
        targetSectorsAr: JSON.stringify(['الشركات الكبرى', 'المجمعات السكنية والتجارية', 'المخازن والمستودعات']),
        targetSectorsEn: JSON.stringify(['Corporations', 'Residential & Commercial Complexes', 'Warehouses']),
        processAr: JSON.stringify(['المعاينة الميدانية', 'تحليل الثغرات', 'إعداد تقرير التقييم', 'جلسة مناقشة التوصيات']),
        processEn: JSON.stringify(['Site Inspection', 'Vulnerability Analysis', 'Audit Report', 'Debriefing']),
        icon: 'Eye',
        order: 3,
      },
    });

    // 4. CCTV
    await prisma.service.upsert({
      where: { slug: 'cctv-and-surveillance' },
      update: {},
      create: {
        categoryId: catElectronic.id,
        titleAr: 'كاميرات المراقبة والأنظمة الذكية',
        titleEn: 'CCTV & Intelligent Surveillance Systems',
        slug: 'cctv-and-surveillance',
        shortDescAr: 'تصميم وتركيب وإدارة شبكات المراقبة التلفزيونية عالية الدقة وغرف العمليات.',
        shortDescEn: 'Design, installation, and management of HD CCTV networks and monitoring rooms.',
        fullDescAr: 'توريد وتركيب وبرمجة أحدث كاميرات المراقبة والشبكات وغرف التحكم المركزية لتمكين المراقبة اللحظية والاستجابة السريعة.',
        fullDescEn: 'Procurement, setup, and configuration of modern IP/HD surveillance, NVRs, and control rooms for real-time monitoring.',
        featuresAr: JSON.stringify(['كاميرات بدقة فائقة 4K', 'رؤية ليلية واستشعار حركة', 'ربط شبكي وغرف مراقبة', 'صيانة ودعم فني']),
        featuresEn: JSON.stringify(['4K Ultra-HD Cameras', 'Night Vision & Motion Detection', 'Networked Monitoring Rooms', 'Maintenance & Support']),
        targetSectorsAr: JSON.stringify(['المنشآت التجارية', 'المؤسسات الحكومية', 'المستودعات والساحات']),
        targetSectorsEn: JSON.stringify(['Commercial Outlets', 'Public Institutions', 'Storage Facilities']),
        processAr: JSON.stringify(['المخطط الهندسي', 'التوريد والتركيب', 'البرمجة والربط', 'التسليم والتدريب']),
        processEn: JSON.stringify(['Engineering Layout', 'Procurement & Mounting', 'Configuration', 'Handover']),
        icon: 'Camera',
        order: 4,
      },
    });

    // 5. Access Control
    await prisma.service.upsert({
      where: { slug: 'access-control-and-safety' },
      update: {},
      create: {
        categoryId: catElectronic.id,
        titleAr: 'أنظمة التحكم بالدخول ومعدات السلامة',
        titleEn: 'Access Control & Safety Equipment',
        slug: 'access-control-and-safety',
        shortDescAr: 'بوابات إلكترونية، أنظمة بصمة وبطاقات ممغنطة، وأجهزة إنذار وإطفاء.',
        shortDescEn: 'Electronic turnstiles, biometric access, RFID barriers, and integrated fire alarms.',
        fullDescAr: 'حلول التحكم الإلكتروني في حركة الدخول والخروج، والبوابات الأمنية، وأجهزة الكشف والتفتيش، ومعدات السلامة والوقاية من الحرائق.',
        fullDescEn: 'Comprehensive physical access control, security turnstiles, inspection scanners, and integrated fire alarm and safety hardware.',
        featuresAr: JSON.stringify(['بوابات إلكترونية وقارئات بصمة', 'أجهزة تفتيش وتفتيش حقائب', 'أنظمة إنذار مبكر ضد الحريق', 'معدات وقاية وسلامة']),
        featuresEn: JSON.stringify(['Biometric & RFID Gates', 'Handheld & Baggage Scanners', 'Early Fire Alarms', 'Safety & PPE Equipment']),
        targetSectorsAr: JSON.stringify(['المباني الإدارية', 'المطارات والموانئ', 'المراكز التجارية']),
        targetSectorsEn: JSON.stringify(['Administrative Buildings', 'Ports & Transit Hubs', 'Malls']),
        processAr: JSON.stringify(['تحديد متطلبات الدخول', 'التوريد المعتمد', 'التركيب والاختبار', 'التدريب التشغيلي']),
        processEn: JSON.stringify(['Access Profiling', 'Procurement', 'Installation & Testing', 'User Training']),
        icon: 'KeyRound',
        order: 5,
      },
    });

    // 6. Risk Analysis
    await prisma.service.upsert({
      where: { slug: 'security-risk-analysis' },
      update: {},
      create: {
        categoryId: catStrategic.id,
        titleAr: 'تحليل المخاطر الأمنية والدراسات الاستراتيجية',
        titleEn: 'Security Risk Analysis & Strategic Studies',
        slug: 'security-risk-analysis',
        shortDescAr: 'تحليل استباقي للتهديدات ونقاط الضعف وبناء مصفوفات المخاطر المؤسسية.',
        shortDescEn: 'Methodological threat modeling, quantitative risk matrices, and strategic advisory.',
        fullDescAr: 'إعداد دراسات أمنية واستراتيجية تحليلية متقدمة تدعم متخذي القرار في تقييم المخاطر، والتعامل مع الأزمات، والتخطيط الأمني طويل المدى.',
        fullDescEn: 'Advanced analytical security and strategic research supporting corporate and institutional decision-makers in risk management and crisis response.',
        featuresAr: JSON.stringify(['تحديد مصادر التهديد', 'مصفوفات تقييم المخاطر', 'خرائط الأولويات الأمنية', 'توصيات تنفيذية لمتخذي القرار']),
        featuresEn: JSON.stringify(['Threat Identification', 'Risk Evaluation Matrices', 'Security Heatmaps', 'Executive Recommendations']),
        targetSectorsAr: JSON.stringify(['متخذو القرار', 'الشركات الكبرى', 'المنظمات الدولية', 'الهيئات الاستشارية']),
        targetSectorsEn: JSON.stringify(['Decision Makers', 'Corporations', 'International Organizations', 'Advisory Bodies']),
        processAr: JSON.stringify(['جمع البيانات', 'التحليل الاستراتيجي', 'صياغة التقرير والمصفوفة', 'جلسة العرض والتوصيات']),
        processEn: JSON.stringify(['Data Collection', 'Strategic Analysis', 'Matrix Formulation', 'Briefing']),
        icon: 'TrendingUp',
        order: 6,
      },
    });

    console.log('\n✓ تم تثبيت الخدمات المؤسسية الست بنجاح بناءً على اعتمادك الصريح!');
    console.log('-------------------------------------------------------------');
  } catch (error) {
    console.error('\n✗ حدث خطأ أثناء تثبيت الخدمات:', error.message);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();
