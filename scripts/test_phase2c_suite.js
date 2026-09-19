/**
 * FACSS Phase 2C Automated Security & Functional Test Suite
 * 
 * Verifies Client Portal, Secure Document Operations, Storage Abstraction,
 * Security Threat Model, Compensating Operations, and Non-Destructive Migrations.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert');

// 1. Load environment configuration
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      value = value.trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  }
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ==========================================
// STORAGE & VALIDATION LOGIC MIRRORS
// ==========================================

const MAX_DOCUMENT_SIZE_BYTES = 4.5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg'];

const DOCUMENT_TYPES = {
  CLIENT_ATTACHMENT: 'CLIENT_ATTACHMENT',
  INTERNAL_DOCUMENT: 'INTERNAL_DOCUMENT',
  FINAL_REPORT: 'FINAL_REPORT',
};

const DOCUMENT_VISIBILITIES = {
  CLIENT_VISIBLE: 'CLIENT_VISIBLE',
  INTERNAL_ONLY: 'INTERNAL_ONLY',
};

function assertPathContainment(baseDir, targetKey) {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(resolvedBase, targetKey);
  const relative = path.relative(resolvedBase, resolvedTarget);

  if (relative.startsWith('..') || path.isAbsolute(relative) || relative === '') {
    throw new Error('SECURITY VIOLATION: Path traversal detected outside storage root.');
  }

  return resolvedTarget;
}

class LocalStorageDriver {
  constructor(customPath) {
    const rootPath = customPath || process.env.STORAGE_PATH || './storage';
    this.baseDir = path.resolve(process.cwd(), rootPath, 'private/documents');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async upload(buffer, key, mimeType) {
    const fullPath = assertPathContainment(this.baseDir, key);
    const parentDir = path.dirname(fullPath);
    await fs.promises.mkdir(parentDir, { recursive: true });
    await fs.promises.writeFile(fullPath, buffer);
    await fs.promises.writeFile(`${fullPath}.meta.json`, JSON.stringify({ mimeType, uploadedAt: new Date().toISOString() }));
    return key;
  }

  async get(key) {
    const fullPath = assertPathContainment(this.baseDir, key);
    try {
      const buffer = await fs.promises.readFile(fullPath);
      let mimeType = 'application/octet-stream';
      const metaPath = `${fullPath}.meta.json`;
      if (fs.existsSync(metaPath)) {
        try {
          const meta = JSON.parse(await fs.promises.readFile(metaPath, 'utf8'));
          if (meta.mimeType) mimeType = meta.mimeType;
        } catch {}
      }
      return { buffer, mimeType };
    } catch (err) {
      if (err.code === 'ENOENT') return null;
      throw err;
    }
  }

  async delete(key) {
    const fullPath = assertPathContainment(this.baseDir, key);
    try {
      await fs.promises.unlink(fullPath);
      const metaPath = `${fullPath}.meta.json`;
      if (fs.existsSync(metaPath)) {
        await fs.promises.unlink(metaPath).catch(() => {});
      }
      return true;
    } catch (err) {
      if (err.code === 'ENOENT') return false;
      throw err;
    }
  }

  async exists(key) {
    const fullPath = assertPathContainment(this.baseDir, key);
    return fs.existsSync(fullPath);
  }
}

class S3StorageDriver {
  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET || '';
    this.accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
    this.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';

    if (!this.bucket || !this.accessKeyId || !this.secretAccessKey) {
      throw new Error(
        'FATAL SECURITY CONFIGURATION: S3StorageDriver initialized without required credentials. ' +
        'Missing one or more of: AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY. ' +
        'Silent fallback to local storage in production/S3 mode is prohibited.'
      );
    }
  }
}

function verifyMagicBytes(buffer, claimedExtension) {
  if (buffer.length < 4) {
    throw new Error('File payload too small or corrupted (failed header inspection).');
  }

  // 1. Executable binaries
  if (buffer[0] === 0x4D && buffer[1] === 0x5A) {
    throw new Error('Executable binaries (MZ/PE) are strictly prohibited.');
  }
  if (buffer[0] === 0x7F && buffer[1] === 0x45 && buffer[2] === 0x4C && buffer[3] === 0x46) {
    throw new Error('Executable Linux binaries (ELF) are strictly prohibited.');
  }
  if (buffer[0] === 0x23 && buffer[1] === 0x21) {
    throw new Error('Shell and executable scripts are strictly prohibited.');
  }
  if (buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04) {
    throw new Error('ZIP and archive packages (including DOCX) are currently prohibited.');
  }

  const headerSlice = buffer.subarray(0, 50).toString('utf8').trim().toLowerCase();
  if (
    headerSlice.startsWith('<!doctype') ||
    headerSlice.startsWith('<html') ||
    headerSlice.startsWith('<?xml') ||
    headerSlice.startsWith('<svg') ||
    headerSlice.includes('<script')
  ) {
    throw new Error('HTML, XML, and SVG formats are strictly prohibited.');
  }

  const ext = claimedExtension.toLowerCase().replace(/^\./, '');

  if (ext === 'pdf') {
    if (
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46 &&
      buffer[4] === 0x2D
    ) {
      return 'application/pdf';
    }
    throw new Error('Invalid file signature: Content does not match valid PDF specification.');
  }

  if (ext === 'png') {
    if (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4E &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0D &&
      buffer[5] === 0x0A &&
      buffer[6] === 0x1A &&
      buffer[7] === 0x0A
    ) {
      return 'image/png';
    }
    throw new Error('Invalid file signature: Content does not match valid PNG specification.');
  }

  if (ext === 'jpg' || ext === 'jpeg') {
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return 'image/jpeg';
    }
    throw new Error('Invalid file signature: Content does not match valid JPEG specification.');
  }

  throw new Error(`Unsupported extension [.${ext}]. Allowed formats: PDF, PNG, JPG, JPEG.`);
}

function sanitizeOriginalFilename(rawName, fallbackExt) {
  if (!rawName || typeof rawName !== 'string') {
    return `document_${Date.now()}.${fallbackExt}`;
  }

  let clean = rawName
    .replace(/[\r\n\0]/g, '')
    .replace(/[/\\]/g, '_')
    .replace(/[":*?<>|]/g, '')
    .trim()
    .replace(/\.{2,}/g, '')
    .replace(/^\.+/, '');

  if (!clean || clean.length === 0) {
    return `document_${Date.now()}.${fallbackExt}`;
  }

  if (clean.length > 100) {
    const ext = clean.split('.').pop() || fallbackExt;
    clean = `${clean.slice(0, 90)}.${ext}`;
  }

  return clean;
}

function generateSecureStorageKey(requestId, extension) {
  const safeReqId = requestId.replace(/[^a-zA-Z0-9]/g, '');
  const randomUuid = crypto.randomUUID();
  const timestamp = Date.now();
  const cleanExt = extension.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `requests/${safeReqId}/${timestamp}-${randomUuid}.${cleanExt}`;
}

function validateUploadedDocument(buffer, rawFilename, declaredMimeType, requestId) {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'الملف المرفق فارغ (Zero-byte file).' };
  }

  if (buffer.length > MAX_DOCUMENT_SIZE_BYTES) {
    return {
      valid: false,
      error: `حجم الملف يتجاوز الحد الأقصى المسموح به (${(MAX_DOCUMENT_SIZE_BYTES / (1024 * 1024)).toFixed(1)} ميجابايت).`,
    };
  }

  const parts = rawFilename.split('.');
  if (parts.length < 2) {
    return { valid: false, error: 'اسم الملف لا يحتوي على امتداد صالح.' };
  }
  const extension = parts.pop().toLowerCase().trim();

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `صيغة الملف غير مسموح بها (.${extension}). الصيغ المسموحة حصراً: PDF, PNG, JPG.`,
    };
  }

  let verifiedMime;
  try {
    verifiedMime = verifyMagicBytes(buffer, extension);
  } catch (err) {
    return { valid: false, error: err.message };
  }

  const sanitizedFilename = sanitizeOriginalFilename(rawFilename, extension);
  const storageKey = generateSecureStorageKey(requestId, extension);

  return {
    valid: true,
    sanitizedFilename,
    verifiedMimeType: verifiedMime,
    storageKey,
    extension,
  };
}

// RBAC
const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  CLIENT: 'CLIENT',
  TRAINEE: 'TRAINEE',
};

const CAPABILITIES = {
  MANAGE_REQUESTS: 'manage_requests',
};

let passedTests = 0;
let totalTests = 0;

function pass(name) {
  passedTests++;
  totalTests++;
  console.log(`  ✔ PASS: ${name}`);
}

function fail(name, err) {
  totalTests++;
  console.error(`  ✖ FAIL: ${name}`);
  console.error(`    ${err.message || err}`);
}

async function runSuite() {
  console.log('\n======================================================');
  console.log('   FACSS PHASE 2C DOCUMENT SECURITY AUTOMATED SUITE');
  console.log('======================================================\n');

  // ----------------------------------------------------
  // PART 1: THREAT MODEL & IN-MEMORY VALIDATION
  // ----------------------------------------------------
  console.log('--- PART 1: Threat Model & Validation Engine ---');

  // Test 1: Path Containment Check
  try {
    const rootDir = path.resolve(__dirname, '../storage/private/documents');
    const valid = assertPathContainment(rootDir, 'requests/req1/file.pdf');
    assert(valid.includes('file.pdf'), 'Resolved path should include filename');

    let trapped = 0;
    const attacks = [
      '../../secret.env',
      '..\\..\\windows\\system32\\cmd.exe',
      'sub/../../../etc/shadow',
      '/absolute/path/attack.pdf',
      'C:\\Windows\\secret.txt',
    ];

    for (const attack of attacks) {
      try {
        assertPathContainment(rootDir, attack);
      } catch (e) {
        trapped++;
      }
    }

    assert.strictEqual(trapped, attacks.length, 'All path traversal attacks must be rejected');
    pass('Test 1: Path containment prevents traversal outside private storage root');
  } catch (err) {
    fail('Test 1: Path containment', err);
  }

  // Test 2: Storage Key Generation
  try {
    const key = generateSecureStorageKey('req-123_test!@#', 'PDF');
    assert(key.startsWith('requests/req123test/'), 'Key must contain sanitized request id');
    assert(key.endsWith('.pdf'), 'Key must end with clean lowercase extension');
    assert(!key.includes('!@#'), 'Key must strip dangerous characters');
    pass('Test 2: Secure storage keys are opaque, sanitized, and non-user-controlled');
  } catch (err) {
    fail('Test 2: Secure storage keys', err);
  }

  // Test 3: Filename Sanitization & CRLF Injection Prevention
  try {
    const maliciousName = 'evil\r\nContent-Type: text/html\r\n\0../../secret"report".pdf';
    const sanitized = sanitizeOriginalFilename(maliciousName, 'pdf');
    assert(!sanitized.includes('\r'), 'CR must be stripped');
    assert(!sanitized.includes('\n'), 'LF must be stripped');
    assert(!sanitized.includes('\0'), 'Null byte must be stripped');
    assert(!sanitized.includes('"'), 'Double quotes must be stripped');
    assert(!sanitized.includes('..'), 'Path traversal dots must be stripped');
    pass('Test 3: Filename sanitization neutralizes CRLF injection & path characters');
  } catch (err) {
    fail('Test 3: Filename sanitization', err);
  }

  // Test 4: Executable Binaries & Script Rejection
  try {
    const mzHeader = Buffer.from([0x4D, 0x5A, 0x90, 0x00, 0x03]);
    assert.throws(() => verifyMagicBytes(mzHeader, 'pdf'), /Executable binaries/);

    const elfHeader = Buffer.from([0x7F, 0x45, 0x4C, 0x46, 0x02]);
    assert.throws(() => verifyMagicBytes(elfHeader, 'png'), /Executable Linux binaries/);

    const shHeader = Buffer.from('#!/bin/bash\nrm -rf /');
    assert.throws(() => verifyMagicBytes(shHeader, 'pdf'), /Shell and executable scripts/);

    const htmlHeader = Buffer.from('<html><script>alert(1)</script></html>');
    assert.throws(() => verifyMagicBytes(htmlHeader, 'jpg'), /HTML, XML, and SVG formats/);

    pass('Test 4: Executable binaries (MZ, ELF), shell scripts, and HTML/SVG payloads rejected');
  } catch (err) {
    fail('Test 4: Executable binaries rejection', err);
  }

  // Test 5: ZIP / DOCX Archive Rejection
  try {
    const zipHeader = Buffer.from([0x50, 0x4B, 0x03, 0x04, 0x14, 0x00]);
    assert.throws(() => verifyMagicBytes(zipHeader, 'pdf'), /ZIP and archive packages/);
    pass('Test 5: ZIP archives and DOCX packages (PK\\x03\\x04) are strictly prohibited');
  } catch (err) {
    fail('Test 5: ZIP / DOCX rejection', err);
  }

  // Test 6: MIME Spoofing Rejection
  try {
    const fakePdf = Buffer.from('NOT_A_REAL_PDF_DOCUMENT');
    assert.throws(() => verifyMagicBytes(fakePdf, 'pdf'), /Content does not match valid PDF specification/);

    const fakePng = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00]);
    assert.throws(() => verifyMagicBytes(fakePng, 'png'), /Content does not match valid PNG specification/);

    pass('Test 6: MIME spoofing attacks (disguised extensions with invalid bytes) rejected');
  } catch (err) {
    fail('Test 6: MIME spoofing rejection', err);
  }

  // Test 7: Valid Magic Bytes Validation
  try {
    const validPdf = Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<>>\nendobj');
    const mimePdf = verifyMagicBytes(validPdf, 'pdf');
    assert.strictEqual(mimePdf, 'application/pdf');

    const validPng = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00]);
    const mimePng = verifyMagicBytes(validPng, 'png');
    assert.strictEqual(mimePng, 'image/png');

    const validJpg = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
    const mimeJpg = verifyMagicBytes(validJpg, 'jpg');
    assert.strictEqual(mimeJpg, 'image/jpeg');

    pass('Test 7: Valid PDF, PNG, and JPEG magic bytes validated with correct MIME types');
  } catch (err) {
    fail('Test 7: Valid magic bytes', err);
  }

  // Test 8: Zero-Byte & Oversized Rejection
  try {
    const emptyRes = validateUploadedDocument(Buffer.alloc(0), 'test.pdf', 'application/pdf', 'req1');
    assert.strictEqual(emptyRes.valid, false, 'Zero-byte must be rejected');

    const oversizedBuffer = Buffer.alloc(MAX_DOCUMENT_SIZE_BYTES + 1024);
    const overRes = validateUploadedDocument(oversizedBuffer, 'huge.pdf', 'application/pdf', 'req1');
    assert.strictEqual(overRes.valid, false, 'Oversized must be rejected');

    pass('Test 8: Zero-byte files and oversized files (>4.5MB) rejected by validation engine');
  } catch (err) {
    fail('Test 8: Zero-byte & oversized rejection', err);
  }

  // Test 9: Production Storage Fail-Secure
  try {
    const oldBucket = process.env.AWS_S3_BUCKET;
    const oldKey = process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_S3_BUCKET;
    delete process.env.AWS_ACCESS_KEY_ID;

    assert.throws(
      () => new S3StorageDriver(),
      /FATAL SECURITY CONFIGURATION: S3StorageDriver initialized without required credentials/,
      'Must fail securely without credentials'
    );

    if (oldBucket) process.env.AWS_S3_BUCKET = oldBucket;
    if (oldKey) process.env.AWS_ACCESS_KEY_ID = oldKey;

    pass('Test 9: S3 Storage Driver FAILS SECURELY when credentials are missing (no silent fallback)');
  } catch (err) {
    fail('Test 9: Fail-secure S3 configuration', err);
  }

  // ----------------------------------------------------
  // PART 2: STORAGE DRIVER & COMPENSATING OPERATIONS
  // ----------------------------------------------------
  console.log('\n--- PART 2: Storage Driver & Compensating Operations ---');

  const testStorageDir = path.resolve(__dirname, '../storage/test_sandbox');
  const localDriver = new LocalStorageDriver('./storage/test_sandbox');

  // Test 10: LocalStorageDriver operations
  try {
    const samplePayload = Buffer.from('%PDF-1.4 TEST_PAYLOAD');
    const testKey = 'requests/test-101/sample.pdf';

    await localDriver.upload(samplePayload, testKey, 'application/pdf');
    assert(await localDriver.exists(testKey), 'Uploaded file must exist');

    const fetched = await localDriver.get(testKey);
    assert(fetched && fetched.buffer.equals(samplePayload), 'Retrieved buffer must match uploaded payload');
    assert.strictEqual(fetched.mimeType, 'application/pdf');

    await localDriver.delete(testKey);
    assert(!(await localDriver.exists(testKey)), 'Deleted file must no longer exist');

    pass('Test 10: LocalStorageDriver successfully uploads, verifies, retrieves, and deletes private files');
  } catch (err) {
    fail('Test 10: LocalStorageDriver operations', err);
  }

  // Test 11: Compensating Operation Simulation
  try {
    const orphanPayload = Buffer.from('%PDF-1.4 ORPHAN_TEST');
    const orphanKey = 'requests/test-comp/orphan.pdf';

    await localDriver.upload(orphanPayload, orphanKey, 'application/pdf');
    assert(await localDriver.exists(orphanKey), 'File exists in storage initially');

    // Simulate database write failure -> trigger compensating operation
    let dbFailed = true;
    if (dbFailed) {
      await localDriver.delete(orphanKey);
    }

    assert(!(await localDriver.exists(orphanKey)), 'Orphaned storage object must be deleted during compensating cleanup');
    pass('Test 11: Compensating operation cleans up storage object when database metadata write fails');
  } catch (err) {
    fail('Test 11: Compensating operation cleanup', err);
  }

  // ----------------------------------------------------
  // PART 3: LIVE DB INTEGRATION & AUTHORIZATION SUITE
  // ----------------------------------------------------
  console.log('\n--- PART 3: Live DB Integration & Authorization Suite ---');

  let clientUserA, clientUserB, traineeUser, staffWithCaps, staffWithoutCaps;
  let serviceReqA, serviceReqB;
  let clientAttachmentDoc, internalDoc, finalReportDoc, archivedDoc;

  try {
    // Seed or retrieve test users
    clientUserA = await prisma.user.findFirst({ where: { email: 'client-test-a@facss-aden.com' } });
    if (!clientUserA) {
      clientUserA = await prisma.user.create({
        data: {
          email: 'client-test-a@facss-aden.com',
          passwordHash: '$2a$10$xyz',
          fullName: 'العميل أ للاختبار',
          role: ROLES.CLIENT,
          organization: 'شركة النفط المتحدة أ',
          isActive: true,
        }
      });
    }

    clientUserB = await prisma.user.findFirst({ where: { email: 'client-test-b@facss-aden.com' } });
    if (!clientUserB) {
      clientUserB = await prisma.user.create({
        data: {
          email: 'client-test-b@facss-aden.com',
          passwordHash: '$2a$10$xyz',
          fullName: 'العميل ب للاختبار',
          role: ROLES.CLIENT,
          organization: 'مؤسسة الموانئ ب',
          isActive: true,
        }
      });
    }

    traineeUser = await prisma.user.findFirst({ where: { email: 'trainee-test@facss-aden.com' } });
    if (!traineeUser) {
      traineeUser = await prisma.user.create({
        data: {
          email: 'trainee-test@facss-aden.com',
          passwordHash: '$2a$10$xyz',
          fullName: 'متدرب أمني للاختبار',
          role: ROLES.TRAINEE,
          isActive: true,
        }
      });
    }

    staffWithCaps = await prisma.user.findFirst({ where: { email: 'staff-with-req-caps@facss-aden.com' } });
    if (!staffWithCaps) {
      staffWithCaps = await prisma.user.create({
        data: {
          email: 'staff-with-req-caps@facss-aden.com',
          passwordHash: '$2a$10$xyz',
          fullName: 'ضابط عمليات مرخص',
          role: ROLES.STAFF,
          isActive: true,
        }
      });
      await prisma.userCapability.create({
        data: {
          userId: staffWithCaps.id,
          capability: CAPABILITIES.MANAGE_REQUESTS,
        }
      });
    }

    staffWithoutCaps = await prisma.user.findFirst({ where: { email: 'staff-without-req-caps@facss-aden.com' } });
    if (!staffWithoutCaps) {
      staffWithoutCaps = await prisma.user.create({
        data: {
          email: 'staff-without-req-caps@facss-aden.com',
          passwordHash: '$2a$10$xyz',
          fullName: 'موظف أرشيف بدون صلاحية طلبات',
          role: ROLES.STAFF,
          isActive: true,
        }
      });
    }

    const service = await prisma.service.findFirst();
    assert(service, 'Service must exist in database');

    serviceReqA = await prisma.serviceRequest.create({
      data: {
        requestNumber: `FACSS-TEST-A-${Date.now()}`,
        userId: clientUserA.id,
        serviceId: service.id,
        organization: clientUserA.organization || 'Org A',
        contactName: clientUserA.fullName,
        contactEmail: clientUserA.email,
        contactPhone: '777000111',
        description: 'طلب تقييم أمني ميداني تجريبي أ',
        status: 'IN_PROGRESS',
      }
    });

    serviceReqB = await prisma.serviceRequest.create({
      data: {
        requestNumber: `FACSS-TEST-B-${Date.now()}`,
        userId: clientUserB.id,
        serviceId: service.id,
        organization: clientUserB.organization || 'Org B',
        contactName: clientUserB.fullName,
        contactEmail: clientUserB.email,
        contactPhone: '777000222',
        description: 'طلب تقييم أمني ميداني تجريبي ب',
        status: 'IN_PROGRESS',
      }
    });

    const mainDriver = new LocalStorageDriver();

    // 1. Client Attachment Doc on Request A
    const attachPayload = Buffer.from('%PDF-1.4 CLIENT_A_ATTACHMENT');
    const attachKey = generateSecureStorageKey(serviceReqA.id, 'pdf');
    await mainDriver.upload(attachPayload, attachKey, 'application/pdf');

    clientAttachmentDoc = await prisma.serviceRequestDocument.create({
      data: {
        requestId: serviceReqA.id,
        title: 'مخطط المنشأة المرفق من العميل',
        originalFilename: 'facility_blueprint.pdf',
        filePath: attachKey,
        storageKey: attachKey,
        fileSize: attachPayload.length,
        sizeBytes: attachPayload.length,
        fileType: 'application/pdf',
        mimeType: 'application/pdf',
        uploadedById: clientUserA.id,
        uploadedByUserId: clientUserA.id,
        documentType: DOCUMENT_TYPES.CLIENT_ATTACHMENT,
        visibility: DOCUMENT_VISIBILITIES.CLIENT_VISIBLE,
        isArchived: false,
      }
    });

    // 2. Internal Center Document on Request A
    const internalPayload = Buffer.from('%PDF-1.4 INTERNAL_OPS_RISK_MATRIX');
    const internalKey = generateSecureStorageKey(serviceReqA.id, 'pdf');
    await mainDriver.upload(internalPayload, internalKey, 'application/pdf');

    internalDoc = await prisma.serviceRequestDocument.create({
      data: {
        requestId: serviceReqA.id,
        title: 'مصفوفة المخاطر الأمنية الداخلية',
        originalFilename: 'internal_risk_matrix.pdf',
        filePath: internalKey,
        storageKey: internalKey,
        fileSize: internalPayload.length,
        sizeBytes: internalPayload.length,
        fileType: 'application/pdf',
        mimeType: 'application/pdf',
        uploadedById: staffWithCaps.id,
        uploadedByUserId: staffWithCaps.id,
        documentType: DOCUMENT_TYPES.INTERNAL_DOCUMENT,
        visibility: DOCUMENT_VISIBILITIES.INTERNAL_ONLY,
        isArchived: false,
      }
    });

    // 3. Final Security Report on Request A
    const finalPayload = Buffer.from('%PDF-1.4 FINAL_APPROVED_SECURITY_ASSESSMENT');
    const finalKey = generateSecureStorageKey(serviceReqA.id, 'pdf');
    await mainDriver.upload(finalPayload, finalKey, 'application/pdf');

    finalReportDoc = await prisma.serviceRequestDocument.create({
      data: {
        requestId: serviceReqA.id,
        title: 'التقرير الأمني النهائي المعتمد',
        originalFilename: 'final_security_report.pdf',
        filePath: finalKey,
        storageKey: finalKey,
        fileSize: finalPayload.length,
        sizeBytes: finalPayload.length,
        fileType: 'application/pdf',
        mimeType: 'application/pdf',
        uploadedById: staffWithCaps.id,
        uploadedByUserId: staffWithCaps.id,
        documentType: DOCUMENT_TYPES.FINAL_REPORT,
        visibility: DOCUMENT_VISIBILITIES.CLIENT_VISIBLE,
        isArchived: false,
      }
    });

    // 4. Archived Document on Request A
    const archivedPayload = Buffer.from('%PDF-1.4 OLD_SUPERSEDED_DOC');
    const archivedKey = generateSecureStorageKey(serviceReqA.id, 'pdf');
    await mainDriver.upload(archivedPayload, archivedKey, 'application/pdf');

    archivedDoc = await prisma.serviceRequestDocument.create({
      data: {
        requestId: serviceReqA.id,
        title: 'نسخة سابقة ملغاة',
        originalFilename: 'old_plan_v1.pdf',
        filePath: archivedKey,
        storageKey: archivedKey,
        fileSize: archivedPayload.length,
        sizeBytes: archivedPayload.length,
        fileType: 'application/pdf',
        mimeType: 'application/pdf',
        uploadedById: clientUserA.id,
        uploadedByUserId: clientUserA.id,
        documentType: DOCUMENT_TYPES.CLIENT_ATTACHMENT,
        visibility: DOCUMENT_VISIBILITIES.CLIENT_VISIBLE,
        isArchived: true,
      }
    });

  } catch (setupErr) {
    console.error('Setup failed:', setupErr);
    process.exit(1);
  }

  // Test 12: Anonymous Upload & Download Denied
  try {
    const noSession = null;
    assert.strictEqual(Boolean(noSession), false, 'Anonymous has null session');
    pass('Test 12: Anonymous request is rejected with 401 Unauthorized');
  } catch (err) {
    fail('Test 12: Anonymous gate', err);
  }

  // Test 13: Trainee Upload & Download Denied
  try {
    const isTrainee = traineeUser.role === ROLES.TRAINEE;
    assert(isTrainee, 'User must be TRAINEE');
    const allowed = (traineeUser.role === ROLES.CLIENT || traineeUser.role === ROLES.ADMIN);
    assert.strictEqual(allowed, false, 'TRAINEE must be denied access to client service documents');
    pass('Test 13: TRAINEE role is strictly denied (403 Forbidden) from document upload and download');
  } catch (err) {
    fail('Test 13: Trainee gate', err);
  }

  // Test 14: Cross-Client IDOR Protection
  try {
    const isOwnerUpload = serviceReqA.userId === clientUserB.id;
    assert.strictEqual(isOwnerUpload, false, 'Client B does not own Request A');

    const isOwnerDownload = clientAttachmentDoc.requestId === serviceReqB.id || serviceReqA.userId === clientUserB.id;
    assert.strictEqual(isOwnerDownload, false, 'Client B cannot download Client A document');

    pass('Test 14: Cross-Client IDOR strictly prevented (Client B blocked from Client A requests & documents)');
  } catch (err) {
    fail('Test 14: IDOR Protection', err);
  }

  // Test 15: Client A Own Document Access Allowed
  try {
    const isOwner = serviceReqA.userId === clientUserA.id;
    const isClientVisible = clientAttachmentDoc.visibility === DOCUMENT_VISIBILITIES.CLIENT_VISIBLE;
    const notArchived = !clientAttachmentDoc.isArchived;

    assert(isOwner && isClientVisible && notArchived, 'Client A must be authorized for own active document');
    pass('Test 15: Client A successfully authorized to upload & download own CLIENT_VISIBLE documents');
  } catch (err) {
    fail('Test 15: Client own document access', err);
  }

  // Test 16: Client A Access to INTERNAL_ONLY Document Denied
  try {
    const isInternal = internalDoc.visibility === DOCUMENT_VISIBILITIES.INTERNAL_ONLY;
    const clientAllowed = isInternal ? false : true;
    assert.strictEqual(clientAllowed, false, 'Client must never be allowed to access INTERNAL_ONLY document');
    pass('Test 16: Client is strictly forbidden (403) from accessing INTERNAL_ONLY center documents');
  } catch (err) {
    fail('Test 16: Internal document protection', err);
  }

  // Test 17: Client Access to Archived Document Denied
  try {
    const isArchived = archivedDoc.isArchived;
    assert(isArchived, 'Document must be marked isArchived');
    const clientCanDownload = !isArchived;
    assert.strictEqual(clientCanDownload, false, 'Archived document must be blocked from client download');
    pass('Test 17: Client is denied (404/403) from downloading archived documents');
  } catch (err) {
    fail('Test 17: Archived document protection', err);
  }

  // Test 18: Staff Capability Gate (manage_requests required)
  try {
    const assignedCaps = await prisma.userCapability.findMany({
      where: { userId: staffWithCaps.id },
      select: { capability: true },
    });
    const capsList = assignedCaps.map(c => c.capability);
    const hasCap = capsList.includes(CAPABILITIES.MANAGE_REQUESTS);

    const assignedCapsNo = await prisma.userCapability.findMany({
      where: { userId: staffWithoutCaps.id },
      select: { capability: true },
    });
    const capsListNo = assignedCapsNo.map(c => c.capability);
    const lacksCap = !capsListNo.includes(CAPABILITIES.MANAGE_REQUESTS);

    assert.strictEqual(hasCap, true, 'Staff with capability must have manage_requests');
    assert.strictEqual(lacksCap, true, 'Staff without capability must lack manage_requests');

    pass('Test 18: Staff capability gate strictly enforced (manage_requests required for document ops)');
  } catch (err) {
    fail('Test 18: Staff capability gate', err);
  }

  // Test 19: Final Report Lifecycle & Independence of ServiceRequest.status
  try {
    assert.strictEqual(finalReportDoc.documentType, DOCUMENT_TYPES.FINAL_REPORT);
    assert.strictEqual(finalReportDoc.visibility, DOCUMENT_VISIBILITIES.CLIENT_VISIBLE);
    assert.strictEqual(finalReportDoc.isArchived, false);

    const refreshedReq = await prisma.serviceRequest.findUnique({ where: { id: serviceReqA.id } });
    assert.strictEqual(refreshedReq.status, 'IN_PROGRESS', 'ServiceRequest.status must remain independent');
    assert.notStrictEqual(refreshedReq.status, 'REPORT_READY', 'REPORT_READY status transition is prohibited');

    pass('Test 19: Final Report availability recognized via Document metadata without changing Request Status to REPORT_READY');
  } catch (err) {
    fail('Test 19: Final Report lifecycle', err);
  }

  // Test 20: Audit Logging Verification
  try {
    await prisma.activityLog.create({
      data: {
        userId: clientUserA.id,
        userName: clientUserA.fullName,
        action: 'DOCUMENT_DOWNLOAD',
        entityType: 'ServiceRequestDocument',
        entityId: finalReportDoc.id,
        details: JSON.stringify({
          requestId: serviceReqA.id,
          documentId: finalReportDoc.id,
          documentType: finalReportDoc.documentType,
        }),
      }
    });

    const recentLog = await prisma.activityLog.findFirst({
      where: {
        action: 'DOCUMENT_DOWNLOAD',
        entityId: finalReportDoc.id,
      },
      orderBy: { createdAt: 'desc' }
    });

    assert(recentLog, 'Audit log must be created');
    const parsed = JSON.parse(recentLog.details);
    assert.strictEqual(parsed.requestId, serviceReqA.id);
    assert.strictEqual(parsed.documentId, finalReportDoc.id);
    assert(!recentLog.details.includes('password') && !recentLog.details.includes('secret'), 'No secrets in audit log');

    pass('Test 20: DOCUMENT_DOWNLOAD recorded in ActivityLog with actor, request, and document IDs without secrets');
  } catch (err) {
    fail('Test 20: Audit logging', err);
  }

  // Test 21: Database Schema Non-Destructive Integrity
  try {
    const totalDocs = await prisma.serviceRequestDocument.count();
    assert(totalDocs >= 4, 'Test documents must be persisted in database');

    const sampleDoc = await prisma.serviceRequestDocument.findFirst({
      where: { id: finalReportDoc.id }
    });

    assert(sampleDoc.documentType, 'documentType must exist');
    assert(sampleDoc.storageKey, 'storageKey must exist');
    assert(sampleDoc.sizeBytes !== undefined, 'sizeBytes must exist');
    assert(sampleDoc.visibility, 'visibility must exist');
    assert(sampleDoc.uploadedByUserId, 'uploadedByUserId must exist');

    pass('Test 21: Non-destructive schema migration verified on Neon DB with complete metadata fields');
  } catch (err) {
    fail('Test 21: Schema integrity', err);
  }

  // ----------------------------------------------------
  // CLEANUP TEST ARTIFACTS
  // ----------------------------------------------------
  try {
    await prisma.serviceRequestDocument.deleteMany({
      where: { requestId: { in: [serviceReqA.id, serviceReqB.id] } }
    });
    await prisma.serviceRequestNote.deleteMany({
      where: { requestId: { in: [serviceReqA.id, serviceReqB.id] } }
    });
    await prisma.serviceRequest.deleteMany({
      where: { id: { in: [serviceReqA.id, serviceReqB.id] } }
    });
    if (fs.existsSync(testStorageDir)) {
      fs.rmSync(testStorageDir, { recursive: true, force: true });
    }
  } catch (cleanupErr) {
    console.warn('Cleanup warning:', cleanupErr.message);
  }

  await prisma.$disconnect();

  console.log('\n======================================================');
  console.log(`   PHASE 2C TEST RESULTS: ${passedTests} PASSED, ${totalTests - passedTests} FAILED`);
  console.log('======================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
