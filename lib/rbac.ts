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
  FIELD_FOCAL_POINT: 'FIELD_FOCAL_POINT',
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
// GRANULAR CAPABILITIES FOUNDATION
// ==========================================

export const CAPABILITIES = {
  // Operational Management (Admin Portal)
  MANAGE_REQUESTS: 'manage_requests',
  MANAGE_TRAINING: 'manage_training',
  MANAGE_RESEARCH: 'manage_research',
  MANAGE_MESSAGES: 'manage_messages',
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_USERS: 'manage_users',
  MANAGE_CONTENT: 'manage_content',  // Phase 1: Public Content Management
  VIEW_AUDIT_LOGS: 'view_audit_logs',

  // Phase 2: Field Incident & Targeted Alert Capabilities
  SUBMIT_INCIDENT: 'submit_incident',
  VERIFY_INCIDENT: 'verify_incident',
  ANALYZE_INCIDENT: 'analyze_incident',
  DRAFT_INCIDENT_ALERT: 'draft_incident_alert',
  APPROVE_INCIDENT_ALERT: 'approve_incident_alert',

  // Phase 3: Operational Risk Register Capabilities
  VIEW_RISK_REGISTER: 'view_risk_register',
  MANAGE_RISK_REGISTER: 'manage_risk_register',
  ASSESS_RISK: 'assess_risk',

  // Package C: KPI, Quality & Operational Intelligence
  VIEW_KPI: 'view_kpi',
  QA_REPORTS: 'qa_reports',

  // Package D: Academy, Trainers & Training Content Capabilities
  MANAGE_TRAINERS: 'manage_trainers',
  MANAGE_TRAINING_CONTENT: 'manage_training_content',

  // Package E: Equipment, Inventory, Procurement & Inspection
  MANAGE_INVENTORY: 'manage_inventory',
  MANAGE_PROCUREMENT: 'manage_procurement',
  MANAGE_EQUIPMENT: 'manage_equipment',
  MANAGE_INSPECTIONS: 'manage_inspections',
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
  CAPABILITIES.MANAGE_CONTENT,
  CAPABILITIES.VIEW_KPI,
  CAPABILITIES.QA_REPORTS,
  CAPABILITIES.MANAGE_TRAINERS,
  CAPABILITIES.MANAGE_TRAINING_CONTENT,
  CAPABILITIES.MANAGE_INVENTORY,
  CAPABILITIES.MANAGE_PROCUREMENT,
  CAPABILITIES.MANAGE_EQUIPMENT,
  CAPABILITIES.MANAGE_INSPECTIONS,
];

export const LEGACY_ROLE_CAPABILITIES: Record<string, Capability[]> = {
  TRAINING_MANAGER: [
    CAPABILITIES.MANAGE_TRAINING,
    CAPABILITIES.MANAGE_TRAINERS,
    CAPABILITIES.MANAGE_TRAINING_CONTENT,
  ],
  RESEARCH_MANAGER: [CAPABILITIES.MANAGE_RESEARCH],
  SERVICE_MANAGER: [
    CAPABILITIES.MANAGE_REQUESTS,
    CAPABILITIES.MANAGE_INVENTORY,
    CAPABILITIES.MANAGE_PROCUREMENT,
    CAPABILITIES.MANAGE_EQUIPMENT,
    CAPABILITIES.MANAGE_INSPECTIONS,
  ],
  CONTENT_MANAGER: [CAPABILITIES.MANAGE_RESEARCH, CAPABILITIES.MANAGE_TRAINING, CAPABILITIES.MANAGE_CONTENT],
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
 * - ADMIN: all operational capabilities + any explicitly assigned.
 * - Legacy Managers: mapped operational capabilities + any explicitly assigned.
 * - STAFF / EMPLOYEE: only explicitly assigned capabilities (Least Privilege).
 * - FIELD_FOCAL_POINT: ONLY SUBMIT_INCIDENT (if explicitly assigned). Zero admin capabilities.
 * - CLIENT / TRAINEE: empty array (always denied).
 */
export async function getUserCapabilities(userId: string, role: string): Promise<Capability[]> {
  if (role === ROLES.SUPER_ADMIN) {
    return [...ALL_CAPABILITIES];
  }

  if (role === ROLES.CLIENT || role === ROLES.TRAINEE) {
    return [];
  }

  // Field Focal Points: Strictly limited to explicit submit_incident capability
  if (role === ROLES.FIELD_FOCAL_POINT) {
    try {
      const assigned = await prisma.userCapability.findMany({
        where: { userId },
        select: { capability: true },
      });
      return assigned
        .map((a) => a.capability as Capability)
        .filter((c) => c === CAPABILITIES.SUBMIT_INCIDENT);
    } catch (err) {
      console.error('Error fetching focal point capabilities:', err);
      return [];
    }
  }

  // Base capabilities from roles (ADMIN gets operational baseline, managers get their legacy scope)
  let baseCaps: Capability[] = [];
  if (role === ROLES.ADMIN) {
    baseCaps = [...ADMIN_OPERATIONAL_CAPABILITIES];
  } else if (LEGACY_ROLE_CAPABILITIES[role]) {
    baseCaps = [...LEGACY_ROLE_CAPABILITIES[role]];
  }

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

// ==========================================
// PHASE 2: INCIDENT ACCESS GATES
// ==========================================

/**
 * Gate for Sensitive Original Incident.
 * STRICTLY restricted to SUPER_ADMIN.
 * Any other role (including ADMIN) is unconditionally denied.
 */
export function canAccessOriginalIncident(
  session: TokenPayload | null
): { authorized: boolean; error?: string; status?: number } {
  if (!session || !session.userId) {
    return { authorized: false, error: 'Unauthorized: Authentication required', status: 401 };
  }

  if (session.role !== ROLES.SUPER_ADMIN) {
    return {
      authorized: false,
      error: 'Forbidden: Sensitive original incident data is restricted strictly to SUPER_ADMIN',
      status: 403,
    };
  }

  return { authorized: true };
}

/**
 * Triple-Gate Enforcement for Redacted Incidents:
 * 1. Active Account: User account must be active in DB (isActive === true).
 * 2. Functional Capability: Must possess verify_incident, analyze_incident, or draft_incident_alert.
 * 3. Active Assignment: Must have an active assignment record for the specific incident.
 * 
 * Note: SUPER_ADMIN bypasses this gate.
 * Note: General ADMIN role without active assignment is explicitly REJECTED.
 */
export async function canAccessRedactedIncident(
  session: TokenPayload | null,
  incidentId: string
): Promise<{ authorized: boolean; error?: string; status?: number }> {
  if (!session || !session.userId) {
    return { authorized: false, error: 'Unauthorized: Authentication required', status: 401 };
  }

  // Universal bypass for SUPER_ADMIN
  if (session.role === ROLES.SUPER_ADMIN) {
    return { authorized: true };
  }

  // Hard deny for CLIENT, TRAINEE, or FIELD_FOCAL_POINT
  if (
    session.role === ROLES.CLIENT ||
    session.role === ROLES.TRAINEE ||
    session.role === ROLES.FIELD_FOCAL_POINT
  ) {
    return { authorized: false, error: 'Forbidden: Role not authorized for incident review', status: 403 };
  }

  // Gate 1: Verify Active Account in DB
  const dbUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { isActive: true },
  });

  if (!dbUser || !dbUser.isActive) {
    return { authorized: false, error: 'Forbidden: User account is inactive or disabled', status: 403 };
  }

  // Gate 2: Verify Functional Capability
  const allowedCapabilities = [
    CAPABILITIES.VERIFY_INCIDENT,
    CAPABILITIES.ANALYZE_INCIDENT,
    CAPABILITIES.DRAFT_INCIDENT_ALERT,
  ];

  const userCaps = await getUserCapabilities(session.userId, session.role);
  const hasRequiredCapability = allowedCapabilities.some((c) => userCaps.includes(c));

  if (!hasRequiredCapability) {
    return {
      authorized: false,
      error: 'Forbidden: Missing required incident capability (verify_incident or analyze_incident)',
      status: 403,
    };
  }

  // Gate 3: Verify Active Task Assignment for this specific incident
  const assignment = await prisma.incidentAssignment.findFirst({
    where: {
      incidentId,
      assignedToUserId: session.userId,
      isActive: true,
      revokedAt: null,
    },
  });

  if (!assignment) {
    return {
      authorized: false,
      error: 'Forbidden: Access denied. No active assignment found for this incident (Triple-Gate Enforcement)',
      status: 403,
    };
  }

  return { authorized: true };
}

