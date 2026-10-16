import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import prisma from './prisma';

export const TOKEN_COOKIE_NAME = 'facss_session_token';

export interface TokenPayload {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  phone?: string | null;
  organization?: string | null;
  tokenVersion: number; // MANDATORY: Fail closed on legacy or unversioned tokens
}

export function getJwtSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.trim().length < 32) {
    throw new Error('FATAL SECURITY CONFIGURATION: AUTH_SECRET is missing or less than 32 characters.');
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: TokenPayload): Promise<string> {
  if (typeof payload.tokenVersion !== 'number' || payload.tokenVersion < 1) {
    throw new Error('FATAL SECURITY: Cannot sign token without valid tokenVersion.');
  }
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret());
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as TokenPayload;
  } catch (err) {
    return null;
  }
}

/**
 * Returns authenticated user payload with centralized database verification.
 * Enforces:
 * 1. Cryptographic signature and expiration.
 * 2. Mandatory presence of tokenVersion >= 1 (fails closed on legacy/unversioned tokens).
 * 3. Database existence and isActive === true.
 * 4. Exact match between JWT tokenVersion and database tokenVersion (session revocation).
 */
export async function getCurrentUser(verifyDb: boolean = true): Promise<TokenPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) return null;

    // MANDATORY REQUIREMENT 1: Fail closed if tokenVersion is missing, undefined, null, or invalid
    if (typeof payload.tokenVersion !== 'number' || payload.tokenVersion < 1) {
      return null;
    }

    if (!verifyDb) {
      return payload;
    }

    // Database verification: ensures user exists, isActive === true, and tokenVersion matches
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        phone: true,
        organization: true,
        tokenVersion: true,
      }
    });

    if (!user || !user.isActive) {
      return null;
    }

    // MANDATORY REQUIREMENT 1 & 2: Strict match between JWT tokenVersion and DB tokenVersion
    if (payload.tokenVersion !== user.tokenVersion) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      phone: user.phone,
      organization: user.organization,
      tokenVersion: user.tokenVersion,
    };
  } catch (err) {
    console.error('getCurrentUser error:', err);
    return null;
  }
}

export async function getAuthenticatedUserWithProfile() {
  const session = await getCurrentUser(true);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { clientProfile: true },
  });

  if (!user || !user.isActive) return null;
  return user;
}

export function hasRole(userRole: string, allowedRoles: string[]): boolean {
  if (userRole === 'SUPER_ADMIN') return true;
  return allowedRoles.includes(userRole);
}

export const getSession = getCurrentUser;
