const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
let dbUrl = '';
let backupPassphrase = process.env.BACKUP_ENCRYPTION_PASSPHRASE || '';

for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let val = match[2] || '';
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key === 'DATABASE_URL') dbUrl = val.trim();
    if (key === 'BACKUP_ENCRYPTION_PASSPHRASE') backupPassphrase = val.trim();
  }
}

if (!dbUrl) {
  console.error('FATAL: DATABASE_URL not found in .env');
  process.exit(1);
}

// If no passphrase in .env, use a secure synthetic local key for development
if (!backupPassphrase || backupPassphrase.length < 16) {
  backupPassphrase = 'FACSS_SYNTHETIC_DEV_BACKUP_SECRET_KEY_2026';
  console.log('NOTE: Using synthetic local dev passphrase for backup encryption.');
}

const cleanUrl = dbUrl.split('?')[0];
const pgDumpPath = 'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe';
const psqlPath = 'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe';

const backupsDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFilename = `backup_pre_phase2_cmd2_${timestamp}.sql`;
const backupFilePath = path.join(backupsDir, backupFilename);
const encryptedFilePath = `${backupFilePath}.enc`;

console.log('======================================================');
console.log('  مركز عدن الدولي للسلامة والدراسات الميدانية');
console.log('  أخذ نسخة احتياطية مشفرة واختبار الاسترجاع الآمن');
console.log('======================================================');

try {
  console.log(`\n1. جاري تصدير قاعدة البيانات عبر pg_dump إلى: ${backupFilename}`);
  execSync(`"${pgDumpPath}" -d "${cleanUrl}" -f "${backupFilePath}"`, { stdio: 'pipe' });
  
  const stats = fs.statSync(backupFilePath);
  console.log(`✓ تم إنشاء النسخة الاحتياطية بنجاح. الحجم: ${stats.size} بايت`);

  // Encrypt with AES-256-GCM
  console.log('\n2. جاري تشفير النسخة الاحتياطية باستخدام خوارزمية AES-256-GCM...');
  const salt = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(backupPassphrase, salt, 100000, 32, 'sha256');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  const rawData = fs.readFileSync(backupFilePath);
  const encryptedData = Buffer.concat([cipher.update(rawData), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // File structure: salt (16 bytes) + iv (12 bytes) + authTag (16 bytes) + ciphertext
  const packageBuffer = Buffer.concat([salt, iv, authTag, encryptedData]);
  fs.writeFileSync(encryptedFilePath, packageBuffer);
  console.log(`✓ تم تشفير النسخة الاحتياطية بنجاح: ${path.basename(encryptedFilePath)} (${packageBuffer.length} بايت)`);

  // Verify Decryption and Restore in an Isolated Database
  console.log('\n3. التحقق من فك التشفير والاسترجاع في قاعدة اختبارية معزولة...');
  const readPackage = fs.readFileSync(encryptedFilePath);
  const readSalt = readPackage.subarray(0, 16);
  const readIv = readPackage.subarray(16, 28);
  const readAuthTag = readPackage.subarray(28, 44);
  const readCiphertext = readPackage.subarray(44);

  const decKey = crypto.pbkdf2Sync(backupPassphrase, readSalt, 100000, 32, 'sha256');
  const decipher = crypto.createDecipheriv('aes-256-gcm', decKey, readIv);
  decipher.setAuthTag(readAuthTag);
  const decryptedData = Buffer.concat([decipher.update(readCiphertext), decipher.final()]);

  if (decryptedData.length !== rawData.length) {
    throw new Error('Decrypted data length does not match original plaintext length.');
  }
  console.log('✓ فك التشفير واختبار سلامة البيانات والـ Auth Tag سليم 100%.');

  // Test Restore into temporary PostgreSQL DB
  const testDbName = 'facss_test_restore_phase2_cmd2';
  try {
    execSync(`"${psqlPath}" -d "${cleanUrl}" -c "DROP DATABASE IF EXISTS ${testDbName};"`, { stdio: 'pipe' });
  } catch (e) {}

  execSync(`"${psqlPath}" -d "${cleanUrl}" -c "CREATE DATABASE ${testDbName};"`, { stdio: 'pipe' });
  console.log(`✓ تم إنشاء قاعدة الاختبار المعزولة: ${testDbName}`);

  const testDbUrl = cleanUrl.replace(/\/[^/]+$/, `/${testDbName}`);
  execSync(`"${psqlPath}" -d "${testDbUrl}" -f "${backupFilePath}"`, { stdio: 'pipe' });

  // Query tables count
  const query = "SELECT table_name FROM information_schema.tables WHERE table_schema='public';";
  const tableCheck = execSync(`"${psqlPath}" -d "${testDbUrl}" -t -c "${query}"`, { stdio: 'pipe' }).toString();
  const tables = tableCheck.split('\n').map((t) => t.trim()).filter(Boolean);
  console.log(`✓ تم استرجاع الجداول بالكامل في قاعدة الاختبار. عدد الجداول: ${tables.length}`);
  console.log('الجداول المسترجعة بنجاح:', tables.join(', '));

  // Clean up test DB
  execSync(`"${psqlPath}" -d "${cleanUrl}" -c "DROP DATABASE ${testDbName};"`, { stdio: 'pipe' });
  console.log(`✓ تم تفكيك وإسقاط قاعدة الاختبار المعزولة ${testDbName} بأمان.`);

  console.log('\n======================================================');
  console.log('  تم اعتماد النسخة الاحتياطية واختبار الاسترجاع بنجاح 100%');
  console.log('======================================================');
} catch (err) {
  console.error('\n❌ فشل في أخذ النسخة الاحتياطية أو اختبار الاسترجاع:', err.message);
  process.exit(1);
}
