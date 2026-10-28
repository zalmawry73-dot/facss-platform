const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const USERS_TO_CREATE = [
  {
    email: 'services@facss-aden.com',
    password: 'Service@FACSS2026',
    fullName: 'مدير العمليات والخدمات الميدانية',
    role: 'SERVICE_MANAGER',
    phone: '+967 777 111 222',
    organization: 'مركز الحلول المتكاملة للأمن والسلامة (FACSS)',
    capabilities: [
      'manage_requests',
      'manage_inventory',
      'manage_procurement',
      'manage_equipment',
      'manage_inspections',
      'submit_incident',
      'verify_incident',
      'analyze_incident',
      'draft_incident_alert',
      'view_risk_register',
      'manage_risk_register',
      'view_kpi',
      'qa_reports',
    ],
  },
  {
    email: 'training@facss-aden.com',
    password: 'Train@FACSS2026',
    fullName: 'مدير التدريب وبناء القدرات',
    role: 'TRAINING_MANAGER',
    phone: '+967 777 333 444',
    organization: 'أكاديمية التدريب وبناء القدرات - FACSS',
    capabilities: [
      'manage_training',
      'manage_trainers',
      'manage_training_content',
      'view_kpi',
    ],
  },
  {
    email: 'research@facss-aden.com',
    password: 'Research@FACSS2026',
    fullName: 'مدير الدراسات والبحوث الميدانية',
    role: 'RESEARCH_MANAGER',
    phone: '+967 777 555 666',
    organization: 'قسم الأبحاث والدراسات الميدانية - FACSS',
    capabilities: [
      'manage_research',
      'view_risk_register',
      'assess_risk',
      'analyze_incident',
      'view_kpi',
    ],
  },
  {
    email: 'client@yemen-bank.com',
    password: 'Client@FACSS2026',
    fullName: 'إدارة الأمن والسلامة - بنك اليمن الدولي',
    role: 'CLIENT',
    phone: '+967 1 234567',
    organization: 'بنك اليمن الدولي',
    clientProfile: {
      companyName: 'بنك اليمن الدولي',
      sector: 'القطاع المصرفي والمالي',
      accountStatus: 'ACTIVE',
    },
  },
  {
    email: 'trainee@facss-aden.com',
    password: 'Trainee@FACSS2026',
    fullName: 'أحمد سالم النعيمي',
    role: 'TRAINEE',
    phone: '+967 771 987 654',
    organization: 'هيئة السلامة والأمن الميداني',
  },
];

async function main() {
  console.log('=== Starting Users Setup ===');

  for (const item of USERS_TO_CREATE) {
    const passwordHash = await bcrypt.hash(item.password, 10);

    const user = await prisma.user.upsert({
      where: { email: item.email },
      update: {
        passwordHash,
        fullName: item.fullName,
        role: item.role,
        phone: item.phone,
        organization: item.organization,
        isActive: true,
        tokenVersion: { increment: 1 },
      },
      create: {
        email: item.email,
        passwordHash,
        fullName: item.fullName,
        role: item.role,
        phone: item.phone,
        organization: item.organization,
        isActive: true,
        tokenVersion: 1,
      },
    });

    console.log(`[USER UPSERTED] ${user.email} (${user.role}) - ID: ${user.id}`);

    // Setup client profile if applicable
    if (item.clientProfile) {
      await prisma.clientProfile.upsert({
        where: { userId: user.id },
        update: {
          companyName: item.clientProfile.companyName,
          sector: item.clientProfile.sector,
          accountStatus: item.clientProfile.accountStatus,
        },
        create: {
          userId: user.id,
          companyName: item.clientProfile.companyName,
          sector: item.clientProfile.sector,
          accountStatus: item.clientProfile.accountStatus,
        },
      });
      console.log(`  -> Client Profile updated for ${user.email}`);
    }

    // Setup capabilities if applicable
    if (item.capabilities && item.capabilities.length > 0) {
      // Clear old and insert new
      await prisma.userCapability.deleteMany({
        where: { userId: user.id },
      });

      for (const cap of item.capabilities) {
        await prisma.userCapability.create({
          data: {
            userId: user.id,
            capability: cap,
          },
        });
      }
      console.log(`  -> Granted ${item.capabilities.length} capabilities to ${user.email}`);
    }
  }

  console.log('=== All 5 Users Successfully Configured ===');
}

main()
  .catch((e) => {
    console.error('Error setting up users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
