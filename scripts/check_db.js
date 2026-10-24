const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDb() {
  try {
    await prisma.$connect();
    console.log('✅ نجح الاتصال: قاعدة البيانات تعمل بشكل ممتاز!');
    
    // Quick count check
    const userCount = await prisma.user.count();
    console.log(`📊 إجمالي عدد المستخدمين في القاعدة: ${userCount}`);
  } catch (err) {
    console.error('❌ فشل الاتصال بقاعدة البيانات:');
    console.error(err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDb();
