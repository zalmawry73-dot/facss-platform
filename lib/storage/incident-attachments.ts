import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getStorageDriver } from './index';

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
const FORBIDDEN_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.js', '.mjs', '.cjs',
  '.ts', '.html', '.htm', '.svg', '.php', '.asp', '.aspx', '.jar', '.py',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB limit

function getIncidentStorageDir(): string {
  const root = process.env.STORAGE_PATH || './storage';
  const targetDir = path.resolve(process.cwd(), root, 'private/incidents/attachments');
  if (!fsSync.existsSync(targetDir)) {
    fsSync.mkdirSync(targetDir, { recursive: true });
  }
  return targetDir;
}

/**
 * Validates file buffer against magic bytes signature.
 */
export function validateMagicBytes(buffer: Buffer, extension: string): boolean {
  if (buffer.length < 4) return false;

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

/**
 * Validates uploaded file name, extension, size, and content signature.
 */
export function validateAttachmentFile(
  fileName: string,
  buffer: Buffer,
  mimeType: string
): { isValid: boolean; error?: string; cleanExt?: string } {
  if (!fileName || typeof fileName !== 'string') {
    return { isValid: false, error: 'اسم الملف غير صالح' };
  }

  // Size check
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

  // Verify Magic Bytes
  if (!validateMagicBytes(buffer, ext)) {
    return { isValid: false, error: `فشل التحقق من المحتوى الفعلي للملف: توقيع الملف لا يطابق الامتداد المزعوم [${ext}]` };
  }

  return { isValid: true, cleanExt: ext };
}

/**
 * Strips EXIF / GPS metadata segments from a JPEG buffer.
 * JPEG structure: SOI (0xFFD8) followed by marker segments (0xFFXX + 2 bytes length + data).
 * Strips APP1 (0xFFE1) which contains EXIF / GPS metadata.
 */
export function stripJpegExif(buffer: Buffer): Buffer {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return buffer;
  }

  const chunks: Buffer[] = [buffer.subarray(0, 2)]; // Start of Image (0xFF, 0xD8)
  let offset = 2;

  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      // Not a marker, append remaining bytes (entropy coded data)
      chunks.push(buffer.subarray(offset));
      break;
    }

    const marker = buffer[offset + 1];

    // Standalone markers without length: SOI (0xD8), EOI (0xD9), RST0-7 (0xD0-0xD7)
    if (marker === 0xd9) {
      chunks.push(buffer.subarray(offset, offset + 2)); // End of Image
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

    // 0xE1 is APP1 (EXIF / GPS / XMP). Skip it entirely!
    // 0xE2 is APP2 (ICC profile). Skip if desired or keep.
    // 0xED is APP13 (Photoshop IPTC). Skip it to remove author/location.
    if (marker === 0xe1 || marker === 0xed) {
      offset = segmentEnd;
      continue;
    }

    // If Start of Scan (0xDA), this is the last marker before entropy-coded image data
    if (marker === 0xda) {
      chunks.push(buffer.subarray(offset));
      break;
    }

    chunks.push(buffer.subarray(offset, segmentEnd));
    offset = segmentEnd;
  }

  return Buffer.concat(chunks);
}

/**
 * Strips EXIF and text metadata chunks from a PNG buffer.
 * PNG structure: 8-byte signature followed by chunks [length (4B), type (4B), data, crc (4B)].
 * Strips eXIf, tEXt, zTXt, iTXt chunks.
 */
export function stripPngMetadata(buffer: Buffer): Buffer {
  if (buffer.length < 8) return buffer;

  const signature = buffer.subarray(0, 8);
  const chunks: Buffer[] = [signature];
  let offset = 8;

  const metadataChunkTypes = new Set(['eXIf', 'tEXt', 'zTXt', 'iTXt']);

  while (offset + 8 <= buffer.length) {
    const chunkLength = buffer.readUInt32BE(offset);
    const chunkType = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    const totalChunkLength = 12 + chunkLength; // 4 (length) + 4 (type) + chunkLength + 4 (crc)

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

/**
 * Attempts to strip EXIF/GPS metadata if file is an image.
 * If file cannot be safely stripped (e.g. PDF), reports unsupported for automated safe redaction.
 */
export function stripMetadataIfSupported(
  buffer: Buffer,
  mimeType: string,
  extension: string
): { success: boolean; strippedBuffer?: Buffer; error?: string } {
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
    // For WebP, if it has an EXIF chunk, stripping without full RIFF re-packing is risky,
    // so we return an error unless explicit safe handling is available.
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

/**
 * Saves an attachment to private storage outside /public.
 * Dispatches to active StorageDriver (S3/R2 or Local).
 */
export async function saveIncidentAttachmentToDisk(
  buffer: Buffer,
  originalFileName: string
): Promise<{ storageKey: string; fileSize: number; fullPath: string }> {
  const driver = getStorageDriver();
  const ext = path.extname(originalFileName).toLowerCase() || '.bin';
  const uniqueKey = `inc_att_${crypto.randomUUID()}${ext}`;

  if (driver.getDriverName() === 'S3_COMPATIBLE_PRIVATE') {
    let mimeType = 'application/octet-stream';
    if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.webp') mimeType = 'image/webp';
    else if (ext === '.pdf') mimeType = 'application/pdf';

    const s3Key = `incidents/${uniqueKey}`;
    await driver.upload(buffer, s3Key, mimeType);
    return {
      storageKey: s3Key,
      fileSize: buffer.length,
      fullPath: s3Key,
    };
  }

  // Local filesystem
  const baseDir = getIncidentStorageDir();
  const fullPath = path.join(baseDir, uniqueKey);

  // Assert containment
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

/**
 * Retrieves an attachment buffer from private storage (S3/R2 or Local).
 */
export async function getIncidentAttachmentFromDisk(
  storageKey: string
): Promise<Buffer | null> {
  if (!storageKey || typeof storageKey !== 'string' || storageKey.includes('..')) {
    throw new Error('SECURITY VIOLATION: Invalid storage key path traversal attempt.');
  }

  const driver = getStorageDriver();
  if (driver.getDriverName() === 'S3_COMPATIBLE_PRIVATE') {
    const file = await driver.get(storageKey);
    return file ? file.buffer : null;
  }

  // Local filesystem
  if (storageKey.includes('/') || storageKey.includes('\\')) {
    throw new Error('SECURITY VIOLATION: Invalid storage key path traversal attempt.');
  }

  const baseDir = getIncidentStorageDir();
  const safePath = path.join(baseDir, path.basename(storageKey));

  // Containment check
  const relative = path.relative(baseDir, safePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('SECURITY VIOLATION: Invalid storage key path traversal attempt.');
  }

  try {
    return await fs.readFile(safePath);
  } catch (err: any) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}
