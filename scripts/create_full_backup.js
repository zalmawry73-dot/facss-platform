const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const backupPath = path.join(backupDir, `backup_before_clean_initialization_${timestamp}.json`);

  console.log('--- Starting Full Database Backup ---');
  const models = Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_'));
  
  const backupData = {
    createdAt: new Date().toISOString(),
    databaseUrl: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@'),
    models: {}
  };

  let totalRecords = 0;
  for (const m of models) {
    try {
      const records = await prisma[m].findMany();
      backupData.models[m] = records;
      totalRecords += records.length;
      if (records.length > 0) {
        console.log(`  ✓ ${m}: ${records.length} records exported`);
      }
    } catch (e) {
      console.warn(`  ⚠ Could not export ${m}:`, e.message);
    }
  }

  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`\n✅ Backup successfully created at:\n   ${backupPath}`);
  console.log(`   Total records backed up: ${totalRecords}`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Backup error:', err);
  process.exit(1);
});
