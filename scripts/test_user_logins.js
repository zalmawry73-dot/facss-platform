const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const USERS = [
  { email: 'services@facss-aden.com', pass: 'Service@FACSS2026', expectedRole: 'SERVICE_MANAGER' },
  { email: 'training@facss-aden.com', pass: 'Train@FACSS2026', expectedRole: 'TRAINING_MANAGER' },
  { email: 'research@facss-aden.com', pass: 'Research@FACSS2026', expectedRole: 'RESEARCH_MANAGER' },
  { email: 'client@yemen-bank.com', pass: 'Client@FACSS2026', expectedRole: 'CLIENT' },
  { email: 'trainee@facss-aden.com', pass: 'Trainee@FACSS2026', expectedRole: 'TRAINEE' },
];

async function testAll() {
  console.log('=== Testing User Logins & Credentials Validation ===\n');

  for (const u of USERS) {
    const user = await prisma.user.findUnique({
      where: { email: u.email },
      include: {
        clientProfile: true,
        capabilities: true,
      },
    });

    if (!user) {
      console.error(`[FAIL] User not found: ${u.email}`);
      continue;
    }

    const match = await bcrypt.compare(u.pass, user.passwordHash);
    if (!match) {
      console.error(`[FAIL] Password mismatch for: ${u.email}`);
      continue;
    }

    console.log(`[PASS] ${user.fullName} <${user.email}>`);
    console.log(`       Role: ${user.role} (Expected: ${u.expectedRole})`);
    console.log(`       IsActive: ${user.isActive}, TokenVersion: ${user.tokenVersion}`);
    if (user.clientProfile) {
      console.log(`       Client Profile: Company=${user.clientProfile.companyName}, Sector=${user.clientProfile.sector}, Status=${user.clientProfile.accountStatus}`);
    }
    if (user.capabilities && user.capabilities.length > 0) {
      console.log(`       Explicit Capabilities (${user.capabilities.length}): ${user.capabilities.map(c => c.capability).join(', ')}`);
    }
    console.log('------------------------------------------------------------');
  }
}

testAll()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
