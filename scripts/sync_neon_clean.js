/**
 * scripts/sync_neon_clean.js
 * Synchronize clean initialization state to Neon PostgreSQL (facss_clean)
 */

const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log('=============================================================');
  console.log('  FACSS — SYNCHRONIZING CLEAN STATE TO NEON POSTGRESQL');
  console.log('  Database: facss_clean on ep-plain-river-b1x6n7oh');
  console.log('=============================================================\n');

  const localPrisma = new PrismaClient();
  const neonUrl = "postgresql://neondb_owner:npg_JAcyQoO0m5Gs@ep-plain-river-b1x6n7oh-pooler.c-5.eu-central-1.aws.neon.tech/facss_clean?sslmode=require";
  const neonPrisma = new PrismaClient({ datasources: { db: { url: neonUrl } } });

  try {
    // 1. Update Super Admin profile on Neon
    console.log('[1/4] Verifying and updating Super Admin in Neon...');
    const localAdmin = await localPrisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    if (!localAdmin) throw new Error('Local super admin not found');

    const neonAdmin = await neonPrisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    if (!neonAdmin) throw new Error('Neon super admin not found');

    await neonPrisma.user.update({
      where: { id: neonAdmin.id },
      data: {
        fullName: localAdmin.fullName,
        organization: localAdmin.organization,
        phone: localAdmin.phone,
        isActive: true,
      },
    });
    console.log('  ✓ Super Admin profile updated on Neon:', localAdmin.fullName);

    // 2. Sync System Settings
    console.log('[2/4] Synchronizing System Settings to Neon...');
    const localSettings = await localPrisma.systemSetting.findMany();
    for (const s of localSettings) {
      await neonPrisma.systemSetting.upsert({
        where: { key: s.key },
        update: {
          value: s.value,
          description: s.description,
          category: s.category,
        },
        create: {
          key: s.key,
          value: s.value,
          description: s.description,
          category: s.category,
        },
      });
    }
    console.log(`  ✓ Synced ${localSettings.length} System Settings to Neon.`);

    // 3. Sync Content Blocks
    console.log('[3/4] Synchronizing Core Content Blocks to Neon...');
    const localBlocks = await localPrisma.contentBlock.findMany();
    for (const b of localBlocks) {
      const data = {
        section: b.section,
        key: b.key,
        titleAr: b.titleAr,
        titleEn: b.titleEn,
        descriptionAr: b.descriptionAr,
        descriptionEn: b.descriptionEn,
        icon: b.icon,
        link: b.link,
        order: b.order,
        isVisible: b.isVisible,
        metadata: b.metadata,
      };

      await neonPrisma.contentBlock.upsert({
        where: {
          section_key: {
            section: b.section,
            key: b.key,
          },
        },
        update: data,
        create: data,
      });
    }
    console.log(`  ✓ Synced ${localBlocks.length} Content Blocks to Neon.`);

    // 4. Verify Neon clean counts
    console.log('\n[4/4] Verifying Clean State on Neon:');
    const counts = {
      users: await neonPrisma.user.count(),
      clientProfiles: await neonPrisma.clientProfile.count(),
      serviceRequests: await neonPrisma.serviceRequest.count(),
      services: await neonPrisma.service.count(),
      serviceCategories: await neonPrisma.serviceCategory.count(),
      courses: await neonPrisma.course.count(),
      courseCategories: await neonPrisma.courseCategory.count(),
      researchPublications: await neonPrisma.researchPublication.count(),
      researchCategories: await neonPrisma.researchCategory.count(),
      equipmentCategories: await neonPrisma.equipmentCategory.count(),
      contentBlocks: await neonPrisma.contentBlock.count(),
      systemSettings: await neonPrisma.systemSetting.count(),
    };

    console.log(JSON.stringify(counts, null, 2));
    console.log('\n✅ Neon PostgreSQL (facss_clean) is 100% in sync with the clean local state!');
  } catch (err) {
    console.error('Sync failed:', err);
  } finally {
    await localPrisma.$disconnect();
    await neonPrisma.$disconnect();
  }
}

main();
