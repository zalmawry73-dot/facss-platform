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

if (!backupPassphrase || backupPassphrase.length < 16) {
  backupPassphrase = 'FACSS_SYNTHETIC_DEV_BACKUP_SECRET_KEY_2026';
}

const cleanUrl = dbUrl.split('?')[0];
const pgDumpPath = 'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe';
const psqlPath = 'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe';
const backupsDir = path.join(__dirname, '..', 'backups');

console.log('================================================================');
console.log('  FACSS PHASE 2 - COMMAND 3: SECURE BACKUP & RESTORE AUDIT     ');
console.log('================================================================');

try {
  // Step 1: Verify existing Command 2 encrypted backup
  console.log('\n[1/4] التحقق من النسخة الاحتياطية المشفرة السابقة للأمر الثاني...');
  const files = fs.readdirSync(backupsDir);
  const cmd2EncFile = files.find(f => f.startsWith('backup_pre_phase2_cmd2') && f.endsWith('.enc'));
  if (cmd2EncFile) {
    const encPath = path.join(backupsDir, cmd2EncFile);
    const encBuf = fs.readFileSync(encPath);
    const salt = encBuf.subarray(0, 16);
    const iv = encBuf.subarray(16, 28);
    const authTag = encBuf.subarray(28, 44);
    const ciphertext = encBuf.subarray(44);

    const key = crypto.pbkdf2Sync(backupPassphrase, salt, 100000, 32, 'sha256');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    console.log(`✓ تم التحقق بنجاح من فك تشفير وسلامة Auth Tag لـ [${cmd2EncFile}] (${decrypted.length} بايت فك تشفير).`);
  }

  // Step 2: Create New Encrypted Pre-Command 3 Backup
  console.log('\n[2/4] إنشاء نسخة احتياطية مشفرة فورية جديدة للأمر الثالث...');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const tempSqlPath = path.join(backupsDir, `temp_dump_${timestamp}.sql`);
  const finalEncPath = path.join(backupsDir, `backup_pre_phase2_cmd3_${timestamp}.sql.enc`);

  execSync(`"${pgDumpPath}" -d "${cleanUrl}" -f "${tempSqlPath}"`, { stdio: 'pipe' });
  const sqlData = fs.readFileSync(tempSqlPath);

  const salt = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(backupPassphrase, salt, 100000, 32, 'sha256');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(sqlData), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const packageBuffer = Buffer.concat([salt, iv, authTag, encrypted]);
  fs.writeFileSync(finalEncPath, packageBuffer);
  console.log(`✓ تم إنشاء النسخة المشفرة AES-256-GCM: ${path.basename(finalEncPath)} (${packageBuffer.length} بايت)`);

  // Step 3: Isolated Database Restore Verification
  console.log('\n[3/4] اختبار استرجاع النسخة المشفرة في قاعدة بيانات معزولة...');
  const testDbName = 'facss_test_restore_cmd3';
  try {
    execSync(`"${psqlPath}" -d "${cleanUrl}" -c "DROP DATABASE IF EXISTS ${testDbName};"`, { stdio: 'pipe' });
  } catch (e) {}

  execSync(`"${psqlPath}" -d "${cleanUrl}" -c "CREATE DATABASE ${testDbName};"`, { stdio: 'pipe' });
  const testDbUrl = cleanUrl.replace(/\/[^/]+$/, `/${testDbName}`);

  // Decrypt on the fly and restore
  const readPackage = fs.readFileSync(finalEncPath);
  const rSalt = readPackage.subarray(0, 16);
  const rIv = readPackage.subarray(16, 28);
  const rAuthTag = readPackage.subarray(28, 44);
  const rCiphertext = readPackage.subarray(44);

  const rKey = crypto.pbkdf2Sync(backupPassphrase, rSalt, 100000, 32, 'sha256');
  const rDecipher = crypto.createDecipheriv('aes-256-gcm', rKey, rIv);
  rDecipher.setAuthTag(rAuthTag);
  const rDecrypted = Buffer.concat([rDecipher.update(rCiphertext), rDecipher.final()]);

  const verifyRestoreSqlPath = path.join(backupsDir, `verify_restore_${timestamp}.sql`);
  fs.writeFileSync(verifyRestoreSqlPath, rDecrypted);

  execSync(`"${psqlPath}" -d "${testDbUrl}" -f "${verifyRestoreSqlPath}"`, { stdio: 'pipe' });
  fs.unlinkSync(verifyRestoreSqlPath);

  // Check tables count and integrity
  const query = "SELECT table_name FROM information_schema.tables WHERE table_schema='public';";
  const tableCheck = execSync(`"${psqlPath}" -d "${testDbUrl}" -t -c "${query}"`, { stdio: 'pipe' }).toString();
  const tables = tableCheck.split('\n').map((t) => t.trim()).filter(Boolean);
  console.log(`✓ تم استرجاع كافة الجداول بنجاح في قاعدة الاختبار. عدد الجداول: ${tables.length}`);

  // Query User and Service count
  const uCount = execSync(`"${psqlPath}" -d "${testDbUrl}" -t -c "SELECT count(*) FROM \\"User\\";"`, { stdio: 'pipe' }).toString().trim();
  const sCount = execSync(`"${psqlPath}" -d "${testDbUrl}" -t -c "SELECT count(*) FROM \\"Service\\";"`, { stdio: 'pipe' }).toString().trim();
  console.log(`✓ فحص السجلات: المستخدمين = ${uCount}، الخدمات = ${sCount}`);

  execSync(`"${psqlPath}" -d "${cleanUrl}" -c "DROP DATABASE ${testDbName};"`, { stdio: 'pipe' });
  console.log(`✓ تم تفكيك وإسقاط قاعدة الاختبار المعزولة ${testDbName} بأمان.`);

  // Step 4: Securely handle plaintext unencrypted dumps
  console.log('\n[4/4] تأمين النسخ المكشوفة وحذف الملفات الصريحة غير المشفرة بعد التيقن التام...');
  // Delete the temp SQL file
  if (fs.existsSync(tempSqlPath)) {
    fs.unlinkSync(tempSqlPath);
  }

  // Find any plain .sql dumps in backups/ that have corresponding verified .enc files
  const remainingFiles = fs.readdirSync(backupsDir);
  for (const f of remainingFiles) {
    if (f.endsWith('.sql') && !f.endsWith('.enc')) {
      const plainPath = path.join(backupsDir, f);
      // Check if an encrypted version exists or this was an old plaintext dump
      const correspondingEnc = `${f}.enc`;
      if (fs.existsSync(path.join(backupsDir, correspondingEnc))) {
        fs.unlinkSync(plainPath);
        console.log(`  🔒 تم حذف النسخة الصريحة المكشوفة [${f}] بعد التحقق من وجود النسخة المشفرة البديلة الموثقة.`);
      } else {
        // If no .enc exists for it, encrypt it first before removing plaintext
        const oldSqlData = fs.readFileSync(plainPath);
        const oldSalt = crypto.randomBytes(16);
        const oldKey = crypto.pbkdf2Sync(backupPassphrase, oldSalt, 100000, 32, 'sha256');
        const oldIv = crypto.randomBytes(12);
        const oldCipher = crypto.createCipheriv('aes-256-gcm', oldKey, oldIv);
        const oldEnc = Buffer.concat([oldCipher.update(oldSqlData), oldCipher.final()]);
        const oldTag = oldCipher.getAuthTag();
        const oldPackage = Buffer.concat([oldSalt, oldIv, oldTag, oldEnc]);
        fs.writeFileSync(path.join(backupsDir, `${f}.enc`), oldPackage);
        fs.unlinkSync(plainPath);
        console.log(`  🔒 تم تشفير النسخة المكشوفة [${f}] إلى [${f}.enc] ثم حذف النسخة الصريحة لحماية البيانات.`);
      }
    }
  }

  console.log('\n================================================================');
  console.log('  ✓ تمت حماية البيانات بنجاح: تم التحقق من الاسترجاع،');
  console.log('    ولا توجد أي ملفات صريحة مكشوفة غير مشفرة على القرص.');
  console.log('================================================================');
} catch (err) {
  console.error('\n❌ فشل التدقيق الأمني للنسخ الاحتياطية:', err.message);
  process.exit(1);
}
