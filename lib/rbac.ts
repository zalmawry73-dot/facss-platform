import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { getCurrentUser, TokenPayload } from './auth';
import prisma from './prisma';

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  CONTENT_MANAGER: 'CONTENT_MANAGER',
  SERVICE_MANAGER: 'SERVICE_MANAGER',
  TRAINING_MANAGER: 'TRAINING_MANAGER',
  RESEARCH_MANAGER: 'RESEARCH_MANAGER',
  EMPLOYEE: 'EMPLOYEE',
  CLIENT: 'CLIENT',
  TRAINEE: 'TRAINEE',
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];

export const STAFF_ROLES: RoleType[] = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.STAFF,
  ROLES.CONTENT_MANAGER,
  ROLES.SERVICE_MANAGER,
  ROLES.TRAINING_MANAGER,
  ROLES.RESEARCH_MANAGER,
  ROLES.EMPLOYEE,
];

export const ADMIN_ROLES: RoleType[] = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
];

export const CLIENT_ROLES: RoleType[] = [
  ROLES.CLIENT,
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
];

export const TRAINEE_ROLES: RoleType[] = [
  ROLES.TRAINEE,
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
];

// ==========================================
// GRANULAR CAPABILITIES FOUNDATION (PHASE 2B)
// ==========================================

export const CAPABILITIES = {
  MANAGE_REQUESTS: 'manage_requests',
  MANAGE_TRAINING: 'manage_training',
  MANAGE_RESEARCH: 'manage_research',
  MANAGE_MESSAGES: 'manage_messages',
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_USERS: 'manage_users',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
} as const;

export type Capability = typeof CAPABILITIES[keyof typeof CAPABILITIES];

export const ALL_CAPABILITIES: Capability[] = Object.values(CAPABILITIES);

export const ADMIN_OPERATIONAL_CAPABILITIES: Capability[] = [
  CAPABILITIES.MANAGE_REQUESTS,
  CAPABILITIES.MANAGE_TRAINING,
  CAPABILITIES.MANAGE_RESEARCH,
  CAPABILITIES.MANAGE_MESSAGES,
  CAPABILITIES.MANAGE_SETTINGS,
  CAPABILITIES.VIEW_AUDIT_LOGS,
  CAPABILITIES.MANAGE_USERS,
];

export const LEGACY_ROLE_CAPABILITIES: Record<string, Capability[]> = {
  TRAINING_MANAGER: [CAPABILITIES.MANAGE_TRAINING],
  RESEARCH_MANAGER: [CAPABILITIES.MANAGE_RESEARCH],
  SERVICE_MANAGER: [CAPABILITIES.MANAGE_REQUESTS],
  CONTENT_MANAGER: [CAPABILITIES.MANAGE_RESEARCH, CAPABILITIES.MANAGE_TRAINING],
};

export function isStaffRole(role: string): boolean {
  return STAFF_ROLES.includes(role as RoleType);
}

export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.includes(role as RoleType);
}

/**
 * Returns all effective capabilities for a user.
 * - SUPER_ADMIN: all capabilities.
 * - ADMIN: all operational capabilities.
 * - Legacy Managers: mapped operational capabilities + any explicitly assigned.
 * - STAFF / EMPLOYEE: only explicitly assigned capabilities (Least Privilege).
 * - CLIENT / TRAINEE: empty array (always denied).
 */
export async function getUserCapabilities(userId: string, role: string): Promise<Capability[]> {
  if (role === ROLES.SUPER_ADMIN) {
    return [...ALL_CAPABILITIES];
  }

  if (role === ROLES.ADMIN) {
    return [...ADMIN_OPERATIONAL_CAPABILITIES];
  }

  if (role === ROLES.CLIENT || role === ROLES.TRAINEE) {
    return [];
  }

  // Base capabilities from legacy manager roles (if any)
  const baseCaps: Capability[] = LEGACY_ROLE_CAPABILITIES[role] ? [...LEGACY_ROLE_CAPABILITIES[role]] : [];

  // Query database for explicit user capabilities
  try {
    const assigned = await prisma.userCapability.findMany({
      where: { userId },
      select: { capability: true },
    });

    const assignedCaps = assigned
      .map((a) => a.capability as Capability)
      .filter((c) => ALL_CAPABILITIES.includes(c));

    const combined = Array.from(new Set([...baseCaps, ...assignedCaps]));
    return combined;
  } catch (err) {
    console.error('Error fetching user capabilities:', err);
    return baseCaps;
  }
}

/**
 * Checks whether a user possesses a specific capability.
 */
export async function hasCapability(
  user: { userId: string; role: string },
  capability: Capability
): Promise<boolean> {
  if (!user || !user.role) return false;

  // Universal bypass for SUPER_ADMIN
  if (user.role === ROLES.SUPER_ADMIN) {
    return true;
  }

  // Hard deny for CLIENT and TRAINEE
  if (user.role === ROLES.CLIENT || user.role === ROLES.TRAINEE) {
    return false;
  }

  const userCaps = await getUserCapabilities(user.userId, user.role);
  return userCaps.includes(capability);
}

/**
 * Server Component Gate: Requires a specific capability.
 * Redirects to /admin?error=forbidden or /login if unauthorized.
 */
export async function requireCapability(
  capability: Capability,
  redirectPath?: string
): Promise<TokenPayload> {
  const user = await requireAuth(redirectPath);

  const allowed = await hasCapability(user, capability);
  if (!allowed) {
    redirect('/admin?error=forbidden');
  }

  return user;
}

/**
 * Server Component Gate: Requires membership in ADMIN_ROLES or specific capability.
 */
export async function requireAdminOrCapability(
  capability: Capability,
  redirectPath?: string
): Promise<TokenPayload> {
  const user = await requireAuth(redirectPath);

  if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN) {
    return user;
  }

  const allowed = await hasCapability(user, capability);
  if (!allowed) {
    redirect('/admin?error=forbidden');
  }

  return user;
}

/**
 * API Route Handler Gate: Verifies capability or returns appropriate JSON error response.
 */
export async function assertApiCapability(
  session: TokenPayload | null,
  capability: Capability
): Promise<{ authorized: boolean; response?: NextResponse }> {
  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 }),
    };
  }

  if (session.role === ROLES.CLIENT || session.role === ROLES.TRAINEE) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 }),
    };
  }

  const allowed = await hasCapability(session, capability);
  if (!allowed) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: `Forbidden: Missing required capability [${capability}]` },
        { status: 403 }
      ),
    };
  }

  return { authorized: true };
}

/**
 * Ensures user is authenticated and active in DB.
 * Redirects to login if unauthenticated or disabled.
 */
export async function requireAuth(redirectPath?: string): Promise<TokenPayload> {
  const user = await getCurrentUser(true);
  if (!user) {
    const loginUrl = redirectPath 
      ? `/login?redirect=${encodeURIComponent(redirectPath)}` 
      : '/login';
    redirect(loginUrl);
  }
  return user;
}

/**
 * Strict role gate: DENY unless explicitly in allowedRoles or SUPER_ADMIN.
 */
export async function requireRole(allowedRoles: RoleType[], redirectPath?: string): Promise<TokenPayload> {
  const user = await requireAuth(redirectPath);
  
  // Super admin has universal bypass
  if (user.role === ROLES.SUPER_ADMIN) {
    return user;
  }

  if (!allowedRoles.includes(user.role as RoleType)) {
    redirect('/login?error=unauthorized');
  }

  return user;
}

/**
 * Requires membership in STAFF_ROLES.
 */
export async function requireStaff(redirectPath: string = '/admin'): Promise<TokenPayload> {
  return requireRole(STAFF_ROLES, redirectPath);
}

/**
 * Requires membership in ADMIN_ROLES (SUPER_ADMIN or ADMIN).
 */
export async function requireAdmin(redirectPath: string = '/admin'): Promise<TokenPayload> {
  return requireRole(ADMIN_ROLES, redirectPath);
}

/**
 * Object-level ownership gate.
 * Only the resource owner (matching userId) or authorized staff can access.
 * Explicitly denies cross-client or trainee access.
 */
export async function requireOwnershipOrStaff(
  resourceUserId: string | null | undefined,
  redirectPath?: string
): Promise<{ user: TokenPayload; isStaff: boolean; isOwner: boolean }> {
  const user = await requireAuth(redirectPath);
  
  const isStaff = STAFF_ROLES.includes(user.role as RoleType);
  const isOwner = Boolean(resourceUserId && user.userId === resourceUserId);

  if (!isOwner && !isStaff) {
    redirect('/login?error=forbidden');
  }

  return { user, isStaff, isOwner };
}

