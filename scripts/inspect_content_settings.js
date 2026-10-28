const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.systemSetting.findMany();
  console.log('=== SYSTEM SETTINGS ===');
  console.log(JSON.stringify(settings.map(s => ({ key: s.key, value: s.value })), null, 2));

  const contentBlocks = await prisma.contentBlock.findMany();
  console.log('\n=== CONTENT BLOCKS (' + contentBlocks.length + ') ===');
  console.log(JSON.stringify(contentBlocks.map(c => ({
    id: c.id,
    key: c.key,
    section: c.section,
    titleAr: c.titleAr,
    titleEn: c.titleEn,
    isPublished: c.isPublished
  })), null, 2));

  await prisma.$disconnect();
}
main();
