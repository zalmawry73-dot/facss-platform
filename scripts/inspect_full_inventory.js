const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const models = Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_'));
  console.log('Total Prisma Models detected:', models.length);
  const results = [];
  let totalRecords = 0;
  for (const m of models) {
    try {
      const count = await prisma[m].count();
      totalRecords += count;
      results.push({ model: m, count, status: 'ok' });
    } catch (e) {
      results.push({ model: m, count: null, status: 'error', error: e.message });
    }
  }

  // Check specific users
  const users = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true, role: true, isActive: true }
  });

  console.log('\n=== USERS IN DATABASE ===');
  console.log(JSON.stringify(users, null, 2));

  console.log('\n=== MODEL RECORD COUNTS (Non-zero) ===');
  const nonZero = results.filter(r => r.count > 0);
  console.log(JSON.stringify(nonZero, null, 2));

  console.log('\n=== ALL MODELS SUMMARY ===');
  console.log(`Total Models: ${models.length}`);
  console.log(`Total Records across all models: ${totalRecords}`);
  console.log(`Non-zero Models: ${nonZero.length}`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
