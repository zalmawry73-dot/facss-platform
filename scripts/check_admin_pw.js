/**
 * Check admin password hash locally and sync to Neon
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const localPrisma = new PrismaClient();
  const neonUrl = "postgresql://neondb_owner:npg_JAcyQoO0m5Gs@ep-plain-river-b1x6n7oh-pooler.c-5.eu-central-1.aws.neon.tech/facss_clean?sslmode=require";
  const neonPrisma = new PrismaClient({ datasources: { db: { url: neonUrl } } });

  try {
    // Check local admin
    const localAdmin = await localPrisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    console.log('=== LOCAL ADMIN ===');
    console.log('Email:', localAdmin?.email);
    console.log('isActive:', localAdmin?.isActive);
    console.log('Hash prefix:', localAdmin?.passwordHash?.substring(0, 30));

    // Check Neon admin
    const neonAdmin = await neonPrisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    console.log('\n=== NEON ADMIN ===');
    console.log('Email:', neonAdmin?.email);
    console.log('isActive:', neonAdmin?.isActive);
    console.log('Hash prefix:', neonAdmin?.passwordHash?.substring(0, 30));

    // Test common passwords
    const testPasswords = ['Admin@FACSS2026', 'Admin@123456', 'Admin123456', 'admin123', 'Admin@1234', 'FACSS@2024', 'facss@2024', 'Admin@FACSS2025'];
    console.log('\n=== PASSWORD TESTS on LOCAL ===');
    for (const pw of testPasswords) {
      if (localAdmin?.passwordHash) {
        const match = await bcrypt.compare(pw, localAdmin.passwordHash);
        if (match) console.log('MATCH FOUND:', pw);
      }
    }

    console.log('\n=== PASSWORD TESTS on NEON ===');
    for (const pw of testPasswords) {
      if (neonAdmin?.passwordHash) {
        const match = await bcrypt.compare(pw, neonAdmin.passwordHash);
        if (match) console.log('MATCH FOUND:', pw);
      }
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await localPrisma.$disconnect();
    await neonPrisma.$disconnect();
  }
}

main();
