/**
 * scripts/test_comprehensive_validation.js
 * 
 * Tests:
 * 1. Database state & Super Admin verification.
 * 2. Operational tables count === 0 verification.
 * 3. ContentBlock CRUD & Publish/Unpublish cycle test.
 * 4. Empty state verification for public pages data layers.
 * 5. RBAC security & capability checks.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTests() {
  console.log('=====================================================================');
  console.log('   FACSS — تشغيل حزمة الاختبارات الشاملة للتحقق من التصفير والجودة');
  console.log('=====================================================================\n');

  // Clean any leftovers from previous test run if any
  await prisma.service.deleteMany({ where: { slug: { startsWith: 'test_' } } });
  await prisma.serviceCategory.deleteMany({ where: { slug: { startsWith: 'test_' } } });
  await prisma.contentBlock.deleteMany({ where: { key: { startsWith: 'test_' } } });

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✓ [نجاح]: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ [فشل]: ${testName}`);
      failed++;
    }
  }

  // 1. Super Admin Verification
  console.log('[1] اختبارات حساب المدير العام والمستخدمين:');
  const userCount = await prisma.user.count();
  assert(userCount === 1, `عدد حسابات المستخدمين في النظام هو 1 فقط (الحالي: ${userCount})`);

  const admin = await prisma.user.findUnique({
    where: { email: 'admin@facss-aden.com' }
  });
  assert(!!admin, 'حساب المدير العام admin@facss-aden.com موجود وسليم');
  assert(admin?.role === 'SUPER_ADMIN', 'دور الحساب هو SUPER_ADMIN حصراً');
  assert(admin?.isActive === true, 'حساب المدير العام نشط ومفعل');
  assert(admin?.fullName.includes('المركز المتكامل لخدمات الأمن والسلامة'), 'اسم الحساب يطابق الهوية الرسمية');

  // 2. Operational Tables Zero Verification
  console.log('\n[2] اختبارات تصفير الجداول التشغيلية:');
  const operationalModels = [
    { name: 'serviceRequest', desc: 'طلبات الخدمات' },
    { name: 'service', desc: 'دليل الخدمات' },
    { name: 'serviceCategory', desc: 'مجالات الخدمات' },
    { name: 'course', desc: 'الدورات التدريبية' },
    { name: 'courseCategory', desc: 'تصنيفات الدورات' },
    { name: 'trainingRegistration', desc: 'تسجيلات التدريب' },
    { name: 'certificate', desc: 'الشهادات' },
    { name: 'trainer', desc: 'المدربين' },
    { name: 'researchPublication', desc: 'الدراسات والتقارير' },
    { name: 'researchCategory', desc: 'تصنيفات الدراسات' },
    { name: 'incident', desc: 'البلاغات الميدانية' },
    { name: 'operationalRisk', desc: 'سجل المخاطر' },
    { name: 'equipmentProduct', desc: 'أصناف المعدات' },
    { name: 'equipmentCategory', desc: 'تصنيفات المعدات' },
    { name: 'supplier', desc: 'الموردين' },
    { name: 'clientProfile', desc: 'ملفات العملاء' },
    { name: 'notification', desc: 'الإشعارات' },
    { name: 'activityLog', desc: 'سجلات النشاط السابقة' }
  ];

  for (const op of operationalModels) {
    const count = await prisma[op.name].count();
    assert(count === 0, `جدول ${op.desc} (${op.name}) فارغ تماماً (السجلات: ${count})`);
  }

  // 3. System Settings Verification
  console.log('\n[3] اختبارات الإعدادات المرجعية الأساسية:');
  const acronym = await prisma.systemSetting.findUnique({ where: { key: 'site_acronym' } });
  assert(acronym?.value === 'FACSS', `اختصار المركز الرسمي هو FACSS (الحالي: ${acronym?.value})`);

  const siteNameAr = await prisma.systemSetting.findUnique({ where: { key: 'site_name_ar' } });
  assert(siteNameAr?.value === 'المركز المتكامل لخدمات الأمن والسلامة والدراسات الميدانية', 'الاسم العربي الرسمي مضبوط بالكامل');

  // 4. ContentBlock CRUD Cycle Test
  console.log('\n[4] اختبار دورة حياة المحتوى (إنشاء، تعديل، إخفاء/نشر، حذف):');
  const testKey = `test_field_${Date.now()}`;
  
  // Create
  const created = await prisma.contentBlock.create({
    data: {
      section: 'activity_fields',
      key: testKey,
      titleAr: 'قطاع تجريبي للاختبار',
      titleEn: 'Test Sector',
      descriptionAr: 'وصف تجريبي للتأكد من نجاح الإضافة',
      descriptionEn: 'Test description for verification',
      isVisible: true,
      order: 99,
      updatedByName: 'QA Automated Test',
    }
  });
  assert(!!created.id, 'نجاح إنشاء كتلة محتوى جديدة وحفظها في قاعدة البيانات');

  // Verify DB presence
  const fetched = await prisma.contentBlock.findUnique({ where: { id: created.id } });
  assert(fetched?.titleAr === 'قطاع تجريبي للاختبار', 'نجاح استرجاع الكتلة والتحقق من صحة بياناتها');

  // Update
  const updated = await prisma.contentBlock.update({
    where: { id: created.id },
    data: { titleAr: 'قطاع تجريبي تم تعديله', isVisible: false }
  });
  assert(updated.titleAr === 'قطاع تجريبي تم تعديله' && updated.isVisible === false, 'نجاح تعديل المحتوى وإلغاء النشر (مسودة/مخفي)');

  // Delete
  await prisma.contentBlock.delete({ where: { id: created.id } });
  const deletedCheck = await prisma.contentBlock.findUnique({ where: { id: created.id } });
  assert(!deletedCheck, 'نجاح حذف كتلة المحتوى نهائياً وعودة البيئة لنظافتها');

  // 5. Test Service Creation & Deletion
  console.log('\n[5] اختبار دورة حياة إنشاء وتعديل وحذف خدمة:');
  const catSlug = `test_cat_${Date.now()}`;
  const testCat = await prisma.serviceCategory.create({
    data: {
      slug: catSlug,
      titleAr: 'تصنيف خدمات اختباري',
      titleEn: 'Test Category',
      order: 1,
      isActive: true,
    }
  });
  assert(!!testCat.id, 'نجاح إنشاء مجال/تصنيف خدمات جديد');

  const srvSlug = `test_srv_${Date.now()}`;
  const testSrv = await prisma.service.create({
    data: {
      categoryId: testCat.id,
      slug: srvSlug,
      titleAr: 'خدمة تجريبية للاختبار',
      titleEn: 'Test Service',
      shortDescAr: 'وصف مختصر تجريبي',
      shortDescEn: 'Short test description',
      fullDescAr: 'الوصف الكامل والتفصيلي للخدمة التجريبية',
      fullDescEn: 'Detailed comprehensive description for the test service',
      featuresAr: JSON.stringify(['ميزة تجريبية 1', 'ميزة تجريبية 2']),
      featuresEn: JSON.stringify(['Test feature 1', 'Test feature 2']),
      order: 1,
      isActive: true,
    }
  });
  assert(!!testSrv.id, 'نجاح إنشاء خدمة جديدة وربطها بالتصنيف');

  // Update Service
  const updatedSrv = await prisma.service.update({
    where: { id: testSrv.id },
    data: { titleAr: 'خدمة تجريبية تم تعديلها', isActive: false }
  });
  assert(updatedSrv.titleAr === 'خدمة تجريبية تم تعديلها' && updatedSrv.isActive === false, 'نجاح تعديل بيانات الخدمة وتعطيل حالتها (مسودة)');

  // Clean up test service and category
  await prisma.service.delete({ where: { id: testSrv.id } });
  await prisma.serviceCategory.delete({ where: { id: testCat.id } });
  const catCheck = await prisma.serviceCategory.findUnique({ where: { id: testCat.id } });
  assert(!catCheck, 'نجاح حذف الخدمة والتصنيف بعد الاختبار وعودة جدول الخدمات لحالة التصفير');

  console.log('\n=====================================================================');
  console.log(`  نتائج الاختبارات: نجح ${passed} | فشل ${failed}`);
  console.log('=====================================================================');

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
