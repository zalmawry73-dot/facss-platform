/**
 * FACSS — تهيئة التصنيفات الفنية الهيكلية فقط (Pure Technical Taxonomy)
 * 
 * هذا السكربت مخصص لتهيئة التصنيفات البرمجية الأساسية المطلوبة لنماذج قاعدة البيانات:
 * 1. تصنيفات البرامج التدريبية (CourseCategory - سجلان): لتمكين إضافة دورات من لوحة الإدارة دون أخطاء مفاتيح أجنبية.
 * 2. تصنيفات الدراسات والأبحاث (ResearchCategory - سجلان): لتمكين نشر أبحاث من لوحة الإدارة دون أخطاء مفاتيح أجنبية.
 * 3. تصنيفات الخدمات الهيكلية (ServiceCategory - 3 سجلات): لتوفير التبويبات الفنية الثلاثة للخدمات.
 * 
 * تنبيه صارم والتزام كامل:
 * - هذا السكربت لا يُنشئ أي خدمات مؤسسية (صفر خدمات).
 * - لا يُنشئ أي مستخدمين، أو عملاء، أو متدربين، أو دورات، أو أبحاث، أو طلبات، أو شهادات.
 * - إجمالي السجلات التي ينشئها: 7 سجلات تصنيفية بحتة.
 * 
 * الاستخدام: node scripts/init_system_taxonomy.js
 */

const fs = require('fs');
const path = require('path');

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

async function main() {
  console.log('\n=============================================================');
  console.log('  FACSS — تهيئة التصنيفات الفنية الهيكلية (Technical Taxonomy)');
  console.log('  Aden First Center for Security Services & Strategic Studies');
  console.log('=============================================================\n');

  try {
    // 1. Service Categories (3 records)
    console.log('1. تهيئة تصنيفات الخدمات الهيكلية (ServiceCategory - 3 سجلات)...');
    
    await prisma.serviceCategory.upsert({
      where: { slug: 'operational-security-services' },
      update: {},
      create: {
        titleAr: 'الخدمات الأمنية التشغيلية',
        titleEn: 'Operational Security Services',
        slug: 'operational-security-services',
        icon: 'ShieldCheck',
        order: 1,
      },
    });

    await prisma.serviceCategory.upsert({
      where: { slug: 'electronic-security-solutions' },
      update: {},
      create: {
        titleAr: 'الأنظمة والحلول الأمنية الإلكترونية',
        titleEn: 'Electronic Security & Advanced Systems',
        slug: 'electronic-security-solutions',
        icon: 'Cpu',
        order: 2,
      },
    });

    await prisma.serviceCategory.upsert({
      where: { slug: 'strategic-security-studies' },
      update: {},
      create: {
        titleAr: 'الدراسات الأمنية الاستراتيجية',
        titleEn: 'Strategic Security Studies',
        slug: 'strategic-security-studies',
        icon: 'FileText',
        order: 3,
      },
    });
    console.log('   ✓ تم التحقق من وجود 3 تصنيفات هيكلية للخدمات.');

    // 2. Course Categories (2 records)
    console.log('2. تهيئة تصنيفات البرامج التدريبية (CourseCategory - سجلان)...');
    
    await prisma.courseCategory.upsert({
      where: { slug: 'field-security-programs' },
      update: {},
      create: {
        titleAr: 'برامج التأهيل الأمني الميداني',
        titleEn: 'Field Security Qualification Programs',
        slug: 'field-security-programs',
      },
    });

    await prisma.courseCategory.upsert({
      where: { slug: 'safety-and-emergency' },
      update: {},
      create: {
        titleAr: 'السلامة وإدارة الطوارئ',
        titleEn: 'Safety & Emergency Management',
        slug: 'safety-and-emergency',
      },
    });
    console.log('   ✓ تم التحقق من وجود سجلين لتصنيفات التدريب.');

    // 3. Research Categories (2 records)
    console.log('3. تهيئة تصنيفات الأبحاث والدراسات (ResearchCategory - سجلان)...');
    
    await prisma.researchCategory.upsert({
      where: { slug: 'strategic-security-studies' },
      update: {},
      create: {
        titleAr: 'الدراسات الأمنية الاستراتيجية',
        titleEn: 'Strategic Security Studies',
        slug: 'strategic-security-studies',
      },
    });

    await prisma.researchCategory.upsert({
      where: { slug: 'threat-and-risk-assessment' },
      update: {},
      create: {
        titleAr: 'تقييم التهديدات والمخاطر',
        titleEn: 'Threat & Risk Assessment',
        slug: 'threat-and-risk-assessment',
      },
    });
    console.log('   ✓ تم التحقق من وجود سجلين لتصنيفات الأبحاث.');

    console.log('\n-------------------------------------------------------------');
    console.log('✓ اكتملت تهيئة التصنيفات الفنية الهيكلية بنجاح (إجمالي 7 سجلات)!');
    console.log('  قائمة السجلات المنشأة بدقة:');
    console.log('  1. ServiceCategory: [operational-security-services] - الخدمات الأمنية التشغيلية');
    console.log('  2. ServiceCategory: [electronic-security-solutions] - الأنظمة والحلول الأمنية الإلكترونية');
    console.log('  3. ServiceCategory: [strategic-security-studies] - الدراسات الأمنية الاستراتيجية');
    console.log('  4. CourseCategory:  [field-security-programs] - برامج التأهيل الأمني الميداني');
    console.log('  5. CourseCategory:  [safety-and-emergency] - السلامة وإدارة الطوارئ');
    console.log('  6. ResearchCategory:[strategic-security-studies] - الدراسات الأمنية الاستراتيجية');
    console.log('  7. ResearchCategory:[threat-and-risk-assessment] - تقييم التهديدات والمخاطر');
    console.log('-------------------------------------------------------------');
    console.log('  تأكيد الأمان: لم يتم إنشاء أي خدمات مؤسسية أو دورات أو مستخدمين.');
    console.log('=============================================================\n');
  } catch (error) {
    console.error('\n✗ حدث خطأ أثناء تهيئة التصنيفات الفنية:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
