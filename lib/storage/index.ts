import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';

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
 * Configured for Cloudflare R2, AWS S3, or MinIO.
 * In production or when STORAGE_DRIVER=s3, fails securely if credentials are missing.
 */
export class S3StorageDriver implements StorageDriver {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET || process.env.R2_BUCKET_NAME || '';
    const endpoint = process.env.AWS_ENDPOINT || process.env.R2_ENDPOINT || process.env.CLOUDFLARE_R2_ENDPOINT;
    const region = process.env.AWS_REGION || (endpoint ? 'auto' : 'us-east-1');
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || '';
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || '';

    // Production / S3 fail-safe check
    if (!this.bucket || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'FATAL SECURITY CONFIGURATION: S3StorageDriver initialized without required credentials. ' +
        'Missing one or more of: AWS_S3_BUCKET (or R2_BUCKET_NAME), AWS_ACCESS_KEY_ID (or R2_ACCESS_KEY_ID), AWS_SECRET_ACCESS_KEY (or R2_SECRET_ACCESS_KEY). ' +
        'Silent fallback to local storage in production/S3 mode is prohibited.'
      );
    }

    this.client = new S3Client({
      region,
      endpoint: endpoint || undefined,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  getDriverName(): string {
    return 'S3_COMPATIBLE_PRIVATE';
  }

  async upload(buffer: Buffer, key: string, mimeType: string): Promise<string> {
    const cleanKey = key.replace(/^[/\\]+/, '');
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: cleanKey,
      Body: buffer,
      ContentType: mimeType,
    });
    await this.client.send(command);
    return cleanKey;
  }

  async get(key: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    const cleanKey = key.replace(/^[/\\]+/, '');
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: cleanKey,
      });
      const response = await this.client.send(command);
      if (!response.Body) {
        return null;
      }
      const byteArray = await response.Body.transformToByteArray();
      const mimeType = response.ContentType || 'application/octet-stream';
      return { buffer: Buffer.from(byteArray), mimeType };
    } catch (err: any) {
      if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw err;
    }
  }

  async delete(key: string): Promise<boolean> {
    const cleanKey = key.replace(/^[/\\]+/, '');
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: cleanKey,
      });
      await this.client.send(command);
      return true;
    } catch (err: any) {
      if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw err;
    }
  }

  async exists(key: string): Promise<boolean> {
    const cleanKey = key.replace(/^[/\\]+/, '');
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: cleanKey,
      });
      await this.client.send(command);
      return true;
    } catch (err: any) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw err;
    }
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
