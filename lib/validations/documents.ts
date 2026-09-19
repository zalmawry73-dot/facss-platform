import crypto from 'crypto';

export const MAX_DOCUMENT_SIZE_BYTES = 4.5 * 1024 * 1024; // 4.5 MB (Vercel & serverless route limit)
export const MIN_DOCUMENT_SIZE_BYTES = 1;

export const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg'] as const;
export type AllowedExtension = typeof ALLOWED_EXTENSIONS[number];

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
] as const;

export const DOCUMENT_TYPES = {
  CLIENT_ATTACHMENT: 'CLIENT_ATTACHMENT',
  INTERNAL_DOCUMENT: 'INTERNAL_DOCUMENT',
  FINAL_REPORT: 'FINAL_REPORT',
} as const;

export type DocumentType = typeof DOCUMENT_TYPES[keyof typeof DOCUMENT_TYPES];

export const DOCUMENT_VISIBILITIES = {
  CLIENT_VISIBLE: 'CLIENT_VISIBLE',
  INTERNAL_ONLY: 'INTERNAL_ONLY',
} as const;

export type DocumentVisibility = typeof DOCUMENT_VISIBILITIES[keyof typeof DOCUMENT_VISIBILITIES];

/**
 * Validates binary buffer against strict magic-byte signatures.
 * Returns verified MIME type or throws validation error.
 */
export function verifyMagicBytes(buffer: Buffer, claimedExtension: string): string {
  if (buffer.length < 4) {
    throw new Error('File payload too small or corrupted (failed header inspection).');
  }

  // Check for dangerous formats regardless of claimed extension
  // 1. Executables / Windows binaries (MZ)
  if (buffer[0] === 0x4D && buffer[1] === 0x5A) {
    throw new Error('Executable binaries (MZ/PE) are strictly prohibited.');
  }

  // 2. ELF Linux binaries (0x7F, 'E', 'L', 'F')
  if (buffer[0] === 0x7F && buffer[1] === 0x45 && buffer[2] === 0x4C && buffer[3] === 0x46) {
    throw new Error('Executable Linux binaries (ELF) are strictly prohibited.');
  }

  // 3. Script / Shebang (#! / 0x23, 0x21)
  if (buffer[0] === 0x23 && buffer[1] === 0x21) {
    throw new Error('Shell and executable scripts are strictly prohibited.');
  }

  // 4. ZIP / JAR / DOCX archives (PK\x03\x04)
  if (buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04) {
    throw new Error('ZIP and archive packages (including DOCX) are currently prohibited.');
  }

  // 5. HTML / XML / SVG inspection (prevent stored XSS)
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

  // Strict match against claimed extension
  const ext = claimedExtension.toLowerCase().replace(/^\./, '');

  if (ext === 'pdf') {
    // PDF Magic Bytes: %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
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
    // PNG Magic Bytes: \x89PNG\r\n\x1a\n (0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)
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
    // JPEG Magic Bytes: \xFF\xD8\xFF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return 'image/jpeg';
    }
    throw new Error('Invalid file signature: Content does not match valid JPEG specification.');
  }

  throw new Error(`Unsupported extension [.${ext}]. Allowed formats: PDF, PNG, JPG, JPEG.`);
}

/**
 * Sanitizes original filename to prevent Header Injection (CRLF) and directory traversal.
 */
export function sanitizeOriginalFilename(rawName: string, fallbackExt: string): string {
  if (!rawName || typeof rawName !== 'string') {
    return `document_${Date.now()}.${fallbackExt}`;
  }

  // 1. Strip CRLF, null bytes, double quotes, path separators
  let clean = rawName
    .replace(/[\r\n\0]/g, '')
    .replace(/[/\\]/g, '_')
    .replace(/[":*?<>|]/g, '')
    .trim();

  // 2. Neutralize all multi-dot sequences (prevent path traversal ..)
  clean = clean.replace(/\.{2,}/g, '').replace(/^\.+/, '');

  if (!clean || clean.length === 0) {
    return `document_${Date.now()}.${fallbackExt}`;
  }

  // 3. Truncate long filenames to 100 chars while preserving extension
  if (clean.length > 100) {
    const ext = clean.split('.').pop() || fallbackExt;
    clean = `${clean.slice(0, 90)}.${ext}`;
  }

  return clean;
}

/**
 * Generates an unpredictable, non-user-controlled storage key.
 */
export function generateSecureStorageKey(requestId: string, extension: string): string {
  const safeReqId = requestId.replace(/[^a-zA-Z0-9]/g, '');
  const randomUuid = crypto.randomUUID();
  const timestamp = Date.now();
  const cleanExt = extension.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `requests/${safeReqId}/${timestamp}-${randomUuid}.${cleanExt}`;
}

export interface DocumentValidationResult {
  valid: boolean;
  error?: string;
  sanitizedFilename?: string;
  verifiedMimeType?: string;
  storageKey?: string;
  extension?: string;
}

/**
 * Full file validation pipeline.
 */
export function validateUploadedDocument(
  buffer: Buffer,
  rawFilename: string,
  declaredMimeType: string,
  requestId: string
): DocumentValidationResult {
  // 1. Size bounds
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'الملف المرفق فارغ (Zero-byte file).' };
  }

  if (buffer.length > MAX_DOCUMENT_SIZE_BYTES) {
    return {
      valid: false,
      error: `حجم الملف يتجاوز الحد الأقصى المسموح به (${(MAX_DOCUMENT_SIZE_BYTES / (1024 * 1024)).toFixed(1)} ميجابايت).`,
    };
  }

  // 2. Extract and validate extension
  const parts = rawFilename.split('.');
  if (parts.length < 2) {
    return { valid: false, error: 'اسم الملف لا يحتوي على امتداد صالح.' };
  }
  const extension = parts.pop()!.toLowerCase().trim();

  if (!ALLOWED_EXTENSIONS.includes(extension as AllowedExtension)) {
    return {
      valid: false,
      error: `صيغة الملف غير مسموح بها (.${extension}). الصيغ المسموحة حصراً: PDF, PNG, JPG.`,
    };
  }

  // 3. Magic bytes verification & MIME reconciliation
  let verifiedMime: string;
  try {
    verifiedMime = verifyMagicBytes(buffer, extension);
  } catch (err: any) {
    return { valid: false, error: err.message };
  }

  // 4. Sanitize original filename
  const sanitizedFilename = sanitizeOriginalFilename(rawFilename, extension);

  // 5. Generate safe opaque storage key
  const storageKey = generateSecureStorageKey(requestId, extension);

  return {
    valid: true,
    sanitizedFilename,
    verifiedMimeType: verifiedMime,
    storageKey,
    extension,
  };
}
