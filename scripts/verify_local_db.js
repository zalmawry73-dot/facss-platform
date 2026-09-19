/**
 * FACSS — أداة التحقق الآمن من وجهة قاعدة البيانات وفراغها (Pre-Prisma Safety Verification)
 * 
 * الهدف:
 * 1. التأكد التام من أن DATABASE_URL تشير حصرياً إلى خادم محلي (localhost / 127.0.0.1).
 * 2. التحقق من عدم الاتصال بقاعدة Neon أو أي خادم سحابي خارجي.
 * 3. فحص فراغ قاعدة البيانات من أي جداول سابقة قبل تطبيق أوامر Prisma.
 * 4. حماية الأسرار: لا تطبع كلمات المرور أو روابط الاتصال في الشاشة نهائياً.
 * 
 * الاستخدام: node scripts/verify_local_db.js
 */

const fs = require('fs');
const path = require('path');

// Load DATABASE_URL from .env safely without printing content
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('\n✗ خطأ حرج: ملف .env غير موجود في المسار الرئيسي.');
  console.error('  يرجى إنشاء ملف .env من القالب .env.example وضبط الإعدادات المحلية أولاً.\n');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
let dbUrl = '';
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*DATABASE_URL\s*=\s*(.*)?\s*$/);
  if (match) {
    dbUrl = (match[1] || '').trim().replace(/^["']|["']$/g, '');
    break;
  }
}

if (!dbUrl) {
  console.error('\n✗ خطأ حرج: لم يتم العثور على متغير DATABASE_URL داخل ملف .env.\n');
  process.exit(1);
}

// Parse connection URL
let parsedUrl;
try {
  parsedUrl = new URL(dbUrl);
} catch (err) {
  console.error('\n✗ خطأ حرج: صيغة DATABASE_URL غير صالحة.\n');
  process.exit(1);
}

console.log('\n=============================================================');
console.log('  FACSS — فحص أمان وجهة قاعدة البيانات قبل تشغيل Prisma');
console.log('=============================================================\n');

// Check 1: Hostname must be local
const host = parsedUrl.hostname.toLowerCase();
console.log(`1. فحص وجهة الاتصال (Host): [${host}]`);

if (host !== 'localhost' && host !== '127.0.0.1') {
  console.error('\n[تحذير أمني شديد الخطورة]');
  console.error(`✗ الوجهة المحددة [${host}] ليست خادماً محلياً!`);
  console.error('  يُمنع منعاً باتاً تشغيل أوامر التهيئة أو db push على خوادم سحابية أو خارجية.');
  console.error('  تأكد من تعديل DATABASE_URL لتشير حصرياً إلى: localhost أو 127.0.0.1\n');
  process.exit(1);
}

if (dbUrl.includes('neon.tech') || dbUrl.includes('aws') || dbUrl.includes('pooler')) {
  console.error('\n[تحذير أمني شديد الخطورة]');
  console.error('✗ تم اكتشاف مؤشرات تشير إلى قاعدة سحابية (Neon/AWS).');
  console.error('  يجب فصل البيئة المحلية تماماً عن قاعدة Neon السحابية المستخدمة سابقاً.\n');
  process.exit(1);
}

console.log('   ✓ تم التحقق: الوجهة محلية 100% (localhost / 127.0.0.1).');

// Check 2: Database name
const dbName = parsedUrl.pathname.replace(/^\//, '');
console.log(`2. فحص اسم قاعدة البيانات: [${dbName}]`);
if (!dbName) {
  console.error('   ✗ خطأ: لم يتم تحديد اسم قاعدة البيانات في الرابط.\n');
  process.exit(1);
}
console.log(`   ✓ تم التحقق: قاعدة البيانات المستهدفة هي [${dbName}].`);

// Check 3: Connect and check table count
const { Client } = require('pg');

async function checkEmptiness() {
  console.log('3. فحص فراغ قاعدة البيانات من الجداول...');
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE';
    `);

    const tableCount = res.rows.length;
    if (tableCount === 0) {
      console.log('   ✓ تم التحقق: قاعدة البيانات فارغة تماماً (0 جداول).');
      console.log('\n-------------------------------------------------------------');
      console.log('✓ نتيجة الفحص: البيئة آمنة تماماً وجاهزة لتنفيذ npx prisma db push.');
      console.log('=============================================================\n');
      await client.end();
      process.exit(0);
    } else {
      console.warn(`\n[تنبيه]: قاعدة البيانات تحتوي بالفعل على ${tableCount} جدول/جداول.`);
      console.warn('إذا كانت هذه الجداول من ترحيل سابق لنفس المشروع وتريد الاستمرار، يمكنك ذلك.');
      console.warn('أما إذا كنت تريد بداية نظيفة من الصفر، يرجى إنشاء قاعدة فارغة مخصصة.\n');
      await client.end();
      process.exit(0);
    }
  } catch (connErr) {
    console.error(`\n✗ تعذر الاتصال بخادم PostgreSQL المحلي: ${connErr.message}`);
    console.error('  تأكد من أن خدمة PostgreSQL تعمل محلياً وأن كلمة المرور واسم القاعدة صحيحان في .env.\n');
    process.exit(1);
  }
}

checkEmptiness();
