/**
 * scripts/execute_clean_initialization.js
 * 
 * FACSS — Clean Platform Initialization Script
 * 
 * Strict Guarantees:
 * 1. Checks that SUPER_ADMIN (admin@facss-aden.com) exists and is active.
 * 2. Leaves passwordHash and security credentials untouched.
 * 3. Deletes all other user accounts (staff, managers, trainees, clients, test users).
 * 4. Deletes all operational data in reverse foreign-key order.
 * 5. Cleans test and demo content from ContentBlock and system settings.
 * 6. Removes test file uploads while keeping .gitkeep and folder structures intact.
 * 7. Verifies table counts before and after.
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const EXPECTED_SUPER_ADMIN_EMAIL = 'admin@facss-aden.com';

async function safeDelete(modelName, desc) {
  if (prisma[modelName] && typeof prisma[modelName].deleteMany === 'function') {
    try {
      const res = await prisma[modelName].deleteMany();
      console.log(`  - تم حذف ${desc} (${modelName}): ${res.count} سجل`);
    } catch (e) {
      console.warn(`  ⚠ تعذر حذف (${modelName}): ${e.message}`);
    }
  }
}

async function main() {
  console.log('=====================================================================');
  console.log('   FACSS — تنفيذ تصفير وتهيئة المنصة الشاملة (Clean Initialization)');
  console.log('   المركز المتكامل لخدمات الأمن والسلامة والدراسات الميدانية');
  console.log('=====================================================================\n');

  // STEP 1: VERIFY TARGET DATABASE AND SUPER ADMIN
  console.log('[المرحلة 1] التحقق من سلامة اتصال قاعدة البيانات وحساب SUPER_ADMIN...');
  const superAdmin = await prisma.user.findUnique({
    where: { email: EXPECTED_SUPER_ADMIN_EMAIL },
  });

  if (!superAdmin) {
    throw new Error(`[خطأ حرج]: لم يتم العثور على حساب SUPER_ADMIN بالبريد (${EXPECTED_SUPER_ADMIN_EMAIL}). تم إيقاف التصفير.`);
  }

  if (superAdmin.role !== 'SUPER_ADMIN') {
    throw new Error(`[خطأ حرج]: الحساب (${EXPECTED_SUPER_ADMIN_EMAIL}) لا يملك دور SUPER_ADMIN (دوره الحالي: ${superAdmin.role}).`);
  }

  if (!superAdmin.isActive) {
    throw new Error(`[خطأ حرج]: حساب SUPER_ADMIN معطل (isActive: false).`);
  }

  console.log(`  ✓ تم التحقق بنجاح من حساب SUPER_ADMIN:`);
  console.log(`    - المعرف (ID): ${superAdmin.id}`);
  console.log(`    - البريد: ${superAdmin.email}`);
  console.log(`    - الدور: ${superAdmin.role}`);
  console.log(`    - الحالة: نشط (Active)`);

  // Update full name to official name while keeping passwordHash intact
  await prisma.user.update({
    where: { id: superAdmin.id },
    data: {
      fullName: 'المدير العام — المركز المتكامل لخدمات الأمن والسلامة والدراسات الميدانية (FACSS)',
      organization: 'FACSS Executive Administration',
      phone: '+967-770000001',
    },
  });
  console.log('  ✓ تم تحديث الاسم والمنظمة للمدير العام وفق الهوية الرسمية.');

  // RECORD COUNTS BEFORE CLEANUP
  console.log('\n[المرحلة 2] حصر عدد السجلات قبل التنظيف...');
  const beforeCounts = {};
  const models = Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_'));
  for (const m of models) {
    try {
      beforeCounts[m] = await prisma[m].count();
    } catch {
      beforeCounts[m] = null;
    }
  }

  // STEP 2: DELETE OPERATIONAL AND TEST RECORDS IN REVERSE RELATION ORDER
  console.log('\n[المرحلة 3] جاري حذف البيانات التشغيلية والتجريبية...');

  // 1. Procurement, Deliveries & Equipment
  await safeDelete('deliveryItem', 'بنود تسليم المعدات');
  await safeDelete('equipmentDelivery', 'سندات تسليم المعدات');
  await safeDelete('equipmentReturn', 'إرجاع المعدات');
  await safeDelete('trackedEquipmentItem', 'المعدات المتتبعة');
  await safeDelete('supplyRequestItem', 'بنود طلبات التوريد');
  await safeDelete('receivingItem', 'بنود الاستلام');
  await safeDelete('procurementReceiving', 'سندات الاستلام');
  await safeDelete('procurementItem', 'بنود أوامر الشراء');
  await safeDelete('procurementOrder', 'أوامر الشراء');
  await safeDelete('inventoryMovement', 'حركات المخزون');
  await safeDelete('equipmentInspection', 'فحوصات المعدات');
  await safeDelete('equipmentMaintenance', 'سجلات صيانة المعدات');
  await safeDelete('equipmentProduct', 'أصناف المعدات');
  await safeDelete('equipmentCategory', 'تصنيفات المعدات');
  await safeDelete('supplier', 'الموردين');

  // 2. Risks & Mitigations
  await safeDelete('riskAssessmentHistory', 'سجل تاريخ تقييم المخاطر');
  await safeDelete('riskMitigationAction', 'إجراءات معالجة المخاطر');
  await safeDelete('operationalRisk', 'سجل المخاطر التشغيلية');

  // 3. Incidents, Alerts & Field Reports
  await safeDelete('incidentAttachment', 'مرفقات البلاغات');
  await safeDelete('incidentVerification', 'تحققات البلاغات');
  await safeDelete('incidentAssignment', 'إسنادات البلاغات');
  await safeDelete('incidentAlert', 'تنبيهات البلاغات');
  await safeDelete('incidentRedacted', 'النسخ المنقحة للبلاغات');
  await safeDelete('incidentOriginal', 'النسخ الأصلية للبلاغات');
  await safeDelete('incident', 'البلاغات الميدانية');
  await safeDelete('alertDeliveryLog', 'سجلات تسليم التنبيهات');
  await safeDelete('alertRecipient', 'مستلمي التنبيهات');
  await safeDelete('alertSnapshot', 'لقطات التنبيهات');
  await safeDelete('securityAlert', 'التنبيهات الأمنية');

  // 4. Research & Publications
  await safeDelete('newsArticle', 'المقالات والأخبار');
  await safeDelete('researchReviewLog', 'سجلات مراجعة الأبحاث');
  await safeDelete('researchAccessGrant', 'أذونات الوصول للدراسات');
  await safeDelete('researchPublication', 'منشورات الدراسات والتقارير');
  await safeDelete('researchCategory', 'تصنيفات الدراسات');

  // 5. Training & Academy
  await safeDelete('certificate', 'الشهادات التدريبية');
  await safeDelete('attendanceRecord', 'سجلات الحضور');
  await safeDelete('courseSatisfactionEvaluation', 'تقييمات رضا المتدربين');
  await safeDelete('trainingEvaluation', 'تقييمات التدريب');
  await safeDelete('trainingRegistration', 'تسجيلات التدريب');
  await safeDelete('trainingSession', 'جلسات التدريب');
  await safeDelete('courseTrainer', 'مدربي الدورات');
  await safeDelete('trainingMaterial', 'المواد والحقائب التدريبية');
  await safeDelete('trainingNeedsAssessment', 'تقييم الاحتياجات التدريبية');
  await safeDelete('trainerDocument', 'وثائق المدربين');
  await safeDelete('course', 'الدورات التدريبية');
  await safeDelete('courseCategory', 'تصنيفات الدورات');
  await safeDelete('trainer', 'سجلات المدربين');

  // 6. Services & Service Requests
  await safeDelete('serviceRequestDocument', 'وثائق طلبات الخدمات');
  await safeDelete('serviceRequestNote', 'ملاحظات طلبات الخدمات');
  await safeDelete('serviceRequest', 'طلبات الخدمات');
  await safeDelete('service', 'الخدمات');
  await safeDelete('serviceCategory', 'مجالات وتصنيفات الخدمات');

  // 7. Client Profiles & Feedback
  await safeDelete('clientFeedback', 'تقييمات العملاء');
  await safeDelete('clientProfile', 'ملفات العملاء المؤسسيين');
  await safeDelete('contactMessage', 'رسائل الاتصال والشكاوى');

  // 8. Notifications & Logs
  await safeDelete('notification', 'الإشعارات');
  await safeDelete('activityLog', 'سجلات الأنشطة السابقة');

  // 9. Capabilities and Users (ONLY KEEP superAdmin)
  await prisma.userCapability.deleteMany({
    where: { userId: { not: superAdmin.id } }
  });
  console.log('  - تم حذف صلاحيات المستخدمين الملغيين (userCapability)');

  const deletedUsers = await prisma.user.deleteMany({
    where: {
      id: { not: superAdmin.id },
      email: { not: EXPECTED_SUPER_ADMIN_EMAIL },
    }
  });
  console.log(`  ✓ تم حذف ${deletedUsers.count} حساب مستخدم تجريبي. المتبقي: حساب المدير العام فقط.`);

  // STEP 3: CLEAN CONTENTBLOCKS (Zero fake / demo content)
  console.log('\n[المرحلة 4] تصفير وتطهير كتل المحتوى العام (ContentBlock)...');
  
  // Delete all activity fields, principles, beneficiaries, lifecycle, org_structure
  await prisma.contentBlock.deleteMany({
    where: {
      section: {
        in: ['activity_fields', 'principles', 'beneficiaries', 'lifecycle', 'org_structure']
      }
    }
  });
  console.log('  - تم حذف كتل قطاعات النشاط، المبادئ، الشركاء، دورة العمل، والهيكل التنظيمي.');

  // In identity: delete all descriptive text blocks so about page is completely clean
  await prisma.contentBlock.deleteMany({
    where: {
      section: 'identity',
      key: {
        in: [
          'goal_1', 'goal_2', 'goal_3', 'goal_4', 'goal_5', 'goal_6', 'goal_7', 'goal_8',
          'about_paragraph_1', 'about_paragraph_2', 'why_us', 'vision', 'mission',
          'about_cta', 'about_section_identity_tag', 'about_goals_subtitle'
        ]
      }
    }
  });
  console.log('  - تم حذف نصوص التعريف والرؤية والرسالة والأهداف التجريبية من صفحة عن المركز.');

  // In homepage: delete badges, fake headers and showcase cards
  await prisma.contentBlock.deleteMany({
    where: {
      section: 'homepage',
      key: {
        in: [
          'hero_badge_1', 'hero_badge_2', 'hero_badge_3',
          'section_principles_header', 'section_activity_header', 'section_beneficiaries_header',
          'showcase_research', 'showcase_training'
        ]
      }
    }
  });
  console.log('  - تم حذف شريط الشارات والبطاقات التسويقية التجريبية من الصفحة الرئيسية.');

  // Upsert official brand identity in navigation_brand and slogan
  await prisma.contentBlock.upsert({
    where: { section_key: { section: 'navigation_brand', key: 'brand_names' } },
    create: {
      section: 'navigation_brand',
      key: 'brand_names',
      titleAr: 'المركز المتكامل لخدمات الأمن والسلامة',
      titleEn: 'Integrated Center for Security, Safety',
      descriptionAr: 'والدراسات الميدانية',
      descriptionEn: 'and Field Studies',
      isVisible: true,
      order: 1,
      updatedByName: 'Clean Initialization',
    },
    update: {
      titleAr: 'المركز المتكامل لخدمات الأمن والسلامة',
      titleEn: 'Integrated Center for Security, Safety',
      descriptionAr: 'والدراسات الميدانية',
      descriptionEn: 'and Field Studies',
      isVisible: true,
    }
  });

  await prisma.contentBlock.upsert({
    where: { section_key: { section: 'navigation_brand', key: 'footer_content' } },
    create: {
      section: 'navigation_brand',
      key: 'footer_content',
      titleAr: 'جميع الحقوق محفوظة © المركز المتكامل لخدمات الأمن والسلامة والدراسات الميدانية',
      titleEn: 'All rights reserved © Integrated Center for Security, Safety & Field Studies',
      descriptionAr: 'منظومة مهنية متكاملة لخدمات الحراسات الأمنية، الرصد الميداني والتنبيه المبكر، الدراسات والتحليلات، والتدريب وبناء القدرات.',
      descriptionEn: 'Integrated professional system for protective security, early warning monitoring, field studies, and capacity building.',
      isVisible: true,
      order: 2,
      updatedByName: 'Clean Initialization',
    },
    update: {
      titleAr: 'جميع الحقوق محفوظة © المركز المتكامل لخدمات الأمن والسلامة والدراسات الميدانية',
      titleEn: 'All rights reserved © Integrated Center for Security, Safety & Field Studies',
      descriptionAr: 'منظومة مهنية متكاملة لخدمات الحراسات الأمنية، الرصد الميداني والتنبيه المبكر، الدراسات والتحليلات، والتدريب وبناء القدرات.',
      descriptionEn: 'Integrated professional system for protective security, early warning monitoring, field studies, and capacity building.',
      isVisible: true,
    }
  });

  await prisma.contentBlock.upsert({
    where: { section_key: { section: 'identity', key: 'slogan' } },
    create: {
      section: 'identity',
      key: 'slogan',
      titleAr: '«السلامة أولاً»',
      titleEn: '“Safety First”',
      descriptionAr: 'السلامة أولاً — Safety First',
      descriptionEn: 'Safety First — «السلامة أولاً»',
      isVisible: true,
      order: 1,
      updatedByName: 'Clean Initialization',
    },
    update: {
      titleAr: '«السلامة أولاً»',
      titleEn: '“Safety First”',
      descriptionAr: 'السلامة أولاً — Safety First',
      descriptionEn: 'Safety First — «السلامة أولاً»',
      isVisible: true,
    }
  });

  // STEP 4: UPDATE AND CLEAN SYSTEM SETTINGS
  console.log('\n[المرحلة 5] مراجعة وتنظيف الإعدادات النظامية المرجعية (SystemSetting)...');

  // Clean custom entries from FIELD_SOURCE_TYPES
  const cleanSourceTypes = [
    { id: 'FIELD_FOCAL_POINT', labelAr: 'نقطة اتصال ميدانية للمركز (Focal Point)', labelEn: 'Field Focal Point', isActive: true, order: 1 },
    { id: 'FIELD_STAFF', labelAr: 'كادر أو باحث ميداني تابع للمركز', labelEn: 'Center Field Staff / Researcher', isActive: true, order: 2 },
    { id: 'EYEWITNESS', labelAr: 'شاهد عيان مباشر من موقع الحدث', labelEn: 'Direct Eyewitness', isActive: true, order: 3 },
    { id: 'COMMUNITY_LEADER', labelAr: 'مصدر محلي / شخصية اعتبارية موثوقة', labelEn: 'Local / Community Source', isActive: true, order: 4 },
    { id: 'SECURITY_GUARD', labelAr: 'فرد حراسة أمنية موقعي', labelEn: 'On-site Security Guard', isActive: true, order: 5 },
    { id: 'CLIENT_REPRESENTATIVE', labelAr: 'ممثل المنشأة / العميل المستفيد', labelEn: 'Client / Beneficiary Representative', isActive: true, order: 6 },
    { id: 'OTHER', labelAr: 'مصدر آخر غير مصنف', labelEn: 'Other Unclassified Source', isActive: true, order: 7 }
  ];

  // Clean custom entries from OPERATIONAL_RISK_CATEGORIES
  const cleanRiskCategories = [
    { id: 'ARMED_CONFLICT_SECURITY', labelAr: 'مخاطر أمنية واشتباكات ونزاع مسلح', labelEn: 'Security & Armed Conflict Risks', isActive: true, order: 1 },
    { id: 'ACCESS_ROADBLOCK_DENIAL', labelAr: 'مخاطر إعاقة الوصول وقطع مسارات الحركة', labelEn: 'Access Denial & Roadblock Risks', isActive: true, order: 2 },
    { id: 'EXPLOSIVE_HAZARD_UXO', labelAr: 'مخاطر الذخائر المتفجرة والألغام', labelEn: 'Explosive Hazards & Landmines', isActive: true, order: 3 },
    { id: 'CRIMINALITY_THEFT', labelAr: 'مخاطر الجريمة والسطو والسرقة', labelEn: 'Criminality, Robbery & Theft', isActive: true, order: 4 },
    { id: 'STAFF_DETENTION_THREAT', labelAr: 'مخاطر احتجاز وتهديد الطواقم والكوادر', labelEn: 'Staff Detention & Threat Risks', isActive: true, order: 5 },
    { id: 'FACILITY_DAMAGE', labelAr: 'مخاطر أضرار المنشآت والمرافق', labelEn: 'Facility & Infrastructure Damage', isActive: true, order: 6 },
    { id: 'ENVIRONMENTAL_NATURAL', labelAr: 'مخاطر طبيعية وبيئية ومناخية', labelEn: 'Natural & Environmental Hazards', isActive: true, order: 7 },
    { id: 'HEALTH_SAFETY', labelAr: 'مخاطر الصحة والسلامة المهنية الميدانية', labelEn: 'Occupational Health & Safety', isActive: true, order: 8 }
  ];

  const officialSettings = [
    { key: 'site_name_ar', value: 'المركز المتكامل لخدمات الأمن والسلامة والدراسات الميدانية', category: 'GENERAL' },
    { key: 'site_name_en', value: 'Integrated Center for Security, Safety & Field Studies', category: 'GENERAL' },
    { key: 'site_acronym', value: 'FACSS', category: 'GENERAL' },
    { key: 'slogan_ar', value: '«السلامة أولاً»', category: 'BRANDING' },
    { key: 'slogan_en', value: '“Safety First”', category: 'BRANDING' },
    { key: 'subtitle_ar', value: 'منظومة مهنية متكاملة لخدمات الحراسات الأمنية، الرصد الميداني والتنبيه المبكر، الدراسات والتحليلات، التدريب والتأهيل، وأنظمة وتجهيزات السلامة.', category: 'BRANDING' },
    { key: 'subtitle_en', value: 'An integrated professional framework for protective security, field monitoring, early warning, field studies, training, and safety systems.', category: 'BRANDING' },
    { key: 'FIELD_SOURCE_TYPES', value: JSON.stringify(cleanSourceTypes), category: 'OPERATIONS' },
    { key: 'OPERATIONAL_RISK_CATEGORIES', value: JSON.stringify(cleanRiskCategories), category: 'OPERATIONS' },
    { key: 'social_facebook', value: '', category: 'SOCIAL' },
    { key: 'social_linkedin', value: '', category: 'SOCIAL' },
    { key: 'social_twitter', value: '', category: 'SOCIAL' },
    { key: 'social_whatsapp', value: '', category: 'SOCIAL' },
  ];

  for (const s of officialSettings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      create: s,
      update: { value: s.value, category: s.category }
    });
  }
  console.log('  ✓ تم تحديث وتطهير الإعدادات المرجعية الرسمية.');

  // STEP 5: CLEAN STORAGE DIRECTORY (Remove test files, keep structure and .gitkeep)
  console.log('\n[المرحلة 6] تنظيف ملفات التخزين والمرفقات التجريبية (Storage)...');
  const storageRoot = path.join(__dirname, '../storage');

  function cleanDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        cleanDirectory(fullPath);
        const remaining = fs.readdirSync(fullPath);
        if (remaining.length === 0 && entry.name.startsWith('cm')) {
          fs.rmdirSync(fullPath);
          console.log(`  - تم حذف مجلد الطلب التجريبي: ${entry.name}`);
        }
      } else if (entry.isFile()) {
        if (entry.name !== '.gitkeep') {
          fs.unlinkSync(fullPath);
          console.log(`  - تم حذف ملف مرفق تجريبي: ${entry.name}`);
        }
      }
    }
  }

  cleanDirectory(path.join(storageRoot, 'private/documents'));
  console.log('  ✓ تم تنظيف مجلد التخزين مع الحفاظ على البنية الأساسية.');

  // STEP 6: VERIFY FINAL COUNTS
  console.log('\n[المرحلة 7] التحقق النهائي من السجلات بعد التصفير:');
  const afterCounts = {};
  for (const m of models) {
    try {
      afterCounts[m] = await prisma[m].count();
    } catch {
      afterCounts[m] = null;
    }
  }

  const usersCount = await prisma.user.count();
  const remainingUsers = await prisma.user.findMany({
    select: { id: true, email: true, role: true, fullName: true, isActive: true }
  });

  console.log(`\n  📊 إجمالي عدد المستخدمين: ${usersCount}`);
  console.log(`  👤 تفاصيل الحساب المتبقي:`, JSON.stringify(remainingUsers, null, 2));

  console.log('\n  📊 مقارنة السجلات قبل وبعد:');
  const diffTable = [];
  for (const m of models) {
    if (beforeCounts[m] !== 0 || afterCounts[m] !== 0) {
      diffTable.push({
        Model: m,
        Before: beforeCounts[m],
        After: afterCounts[m],
        Status: afterCounts[m] === 0 ? 'CLEANED' : (m === 'user' ? 'SUPER_ADMIN_ONLY' : (m === 'systemSetting' || m === 'contentBlock' ? 'ESSENTIAL_RETAINED' : 'RETAINED'))
      });
    }
  }
  console.table(diffTable);

  console.log('\n=====================================================================');
  console.log('  ✅ اكتملت عملية التصفير والتهيئة النظيفة بنجاح تام!');
  console.log('=====================================================================');

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('\n❌ فشلت عملية التصفير:', err);
  process.exit(1);
});
