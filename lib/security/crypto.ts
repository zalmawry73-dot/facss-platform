import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12; // Standard 96-bit IV for AES-GCM
const AUTH_TAG_LENGTH_BYTES = 16; // Standard 128-bit authentication tag
const CIPHER_VERSION = 'v1';

/**
 * Derives or retrieves the 256-bit (32 bytes) encryption key.
 * Strictly checks process.env.FIELD_INCIDENT_ENCRYPTION_KEY.
 * In production: fails immediately if missing or invalid.
 * In development/test: falls back to a deterministic synthetic test key with an explicit security notice.
 */
export function getEncryptionKey(): Buffer {
  const envKey = process.env.FIELD_INCIDENT_ENCRYPTION_KEY;

  if (envKey && envKey.trim().length >= 32) {
    // If hex string (64 characters)
    if (/^[0-9a-fA-F]{64}$/.test(envKey.trim())) {
      return Buffer.from(envKey.trim(), 'hex');
    }
    // If raw 32+ character string, derive 32-byte key via SHA-256
    return crypto.createHash('sha256').update(envKey.trim()).digest();
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'FATAL SECURITY CONFIGURATION: FIELD_INCIDENT_ENCRYPTION_KEY is missing or invalid in production. ' +
      'Refusing to operate with plaintext or synthetic keys.'
    );
  }

  // Synthetic local dev/test fallback key (Never used in production)
  const syntheticDevSecret = 'FACSS_SYNTHETIC_LOCAL_TEST_INCIDENT_KEY_32BYTES_LEN_2026';
  return crypto.createHash('sha256').update(syntheticDevSecret).digest();
}

/**
 * Encrypts a plaintext string or number using AES-256-GCM.
 * Output format: enc:v1:<base64-iv>:<base64-tag>:<base64-ciphertext>
 */
export function encryptField(
  plaintext: string | number | null | undefined,
  customKey?: Buffer
): string | null {
  if (plaintext === null || plaintext === undefined || plaintext === '') {
    return null;
  }

  const key = customKey || getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const plainString = String(plaintext);
  const encrypted = Buffer.concat([cipher.update(plainString, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `enc:${CIPHER_VERSION}:${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

/**
 * Decrypts an AES-256-GCM encrypted field.
 * Validates integrity via GCM authentication tag.
 * Rejects tampered ciphertexts, corrupted payloads, or invalid keys.
 */
export function decryptField(
  ciphertext: string | null | undefined,
  customKey?: Buffer
): string | null {
  if (!ciphertext || typeof ciphertext !== 'string') {
    return null;
  }

  if (!ciphertext.startsWith(`enc:${CIPHER_VERSION}:`)) {
    // If it is an unencrypted legacy string or null
    return ciphertext;
  }

  const parts = ciphertext.split(':');
  if (parts.length !== 5) {
    throw new Error('SECURITY VIOLATION: Malformed encrypted field format.');
  }

  const [, version, ivBase64, tagBase64, encryptedBase64] = parts;

  if (version !== CIPHER_VERSION) {
    throw new Error(`SECURITY VIOLATION: Unsupported cipher version [${version}].`);
  }

  const key = customKey || getEncryptionKey();
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(tagBase64, 'base64');
  const encrypted = Buffer.from(encryptedBase64, 'base64');

  if (iv.length !== IV_LENGTH_BYTES || authTag.length !== AUTH_TAG_LENGTH_BYTES) {
    throw new Error('SECURITY VIOLATION: Invalid IV or AuthTag length in payload.');
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err: any) {
    throw new Error('SECURITY INTEGRITY FAILURE: Decryption failed (Tampered data or wrong encryption key).');
  }
}

/**
 * Decrypts float/number fields (e.g. coordinates).
 */
export function decryptFloatField(
  ciphertext: string | null | undefined,
  customKey?: Buffer
): number | null {
  const decrypted = decryptField(ciphertext, customKey);
  if (decrypted === null || decrypted === undefined || decrypted === '') {
    return null;
  }
  const parsed = parseFloat(decrypted);
  return isNaN(parsed) ? null : parsed;
}

export interface RawIncidentOriginalData {
  sourceType: string;
  sourceName?: string | null;
  sourceContactPhone?: string | null;
  sourceOrganization?: string | null;
  rawDescription: string;
  exactLocationDesc?: string | null;
  exactLatitude?: number | null;
  exactLongitude?: number | null;
  initialRiskNotes?: string | null;
}

export interface EncryptedIncidentOriginalData {
  sourceType: string;
  sourceNameEnc: string;
  sourcePhoneEnc: string | null;
  sourceOrgEnc: string | null;
  rawDescriptionEnc: string;
  exactLocationEnc: string | null;
  exactLatEnc: string | null;
  exactLngEnc: string | null;
  initialRiskNotesEnc: string | null;
}

/**
 * Encrypts all sensitive fields of an IncidentOriginal record.
 * Covers raw description, exact coordinates, source name, phone, and risk notes.
 */
export function encryptIncidentOriginalPayload(
  raw: RawIncidentOriginalData,
  customKey?: Buffer
): EncryptedIncidentOriginalData {
  return {
    sourceType: raw.sourceType,
    sourceNameEnc: encryptField(raw.sourceName || '', customKey)!,
    sourcePhoneEnc: encryptField(raw.sourceContactPhone, customKey),
    sourceOrgEnc: encryptField(raw.sourceOrganization, customKey),
    rawDescriptionEnc: encryptField(raw.rawDescription, customKey)!,
    exactLocationEnc: encryptField(raw.exactLocationDesc, customKey),
    exactLatEnc: encryptField(raw.exactLatitude, customKey),
    exactLngEnc: encryptField(raw.exactLongitude, customKey),
    initialRiskNotesEnc: encryptField(raw.initialRiskNotes, customKey),
  };
}

/**
 * Decrypts an EncryptedIncidentOriginalData record back to plain in-memory object.
 * Exclusively called by SUPER_ADMIN server gate.
 */
export function decryptIncidentOriginalPayload(
  encrypted: {
    sourceType: string;
    sourceNameEnc: string;
    sourcePhoneEnc?: string | null;
    sourceOrgEnc?: string | null;
    rawDescriptionEnc: string;
    exactLocationEnc?: string | null;
    exactLatEnc?: string | null;
    exactLngEnc?: string | null;
    initialRiskNotesEnc?: string | null;
  },
  customKey?: Buffer
): RawIncidentOriginalData {
  return {
    sourceType: encrypted.sourceType,
    sourceName: decryptField(encrypted.sourceNameEnc, customKey) || '',
    sourceContactPhone: decryptField(encrypted.sourcePhoneEnc, customKey),
    sourceOrganization: decryptField(encrypted.sourceOrgEnc, customKey),
    rawDescription: decryptField(encrypted.rawDescriptionEnc, customKey) || '',
    exactLocationDesc: decryptField(encrypted.exactLocationEnc, customKey),
    exactLatitude: decryptFloatField(encrypted.exactLatEnc, customKey),
    exactLongitude: decryptFloatField(encrypted.exactLngEnc, customKey),
    initialRiskNotes: decryptField(encrypted.initialRiskNotesEnc, customKey),
  };
}
