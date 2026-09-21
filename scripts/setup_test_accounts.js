const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function setup() {
  const hash = await bcrypt.hash('TestPass@2026', 10);
  
  // 1. Update existing test superadmin
  await prisma.user.updateMany({
    where: { email: 'test.superadmin@aicsfa-test.org' },
    data: { passwordHash: hash, isActive: true }
  });

  // 2. Update existing focal point
  await prisma.user.updateMany({
    where: { email: 'test.focal.1789933479649@facss.org' },
    data: { passwordHash: hash, isActive: true }
  });

  // 3. Upsert safe test client
  const clientUser = await prisma.user.upsert({
    where: { email: 'test.client@aicsfa-test.org' },
    update: { passwordHash: hash, isActive: true, role: 'CLIENT' },
    create: {
      email: 'test.client@aicsfa-test.org',
      fullName: 'منظمة اختبار إنسانية (عميل)',
      organization: 'UN OCHA Test Mission',
      passwordHash: hash,
      role: 'CLIENT',
      isActive: true,
      phone: '+967-770000010'
    }
  });

  await prisma.clientProfile.upsert({
    where: { userId: clientUser.id },
    update: { companyName: 'UN OCHA Test Mission', sector: 'HUMANITARIAN' },
    create: {
      userId: clientUser.id,
      companyName: 'UN OCHA Test Mission',
      sector: 'HUMANITARIAN',
      accountStatus: 'ACTIVE'
    }
  });

  // 4. Upsert safe test trainee
  await prisma.user.upsert({
    where: { email: 'test.trainee@aicsfa-test.org' },
    update: { passwordHash: hash, isActive: true, role: 'TRAINEE' },
    create: {
      email: 'test.trainee@aicsfa-test.org',
      fullName: 'متدرب اختبار السلامة الميدانية',
      organization: 'مؤسسة الغد الإغاثية',
      passwordHash: hash,
      role: 'TRAINEE',
      isActive: true,
      phone: '+967-770000011'
    }
  });

  console.log('Test accounts successfully configured with test password: TestPass@2026');
}

setup().catch(console.error).finally(() => prisma.$disconnect());
