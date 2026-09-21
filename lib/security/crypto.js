const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12; // Standard 96-bit IV for AES-GCM
const AUTH_TAG_LENGTH_BYTES = 16; // Standard 128-bit authentication tag
const CIPHER_VERSION = 'v1';

function getEncryptionKey() {
  const envKey = process.env.FIELD_INCIDENT_ENCRYPTION_KEY;

  if (envKey && envKey.trim().length >= 32) {
    if (/^[0-9a-fA-F]{64}$/.test(envKey.trim())) {
      return Buffer.from(envKey.trim(), 'hex');
    }
    return crypto.createHash('sha256').update(envKey.trim()).digest();
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'FATAL SECURITY CONFIGURATION: FIELD_INCIDENT_ENCRYPTION_KEY is missing or invalid in production. ' +
      'Refusing to operate with plaintext or synthetic keys.'
    );
  }

  const syntheticDevSecret = 'FACSS_SYNTHETIC_LOCAL_TEST_INCIDENT_KEY_32BYTES_LEN_2026';
  return crypto.createHash('sha256').update(syntheticDevSecret).digest();
}

function encryptField(plaintext, customKey) {
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

function decryptField(ciphertext, customKey) {
  if (!ciphertext || typeof ciphertext !== 'string') {
    return null;
  }

  if (!ciphertext.startsWith(`enc:${CIPHER_VERSION}:`)) {
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
  } catch (err) {
    throw new Error('SECURITY INTEGRITY FAILURE: Decryption failed (Tampered data or wrong encryption key).');
  }
}

function decryptFloatField(ciphertext, customKey) {
  const decrypted = decryptField(ciphertext, customKey);
  if (decrypted === null || decrypted === undefined || decrypted === '') {
    return null;
  }
  const parsed = parseFloat(decrypted);
  return isNaN(parsed) ? null : parsed;
}

function encryptIncidentOriginalPayload(raw, customKey) {
  return {
    sourceType: raw.sourceType,
    sourceNameEnc: encryptField(raw.sourceName, customKey),
    sourcePhoneEnc: encryptField(raw.sourceContactPhone, customKey),
    sourceOrgEnc: encryptField(raw.sourceOrganization, customKey),
    rawDescriptionEnc: encryptField(raw.rawDescription, customKey),
    exactLocationEnc: encryptField(raw.exactLocationDesc, customKey),
    exactLatEnc: encryptField(raw.exactLatitude, customKey),
    exactLngEnc: encryptField(raw.exactLongitude, customKey),
    initialRiskNotesEnc: encryptField(raw.initialRiskNotes, customKey),
  };
}

function decryptIncidentOriginalPayload(encrypted, customKey) {
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

module.exports = {
  ALGORITHM,
  IV_LENGTH_BYTES,
  AUTH_TAG_LENGTH_BYTES,
  CIPHER_VERSION,
  getEncryptionKey,
  encryptField,
  decryptField,
  decryptFloatField,
  encryptIncidentOriginalPayload,
  decryptIncidentOriginalPayload,
};
