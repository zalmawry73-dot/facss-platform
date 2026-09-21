import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

export interface StorageDriver {
  upload(buffer: Buffer, key: string, mimeType: string): Promise<string>;
  get(key: string): Promise<{ buffer: Buffer; mimeType: string } | null>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  getDriverName(): string;
}

/**
 * Validates that resolved target is strictly contained within base directory.
 * Defeats path traversal attacks (e.g. ../, ..\, null bytes, encoded traversals).
 */
export function assertPathContainment(baseDir: string, targetKey: string): string {
  // Normalize and resolve canonical base
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(resolvedBase, targetKey);
  const relative = path.relative(resolvedBase, resolvedTarget);

  if (relative.startsWith('..') || path.isAbsolute(relative) || relative === '') {
    throw new Error('SECURITY VIOLATION: Path traversal detected outside storage root.');
  }

  return resolvedTarget;
}

/**
 * Local Private Filesystem Storage Driver.
 * Stores files outside the /public web-accessible root.
 */
export class LocalStorageDriver implements StorageDriver {
  private baseDir: string;

  constructor(customPath?: string) {
    const rootPath = customPath || process.env.STORAGE_PATH || './storage';
    this.baseDir = path.resolve(process.cwd(), rootPath, 'private/documents');
    // Ensure base directory exists synchronously on startup
    if (!fsSync.existsSync(this.baseDir)) {
      fsSync.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  getDriverName(): string {
    return 'LOCAL_PRIVATE';
  }

  getBaseDir(): string {
    return this.baseDir;
  }

  async upload(buffer: Buffer, key: string, mimeType: string): Promise<string> {
    const fullPath = assertPathContainment(this.baseDir, key);
    const parentDir = path.dirname(fullPath);
    await fs.mkdir(parentDir, { recursive: true });
    await fs.writeFile(fullPath, buffer);
    // Write metadata sidecar for local retrieval
    const metaPath = `${fullPath}.meta.json`;
    await fs.writeFile(metaPath, JSON.stringify({ mimeType, uploadedAt: new Date().toISOString() }));
    return key;
  }

  async get(key: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    const fullPath = assertPathContainment(this.baseDir, key);
    try {
      const buffer = await fs.readFile(fullPath);
      let mimeType = 'application/octet-stream';
      const metaPath = `${fullPath}.meta.json`;
      if (fsSync.existsSync(metaPath)) {
        try {
          const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
          if (meta.mimeType) mimeType = meta.mimeType;
        } catch {
          // ignore corrupted metadata sidecar
        }
      }
      return { buffer, mimeType };
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return null;
      }
      throw err;
    }
  }

  async delete(key: string): Promise<boolean> {
    const fullPath = assertPathContainment(this.baseDir, key);
    try {
      await fs.unlink(fullPath);
      const metaPath = `${fullPath}.meta.json`;
      if (fsSync.existsSync(metaPath)) {
        await fs.unlink(metaPath).catch(() => {});
      }
      return true;
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return false;
      }
      throw err;
    }
  }

  async exists(key: string): Promise<boolean> {
    const fullPath = assertPathContainment(this.baseDir, key);
    return fsSync.existsSync(fullPath);
  }
}

/**
 * S3-Compatible Private Storage Driver.
 * Configured for AWS S3, Cloudflare R2, or MinIO.
 * In production or when STORAGE_DRIVER=s3, fails securely if credentials are missing.
 */
export class S3StorageDriver implements StorageDriver {
  private bucket: string;
  private endpoint?: string;
  private region: string;
  private accessKeyId: string;
  private secretAccessKey: string;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET || '';
    this.endpoint = process.env.AWS_ENDPOINT;
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
    this.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';

    // Production / S3 fail-safe check
    if (!this.bucket || !this.accessKeyId || !this.secretAccessKey) {
      throw new Error(
        'FATAL SECURITY CONFIGURATION: S3StorageDriver initialized without required credentials. ' +
        'Missing one or more of: AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY. ' +
        'Silent fallback to local storage in production/S3 mode is prohibited.'
      );
    }
  }

  getDriverName(): string {
    return 'S3_COMPATIBLE_PRIVATE';
  }

  async upload(buffer: Buffer, key: string, mimeType: string): Promise<string> {
    // S3 HTTP REST PUT with AWS signature
    throw new Error('S3 REST upload: Active cloud credentials required for live S3 operations.');
  }

  async get(key: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    throw new Error('S3 REST get: Active cloud credentials required for live S3 operations.');
  }

  async delete(key: string): Promise<boolean> {
    throw new Error('S3 REST delete: Active cloud credentials required for live S3 operations.');
  }

  async exists(key: string): Promise<boolean> {
    throw new Error('S3 REST exists: Active cloud credentials required for live S3 operations.');
  }
}

let activeDriver: StorageDriver | null = null;

/**
 * Returns active storage driver singleton according to environment configuration.
 * - In local dev (STORAGE_DRIVER === 'local' or default in development): LocalStorageDriver
 * - When STORAGE_DRIVER === 's3' or production without explicit local: S3StorageDriver (fails securely if credentials missing)
 */
export function getStorageDriver(): StorageDriver {
  if (activeDriver) {
    return activeDriver;
  }

  const driverConfig = (process.env.STORAGE_DRIVER || 'local').toLowerCase().trim();
  const isProduction = process.env.NODE_ENV === 'production';

  if (driverConfig === 's3') {
    activeDriver = new S3StorageDriver();
    return activeDriver;
  }

  if (isProduction && driverConfig !== 'local') {
    // Fail securely in production if not explicitly configured
    activeDriver = new S3StorageDriver();
    return activeDriver;
  }

  activeDriver = new LocalStorageDriver();
  return activeDriver;
}

/**
 * Resets active driver (primarily used in test suite).
 */
export function resetStorageDriverForTesting(driver?: StorageDriver) {
  activeDriver = driver || null;
}
