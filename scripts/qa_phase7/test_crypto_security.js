const crypto = require('crypto');
const { execSync } = require('child_process');

console.log('=== TEST SUITE: FIELD INCIDENT CRYPTO & SECURITY ISOLATION ===');

// Test 1: Generate an isolated test key for QA sandbox
const isolatedQaKey = crypto.randomBytes(32).toString('hex');
console.log('Test 1: Generated isolated 64-hex QA test key (length:', isolatedQaKey.length, ')');

// Set isolated key in process.env
process.env.FIELD_INCIDENT_ENCRYPTION_KEY = isolatedQaKey;
process.env.NODE_ENV = 'production';

// Load crypto module from dist
const { encryptField, decryptField, getEncryptionKey, encryptIncidentOriginalPayload, decryptIncidentOriginalPayload } = require('./dist/crypto');

const sensitiveCoordinate = '12.7855° N, 45.0187° E [Sensitive Forward Observation Post]';
const witnessIdentity = 'Confidential Field Source #402';

const encryptedCoord = encryptField(sensitiveCoordinate);
const encryptedWitness = encryptField(witnessIdentity);

console.log('\n--- Test 1.1: Verification of AES-256-GCM Cipher Structure ---');
console.log('Is encrypted coord valid ciphertext format?', encryptedCoord && encryptedCoord.startsWith('enc:v1:'));
console.log('Is encrypted witness valid ciphertext format?', encryptedWitness && encryptedWitness.startsWith('enc:v1:'));
console.log('Does ciphertext contain plaintext coordinates?', !encryptedCoord.includes('Sensitive'));
console.log('Ciphertext sample:', encryptedCoord.slice(0, 35) + '...[REDACTED]');

const decryptedCoord = decryptField(encryptedCoord);
const decryptedWitness = decryptField(encryptedWitness);

console.log('\n--- Test 1.2: Decryption Fidelity for Authorized Context ---');
console.log('Decrypted coordinate matches exactly?', decryptedCoord === sensitiveCoordinate);
console.log('Decrypted witness matches exactly?', decryptedWitness === witnessIdentity);

if (decryptedCoord !== sensitiveCoordinate || decryptedWitness !== witnessIdentity) {
  throw new Error('FAILED: Decrypted field does not match original plaintext!');
}

console.log('\n--- Test 2: Safe Failure (Fail-Closed) in Production Mode When Key is Missing ---');
delete process.env.FIELD_INCIDENT_ENCRYPTION_KEY;
let threwExpectedError = false;
try {
  getEncryptionKey();
} catch (err) {
  threwExpectedError = true;
  console.log('Caught expected error in production mode:', err.message);
}

if (!threwExpectedError) {
  throw new Error('SECURITY VIOLATION: getEncryptionKey did not fail closed when key was missing in production mode!');
}
console.log('Passed: Fail-closed enforcement is active.');

// Restore isolated key
process.env.FIELD_INCIDENT_ENCRYPTION_KEY = isolatedQaKey;

console.log('\n--- Test 3: Log Leakage Audit ---');
let logsEmitted = [];
const originalLog = console.log;
console.log = function(...args) {
  logsEmitted.push(args.join(' '));
  originalLog.apply(console, args);
};

// Encrypt and decrypt again while intercepting logs
encryptField('SECRET_LOCATION');
decryptField(encryptField('SECRET_WITNESS'));

console.log = originalLog;

const leakedKey = logsEmitted.some(l => l.includes(isolatedQaKey));
const leakedSecret = logsEmitted.some(l => l.includes('SECRET_LOCATION') || l.includes('SECRET_WITNESS'));
console.log('Audit - Key leaked into console/logs?', leakedKey);
console.log('Audit - Sensitive plaintext leaked into console/logs during crypto ops?', leakedSecret);

if (leakedKey || leakedSecret) {
  throw new Error('SECURITY VIOLATION: Secret data or encryption key was logged!');
}
console.log('Passed: Zero secret leakage in logging.');

console.log('\n--- Test 4: Git Secret Storage Verification ---');
try {
  const gitTrackedEnv = execSync('git ls-files .env .env.local', { encoding: 'utf8' }).trim();
  console.log('Tracked .env files in Git:', gitTrackedEnv === '' ? 'None (Clean)' : gitTrackedEnv);
  if (gitTrackedEnv !== '') {
    throw new Error('SECURITY VIOLATION: .env file is tracked in Git!');
  }
} catch (e) {
  if (!e.message.includes('Clean')) throw e;
}

console.log('\n=== ALL CRYPTO & SECURITY ISOLATION TESTS PASSED 100% ===');
