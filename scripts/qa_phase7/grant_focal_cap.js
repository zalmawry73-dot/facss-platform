const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: 'postgresql://postgres@127.0.0.1:5544/facss_qa?schema=public' } } });

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'field.focal@facss-aden.com' } });
  if (user) {
    await prisma.userCapability.upsert({
      where: { userId_capability: { userId: user.id, capability: 'submit_incident' } },
      create: { userId: user.id, capability: 'submit_incident' },
      update: {}
    });
    console.log('Granted submit_incident to focal point in QA DB successfully');
  }
  await prisma.$disconnect();
}

main().catch(console.error);
