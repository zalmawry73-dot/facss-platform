/**
 * FACSS — سكربت تهيئة حساب الإدارة العليا الأول (SUPER_ADMIN)
 * 
 * ضوابط الأمان والتشغيل الصارمة:
 * 1. مخصص حصرياً للتهيئة الأولى: يمنع التنفيذ في حال وجود أي حساب SUPER_ADMIN سابق.
 * 2. إدخال كلمة المرور مخفي تماماً عبر Raw Mode: لا تظهر أي أحرف أو نجوم أو رموز في الطرفية.
 * 3. حظر Piped Input ووسائط سطر الأوامر: اشتراط TTY تفاعلي صريح عبر نافذة PowerShell.
 * 4. استعادة وضع الطرفية الطبيعي وإزالة مستمعات الإدخال عند الإكمال أو الإلغاء أو الأخطاء.
 * 5. استخدام create حصراً مع حظر تعديل أي حساب مسجل مسبقاً في النظام.
 * 6. تحقق برمجي مسبق من أن الاتصال محلي حصراً (127.0.0.1 أو localhost) والقاعدة هي facss_local_db.
 * 7. حماية الأسرار: عدم طباعة كلمة المرور أو تجزئتها أو رابط الاتصال في أي مخرجات.
 * 
 * الاستخدام: node scripts/init_super_admin.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// 1. حظر تمرير أي وسائط عبر سطر الأوامر (عدم قبول كلمة المرور أو أي مدخلات كمعاملات)
if (process.argv.length > 2) {
  console.error('\n[خطأ أمني حاسم]: يُمنع تمرير أي وسائط عبر سطر الأوامر (Command-Line Arguments).');
  console.error('لأسباب أمنية مشددة، يجب تشغيل السكربت بدون وسائط، وإدخال كلمة المرور تفاعلياً وبشكل مخفي فقط.\n');
  process.exit(1);
}

// 2. التحقق الآمن من ملف .env ووجهة قاعدة البيانات قبل أي اتصال
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('\n✗ خطأ حرج: ملف الإعدادات .env غير موجود في المسار الرئيسي للمشروع.');
  console.error('  يرجى نسخ القالب .env.example وضبط الإعدادات المحلية أولاً.\n');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
let dbUrl = '';
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*DATABASE_URL\s*=\s*(.*)?\s*$/);
  if (match) {
    dbUrl = (match[1] || '').trim().replace(/^["']|["']$/g, '');
    process.env.DATABASE_URL = dbUrl;
    break;
  }
}

if (!dbUrl) {
  console.error('\n✗ خطأ حرج: متغير DATABASE_URL غير محدد داخل ملف .env.\n');
  process.exit(1);
}

let parsedUrl;
try {
  parsedUrl = new URL(dbUrl);
} catch {
  console.error('\n✗ خطأ حرج: صيغة رابط الاتصال DATABASE_URL غير صالحة.\n');
  process.exit(1);
}

const hostname = parsedUrl.hostname.toLowerCase();
const dbName = parsedUrl.pathname.replace(/^\//, '');

// التحقق الإلزامي من أن الوجهة هي الخادم المحلي والقاعدة هي facss_local_db
if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
  console.error('\n[خطأ أمني حرج]: وجهة قاعدة البيانات ليست خادماً محلياً.');
  console.error(`تم رصد الوجهة: [${hostname}]. يُمنع تشغيل السكربت إلا على: localhost أو 127.0.0.1.`);
  process.exit(1);
}

if (dbName !== 'facss_local_db') {
  console.error('\n[خطأ أمني حرج]: اسم قاعدة البيانات غير مطابق للقاعدة المحلية المعتمدة.');
  console.error(`اسم القاعدة المحدد: [${dbName}]. المطلوب حصرياً: [facss_local_db].`);
  process.exit(1);
}

if (dbUrl.includes('neon.tech') || dbUrl.includes('pooler') || dbUrl.includes('aws')) {
  console.error('\n[تحذير أمني حرج]: تم رصد مؤشرات لقاعدة بيانات سحابية خارجية.');
  console.error('يُمنع منعاً باتاً تنفيذ هذا السكربت على بيئة سحابية خارج جهازك المحلي.\n');
  process.exit(1);
}

const prisma = new PrismaClient();

// دالة قراءة الأسئلة النصية العادية عبر readline مع إغلاق الواجهة فور الانتهاء
function askQuestion(query) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// دالة قراءة كلمة المرور بإخفاء كامل عبر Raw Mode مع حظر Piped Input
// تشترط وجود TTY تفاعلي صريح، وتستعيد وضع الطرفية الطبيعي وتزيل كافة المستمعات
function askHiddenPassword(query) {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;

    // إلغاء مسار Piped Input واشتراط TTY تفاعلي صريح يدعم Raw Mode
    if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
      console.error('\n[خطأ أمني حاسم]: بيئة الإدخال الحالية غير تفاعلية (Non-Interactive / Non-TTY).');
      console.error('يُمنع منعاً باتاً إدخال كلمة المرور عبر الإدخال المحوّل (Piped Input) أو التوجيه التلقائي.');
      console.error('يرجى تشغيل السكربت مباشرة من نافذة Windows PowerShell تفاعلية لإدخال كلمة المرور بأمان.\n');
      prisma.$disconnect().finally(() => {
        process.exit(1);
      });
      return;
    }

    process.stdout.write(query);

    let password = '';
    let inEscapeSequence = false;
    let isCleanedUp = false;

    // استعادة وضع الطرفية الطبيعي وإزالة جميع المستمعات بصورة سليمة
    function cleanup() {
      if (isCleanedUp) return;
      isCleanedUp = true;
      stdin.removeListener('data', onData);
      stdin.removeListener('end', onEnd);
      process.removeListener('SIGINT', onSigInt);
      try {
        if (typeof stdin.setRawMode === 'function') {
          stdin.setRawMode(false);
        }
      } catch {}
      try {
        stdin.pause();
      } catch {}
    }

    // معالجة إلغاء المستخدم عبر مقاطعة SIGINT أو Ctrl+C
    function onSigInt() {
      cleanup();
      process.stdout.write('\n\n[تم إلغاء العملية بواسطة المستخدم]\n');
      prisma.$disconnect().finally(() => {
        process.exit(1);
      });
    }

    // معالجة نهاية تدفق الإدخال (EOF)
    function onEnd() {
      cleanup();
      process.stdout.write('\n\n[تم إلغاء العملية: انقطاع تدفق الإدخال]\n');
      prisma.$disconnect().finally(() => {
        process.exit(1);
      });
    }

    process.once('SIGINT', onSigInt);

    const onData = (chunk) => {
      try {
        for (let i = 0; i < chunk.length; i++) {
          const char = chunk[i];

          // 1. الضغط على Enter (إنهاء الإدخال بنجاح)
          if (char === '\r' || char === '\n') {
            cleanup();
            process.stdout.write('\n');
            resolve(password);
            return;
          }

          // 2. الضغط على Ctrl+C أثناء وضع Raw Mode (إلغاء فوري وآمن)
          if (char === '\u0003') {
            onSigInt();
            return;
          }

          // 3. الضغط على Ctrl+D (نهاية الإدخال EOF) -> إلغاء فوري برمز غير صفري دون قبول الإدخال
          if (char === '\u0004') {
            cleanup();
            process.stdout.write('\n\n[تم إلغاء العملية: تم استلام إشارة نهاية الإدخال (EOF / Ctrl+D)]\n');
            prisma.$disconnect().finally(() => {
              process.exit(1);
            });
            return;
          }

          // 4. تجاهل تسلسلات الهروب وأزرار الأسهم (Escape Sequences)
          if (char === '\x1b') {
            inEscapeSequence = true;
            continue;
          }
          if (inEscapeSequence) {
            if ((char >= 'A' && char <= 'Z') || (char >= 'a' && char <= 'z') || char === '~') {
              inEscapeSequence = false;
            }
            continue;
          }

          // 5. الضغط على Backspace / Delete (حذف خانة بصمت تام)
          if (char === '\u0008' || char === '\x7f') {
            if (password.length > 0) {
              password = password.slice(0, -1);
            }
            continue;
          }

          // 6. إضافة الأحرف المطبوعة العادية دون طباعة أي رمز على الشاشة
          if (char.charCodeAt(0) >= 32) {
            password += char;
          }
        }
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    // تفعيل وضع Raw Mode لمنع نظام التشغيل من طباعة الأحرف (Zero Echo)
    try {
      stdin.resume();
      stdin.setRawMode(true);
      stdin.setEncoding('utf8');
      stdin.on('data', onData);
      stdin.once('end', onEnd);
    } catch {
      cleanup();
      console.error('\n[خطأ أمني]: فشل تفعيل وضع الطرفية التفاعلي المطلوب لحماية كلمة المرور.');
      prisma.$disconnect().finally(() => {
        process.exit(1);
      });
    }
  });
}

async function main() {
  console.log('\n=============================================================');
  console.log('  FACSS — تهيئة حساب الإدارة العليا الأول (SUPER_ADMIN)');
  console.log('  Aden First Center for Security Services & Strategic Studies');
  console.log('=============================================================\n');

  console.log(`[التحقق الأمني]: الخادم المحلي: [${hostname}] | قاعدة البيانات: [${dbName}]`);

  try {
    // 2. التحقق الحصري من التهيئة الأولى: التأكد من عدم وجود أي حساب SUPER_ADMIN سابق
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
      select: { id: true, email: true },
    });

    if (existingSuperAdmin) {
      console.error('\n[تنبيه أمني حاسم - تم إيقاف العملية]:');
      console.error('يوجد بالفعل حساب إدارة عليا (SUPER_ADMIN) مسجل في المنظومة.');
      console.error('هذا السكربت مخصص للتهيئة الأولى فقط ولا يسمح بتعديل الحسابات القائمة أو إضافة مدراء إضافيين.\n');
      process.exitCode = 1;
      return;
    }

    console.log('يرجى إدخال بيانات حساب المدير العام الذي سيتحكم بالمنظومة:\n');

    // 1. الاسم الكامل
    let fullName = await askQuestion('1. الاسم الكامل (Full Name): ');
    while (!fullName || fullName.trim().length < 3) {
      console.log('   خطأ: يجب إدخال اسم ثلاثي أو لا يقل عن 3 أحرف.');
      fullName = await askQuestion('1. الاسم الكامل: ');
    }

    // 2. البريد الإلكتروني الرسمي
    let email = await askQuestion('2. البريد الإلكتروني الرسمي (Email): ');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    while (!email || !emailRegex.test(email.trim())) {
      console.log('   خطأ: صيغة البريد الإلكتروني غير صالحة.');
      email = await askQuestion('2. البريد الإلكتروني الرسمي: ');
    }
    email = email.trim().toLowerCase();

    // 3. التحقق المسبق من عدم وجود مستخدم مسجل بنفس البريد الإلكتروني
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true },
    });

    if (existingUser) {
      console.error('\n✗ خطأ: البريد الإلكتروني المدخل مستخدم مسبقاً في النظام.');
      console.error('  لم يتم إجراء أي تعديل على الحساب الموجود أو تغيير كلمته أو دوره أو حالته.\n');
      process.exitCode = 1;
      return;
    }

    // 4. إدخال كلمة المرور وتأكيدها بإخفاء كامل وموثوق عبر Raw Mode
    let password = '';
    while (true) {
      password = await askHiddenPassword('3. كلمة المرور (Password - 8 خانات على الأقل، إدخال مخفي تماماً): ');
      if (!password || password.trim().length < 8) {
        console.log('   خطأ: يجب ألا تقل كلمة المرور عن 8 خانات.');
        continue;
      }
      if (password.length > 128) {
        console.log('   خطأ: كلمة المرور طويلة جداً (الحد الأقصى 128 خانة).');
        continue;
      }

      const confirmPassword = await askHiddenPassword('   تأكيد كلمة المرور (Confirm Password - إدخال مخفي تماماً): ');
      if (password !== confirmPassword) {
        console.log('   خطأ: كلمتا المرور غير متطابقتين. يرجى إعادة المحاولة.');
        continue;
      }
      break;
    }

    // 5. رقم الهاتف (اختياري)
    let phone = await askQuestion('4. رقم الهاتف (اختياري - اضغط Enter للتخطي): ');
    phone = phone.trim() || null;

    // 6. اسم المنشأة أو الجهة
    let organization = await askQuestion('5. اسم المنشأة / الجهة (افتراضي: مركز عدن الأول): ');
    organization = organization.trim() || 'مركز عدن الأول للخدمات الأمنية والدراسات الاستراتيجية';

    console.log('\nجارٍ تشفير كلمة المرور وتأسيس الحساب في قاعدة البيانات المحلية...');
    const passwordHash = await bcrypt.hash(password, 10);

    // 7. إنشاء الحساب حصراً عبر create (دون أي استخدام لـ upsert)
    const user = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        email,
        passwordHash,
        role: 'SUPER_ADMIN',
        isActive: true,
        phone,
        organization,
      },
    });

    console.log('\n✓ تم إنشاء حساب الإدارة العليا الأول بنجاح!');
    console.log('-------------------------------------------------------------');
    console.log(`  المعرف (ID):   ${user.id}`);
    console.log(`  الاسم الكامل:  ${user.fullName}`);
    console.log(`  البريد:        ${user.email}`);
    console.log(`  الدور:         ${user.role} (صلاحيات كاملة غير مقيدة)`);
    console.log(`  الحالة:        نشط (Active)`);
    console.log('-------------------------------------------------------------');
    console.log('\nيمكنك الآن تشغيل المنصة وتسجيل الدخول عبر الرابط:');
    console.log('http://localhost:3000/login\n');
  } catch (error) {
    console.error('\n✗ حدث خطأ أثناء تنفيذ عملية إنشاء الحساب.');
    if (error && error.code === 'P2002') {
      console.error('  السبب: يوجد تعارض في قيد فريد (البريد الإلكتروني مسجل بالفعل).');
    }
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    if (process.exitCode && process.exitCode !== 0) {
      process.exit(process.exitCode);
    }
  }
}

main();
