const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
const FORBIDDEN_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.js', '.mjs', '.cjs',
  '.ts', '.html', '.htm', '.svg', '.php', '.asp', '.aspx', '.jar', '.py',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB limit

function getIncidentStorageDir() {
  const root = process.env.STORAGE_PATH || './storage';
  const targetDir = path.resolve(process.cwd(), root, 'private/incidents/attachments');
  if (!fsSync.existsSync(targetDir)) {
    fsSync.mkdirSync(targetDir, { recursive: true });
  }
  return targetDir;
}

function validateMagicBytes(buffer, extension) {
  if (!buffer || buffer.length < 4) return false;

  const ext = extension.toLowerCase();

  // JPEG: FF D8 FF
  if (ext === '.jpg' || ext === '.jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (ext === '.png') {
    return (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  // WEBP: RIFF....WEBP
  if (ext === '.webp') {
    if (buffer.length < 12) return false;
    const riff = buffer.subarray(0, 4).toString('ascii');
    const webp = buffer.subarray(8, 12).toString('ascii');
    return riff === 'RIFF' && webp === 'WEBP';
  }

  // PDF: %PDF-
  if (ext === '.pdf') {
    return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  }

  return false;
}

function validateAttachmentFile(fileName, buffer, mimeType) {
  if (!fileName || typeof fileName !== 'string') {
    return { isValid: false, error: 'اسم الملف غير صالح' };
  }

  if (!buffer || buffer.length === 0) {
    return { isValid: false, error: 'الملف المرفق فارغ' };
  }

  if (buffer.length > MAX_FILE_SIZE) {
    return { isValid: false, error: `حجم الملف يتجاوز الحد الأقصى المسموح به (${MAX_FILE_SIZE / (1024 * 1024)} ميجابايت)` };
  }

  const cleanName = path.basename(fileName);
  const ext = path.extname(cleanName).toLowerCase();

  if (FORBIDDEN_EXTENSIONS.includes(ext)) {
    return { isValid: false, error: `نوع الملف [${ext}] محظور أمنياً لاحتوائه على كود قابل للتنفيذ أو مسارات غير آمنة` };
  }

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { isValid: false, error: `نوع الملف غير مدعوم. الأنواع المقبولة: ${ALLOWED_EXTENSIONS.join(', ')}` };
  }

  if (!validateMagicBytes(buffer, ext)) {
    return { isValid: false, error: `فشل التحقق من المحتوى الفعلي للملف: توقيع الملف لا يطابق الامتداد المزعوم [${ext}]` };
  }

  return { isValid: true, cleanExt: ext };
}

function stripJpegExif(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return buffer;
  }

  const chunks = [buffer.subarray(0, 2)];
  let offset = 2;

  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      chunks.push(buffer.subarray(offset));
      break;
    }

    const marker = buffer[offset + 1];

    if (marker === 0xd9) {
      chunks.push(buffer.subarray(offset, offset + 2));
      break;
    }

    if (marker === 0x00 || (marker >= 0xd0 && marker <= 0xd7)) {
      chunks.push(buffer.subarray(offset, offset + 2));
      offset += 2;
      continue;
    }

    if (offset + 4 > buffer.length) {
      chunks.push(buffer.subarray(offset));
      break;
    }

    const length = buffer.readUInt16BE(offset + 2);
    const segmentEnd = offset + 2 + length;

    if (marker === 0xe1 || marker === 0xed) {
      offset = segmentEnd;
      continue;
    }

    if (marker === 0xda) {
      chunks.push(buffer.subarray(offset));
      break;
    }

    chunks.push(buffer.subarray(offset, segmentEnd));
    offset = segmentEnd;
  }

  return Buffer.concat(chunks);
}

function stripPngMetadata(buffer) {
  if (buffer.length < 8) return buffer;

  const signature = buffer.subarray(0, 8);
  const chunks = [signature];
  let offset = 8;

  const metadataChunkTypes = new Set(['eXIf', 'tEXt', 'zTXt', 'iTXt']);

  while (offset + 8 <= buffer.length) {
    const chunkLength = buffer.readUInt32BE(offset);
    const chunkType = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    const totalChunkLength = 12 + chunkLength;

    if (offset + totalChunkLength > buffer.length) {
      chunks.push(buffer.subarray(offset));
      break;
    }

    if (metadataChunkTypes.has(chunkType)) {
      offset += totalChunkLength;
      continue;
    }

    chunks.push(buffer.subarray(offset, offset + totalChunkLength));
    offset += totalChunkLength;

    if (chunkType === 'IEND') {
      break;
    }
  }

  return Buffer.concat(chunks);
}

function stripMetadataIfSupported(buffer, mimeType, extension) {
  const ext = extension.toLowerCase();

  if (ext === '.jpg' || ext === '.jpeg') {
    const stripped = stripJpegExif(buffer);
    return { success: true, strippedBuffer: stripped };
  }

  if (ext === '.png') {
    const stripped = stripPngMetadata(buffer);
    return { success: true, strippedBuffer: stripped };
  }

  if (ext === '.webp') {
    return {
      success: false,
      error: 'تنسيق WebP يتطلب مراجعة تنقيح يدوية لضمان عدم تسريب البيانات الوصفية قبل النشر المنقح.',
    };
  }

  if (ext === '.pdf') {
    return {
      success: false,
      error: 'ملفات PDF لا يمكن تنقيح محتواها البصري وبياناتها الوصفية تلقائياً؛ يلزم الاعتماد اليدوي قبل المشاركة.',
    };
  }

  return { success: false, error: 'نوع الملف غير مدعوم للتنقيح الآلي للمحتوى.' };
}

async function saveIncidentAttachmentToDisk(buffer, originalFileName) {
  const baseDir = getIncidentStorageDir();
  const ext = path.extname(originalFileName).toLowerCase() || '.bin';
  const uniqueKey = `inc_att_${crypto.randomUUID()}${ext}`;
  const fullPath = path.join(baseDir, uniqueKey);

  const relative = path.relative(baseDir, fullPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('SECURITY VIOLATION: Path traversal detected outside incident storage root.');
  }

  await fs.writeFile(fullPath, buffer);
  return {
    storageKey: uniqueKey,
    fileSize: buffer.length,
    fullPath,
  };
}

async function getIncidentAttachmentFromDisk(storageKey) {
  if (!storageKey || typeof storageKey !== 'string' || storageKey.includes('..') || storageKey.includes('/') || storageKey.includes('\\')) {
    throw new Error('SECURITY VIOLATION: Invalid storage key path traversal attempt.');
  }

  const baseDir = getIncidentStorageDir();
  const safePath = path.join(baseDir, path.basename(storageKey));

  const relative = path.relative(baseDir, safePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('SECURITY VIOLATION: Invalid storage key path traversal attempt.');
  }

  try {
    return await fs.readFile(safePath);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

module.exports = {
  ALLOWED_EXTENSIONS,
  FORBIDDEN_EXTENSIONS,
  MAX_FILE_SIZE,
  validateMagicBytes,
  validateAttachmentFile,
  stripJpegExif,
  stripPngMetadata,
  stripMetadataIfSupported,
  saveIncidentAttachmentToDisk,
  getIncidentAttachmentFromDisk,
};
