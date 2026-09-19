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
 * Returns authenticated user payload with database verification (checks isActive).
 * If user is disabled, deleted, or token is invalid, returns null.
 */
export async function getCurrentUser(verifyDb: boolean = true): Promise<TokenPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) return null;

    if (!verifyDb) {
      return payload;
    }

    // Database verification: ensures user exists and isActive === true
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
      }
    });

    if (!user || !user.isActive) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      phone: user.phone,
      organization: user.organization,
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
