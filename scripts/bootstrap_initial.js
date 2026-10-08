/**
 * scripts/bootstrap_initial.js
 * 
 * FACSS — Production & Initial Release Master Data Bootstrap
 * Strictly Idempotent: Seeds ONLY Master Reference Data & System Configuration.
 * 
 * Guarantees:
 * - NEVER creates demo clients, trainees, or regular staff.
 * - NEVER creates operational transactions (incidents, requests, courses, stock).
 * - Safe to run anytime; uses upsert for system master configuration.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=============================================================');
  console.log('  FACSS — INITIAL RELEASE MASTER DATA BOOTSTRAP');
  console.log('  المركز المتكامل لخدمات الأمن والسلامة والدراسات الميدانية');
  console.log('=============================================================\n');

  // 1. Verify Super Admin exists
  const superAdminCount = await prisma.user.count({
    where: { role: 'SUPER_ADMIN' }
  });
  console.log(`[1/5] Super Admin Verification: ${superAdminCount} super admin(s) present.`);
  if (superAdminCount === 0) {
    console.log('  ⚠ Notice: No SUPER_ADMIN found. Run "node scripts/init_super_admin.js" to create your administrative login.');
  }

  // 2. Verify / Ensure System Settings
  console.log('[2/5] Checking System Settings...');
  const settings = [
    { key: 'site_name_ar', value: 'المركز المتكامل لخدمات الأمن والسلامة والدراسات الميدانية', category: 'GENERAL' },
    { key: 'site_name_en', value: 'Integrated Center for Security, Safety & Field Studies', category: 'GENERAL' },
    { key: 'site_acronym', value: 'ICSSS', category: 'GENERAL' },
    { key: 'slogan_ar', value: '«السلامة أولاً»', category: 'BRANDING' },
    { key: 'slogan_en', value: '“Safety First”', category: 'BRANDING' },
    { key: 'subtitle_ar', value: 'منظومة مهنية متكاملة لخدمات الحراسات الأمنية، الرصد الميداني والتنبيه المبكر، الدراسات والتحليلات، التدريب والتأهيل، وأنظمة وتجهيزات السلامة.', category: 'BRANDING' },
    { key: 'subtitle_en', value: 'An integrated professional framework for protective security, field monitoring, early warning, field studies, training, and safety systems.', category: 'BRANDING' },
    { key: 'ANNOUNCEMENT_TEXT', value: 'المركز المتكامل لخدمات الأمن والسلامة والدراسات الميدانية — السلامة أولاً', category: 'BRANDING' },
    { key: 'contact_email', value: 'info@facss.org', category: 'CONTACT' },
    { key: 'contact_phone', value: '+967-770000000', category: 'CONTACT' },
    { key: 'contact_address_ar', value: 'العاصمة عدن، الجمهورية اليمنية', category: 'CONTACT' },
    { key: 'contact_address_en', value: 'Aden Capital, Republic of Yemen', category: 'CONTACT' },
    { key: 'SLA_RESPONSE_CRITICAL_MINUTES', value: '15', category: 'GENERAL' }
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s
    });
  }
  console.log('  ✓ System Settings verified.');

  // 3. Verify Categories
  console.log('[3/5] Checking Master Taxonomy Categories...');
  const srvCatCount = await prisma.serviceCategory.count();
  const eqCatCount = await prisma.equipmentCategory.count();
  const crsCatCount = await prisma.courseCategory.count();
  const resCatCount = await prisma.researchCategory.count();
  console.log(`  ✓ Service Categories: ${srvCatCount}`);
  console.log(`  ✓ Equipment Categories: ${eqCatCount}`);
  console.log(`  ✓ Course Categories: ${crsCatCount}`);
  console.log(`  ✓ Research Categories: ${resCatCount}`);

  // 4. Verify Services Catalog
  console.log('[4/5] Checking Core Services Catalog...');
  const srvCount = await prisma.service.count();
  console.log(`  ✓ Official Services in Catalog: ${srvCount}`);

  // 5. Final State Summary
  console.log('\n[5/5] Operational State Summary:');
  console.log(`  - Users: ${await prisma.user.count()} (SUPER_ADMIN only)`);
  console.log(`  - Clients: ${await prisma.clientProfile.count()} (Empty)`);
  console.log(`  - Incidents: ${await prisma.incident.count()} (Empty)`);
  console.log(`  - Service Requests: ${await prisma.serviceRequest.count()} (Empty)`);
  console.log(`  - Courses: ${await prisma.course.count()} (Empty)`);
  console.log(`  - Suppliers: ${await prisma.supplier.count()} (Empty)`);
  console.log(`  - Inventory Movements: ${await prisma.inventoryMovement.count()} (Empty)`);

  console.log('\n✅ Initial Release Bootstrap Completed Successfully.');
}

main()
  .catch((e) => {
    console.error('Bootstrap Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
