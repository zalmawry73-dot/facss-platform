/**
 * CommonJS companion for lib/rbac.ts
 * Provides RBAC constants, capability definitions, and gate helpers for Node scripts and tests.
 */

let prismaClient;
function getPrisma() {
  if (!prismaClient) {
    const { PrismaClient } = require('@prisma/client');
    prismaClient = new PrismaClient();
  }
  return prismaClient;
}

const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  CONTENT_MANAGER: 'CONTENT_MANAGER',
  SERVICE_MANAGER: 'SERVICE_MANAGER',
  TRAINING_MANAGER: 'TRAINING_MANAGER',
  RESEARCH_MANAGER: 'RESEARCH_MANAGER',
  EMPLOYEE: 'EMPLOYEE',
  FIELD_RESEARCHER: 'FIELD_RESEARCHER',
  OPS_MANAGER: 'OPS_MANAGER',
  ANALYST: 'ANALYST',
  FIELD_FOCAL_POINT: 'FIELD_FOCAL_POINT',
  CLIENT: 'CLIENT',
  TRAINEE: 'TRAINEE',
};

const STAFF_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.STAFF,
  ROLES.CONTENT_MANAGER,
  ROLES.SERVICE_MANAGER,
  ROLES.TRAINING_MANAGER,
  ROLES.RESEARCH_MANAGER,
  ROLES.EMPLOYEE,
  ROLES.FIELD_RESEARCHER,
  ROLES.OPS_MANAGER,
  ROLES.ANALYST,
];

const ADMIN_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
];

const CAPABILITIES = {
  MANAGE_REQUESTS: 'manage_requests',
  MANAGE_TRAINING: 'manage_training',
  MANAGE_RESEARCH: 'manage_research',
  MANAGE_MESSAGES: 'manage_messages',
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_USERS: 'manage_users',
  VIEW_AUDIT_LOGS: 'view_audit_logs',

  SUBMIT_INCIDENT: 'submit_incident',
  VERIFY_INCIDENT: 'verify_incident',
  ANALYZE_INCIDENT: 'analyze_incident',
  DRAFT_INCIDENT_ALERT: 'draft_incident_alert',
  APPROVE_INCIDENT_ALERT: 'approve_incident_alert',
};

const ALL_CAPABILITIES = Object.values(CAPABILITIES);

const ADMIN_OPERATIONAL_CAPABILITIES = [
  CAPABILITIES.MANAGE_REQUESTS,
  CAPABILITIES.MANAGE_TRAINING,
  CAPABILITIES.MANAGE_RESEARCH,
  CAPABILITIES.MANAGE_MESSAGES,
  CAPABILITIES.MANAGE_SETTINGS,
  CAPABILITIES.VIEW_AUDIT_LOGS,
  CAPABILITIES.MANAGE_USERS,
];

function isStaffRole(role) {
  return STAFF_ROLES.includes(role);
}

function isStaff(role) {
  return STAFF_ROLES.includes(role);
}

function isAdminRole(role) {
  return ADMIN_ROLES.includes(role);
}

function isAdmin(role) {
  return ADMIN_ROLES.includes(role);
}

function isFieldFocalPoint(role) {
  return role === ROLES.FIELD_FOCAL_POINT;
}

function getUserCapabilities(user) {
  if (!user || user.isActive === false) return [];
  if (user.role === ROLES.SUPER_ADMIN) return [...ALL_CAPABILITIES];
  if (user.role === ROLES.ADMIN) return [...ADMIN_OPERATIONAL_CAPABILITIES];
  if (user.role === ROLES.CLIENT || user.role === ROLES.TRAINEE) return [];
  if (user.role === ROLES.FIELD_FOCAL_POINT) {
    const userCaps = user.capabilities || [];
    return userCaps.filter((c) => c === CAPABILITIES.SUBMIT_INCIDENT);
  }
  return user.capabilities || [];
}

function hasCapability(userRole, userCaps = [], capability) {
  if (userRole === ROLES.SUPER_ADMIN) return true;
  if (userRole === ROLES.FIELD_FOCAL_POINT) {
    return capability === CAPABILITIES.SUBMIT_INCIDENT && userCaps.includes(CAPABILITIES.SUBMIT_INCIDENT);
  }
  if (userRole === ROLES.ADMIN && ADMIN_OPERATIONAL_CAPABILITIES.includes(capability)) {
    return true;
  }
  return Array.isArray(userCaps) && userCaps.includes(capability);
}

function canAccessOriginalIncident(session) {
  if (!session) {
    return { authorized: false, error: 'Unauthorized: Authentication required', status: 401 };
  }
  if (!session.isActive) {
    return { authorized: false, error: 'Forbidden: Account inactive', status: 403 };
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

function canAccessIncidentOriginal(session) {
  return canAccessOriginalIncident(session);
}

function canAccessRedactedIncident(session, incidentId, assignedUserIds) {
  if (!session) {
    return { authorized: false, reason: 'UNAUTHENTICATED', status: 401 };
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
    return { authorized: false, reason: 'ROLE_DENIED', status: 403 };
  }

  // Gate 1: Active Account
  if (!session.isActive) {
    return { authorized: false, reason: 'ACCESS_DENIED_ACCOUNT_INACTIVE', status: 403 };
  }

  // Gate 2: Functional Capability
  const allowedCapabilities = [
    CAPABILITIES.VERIFY_INCIDENT,
    CAPABILITIES.ANALYZE_INCIDENT,
    CAPABILITIES.DRAFT_INCIDENT_ALERT,
  ];
  const userCaps = session.capabilities || [];
  const hasCap = allowedCapabilities.some((c) => userCaps.includes(c));
  if (!hasCap) {
    return { authorized: false, reason: 'ACCESS_DENIED_CAPABILITY_REQUIRED', status: 403 };
  }

  // Gate 3: Active Task Assignment for this specific incident
  if (Array.isArray(assignedUserIds)) {
    if (!assignedUserIds.includes(session.userId)) {
      return { authorized: false, reason: 'ACCESS_DENIED_NO_ACTIVE_ASSIGNMENT', status: 403 };
    }
    return { authorized: true };
  }

  const prisma = getPrisma();
  return prisma.incidentAssignment.findFirst({
    where: {
      incidentId,
      assignedToUserId: session.userId,
      isActive: true,
    },
  }).then((activeAssignment) => {
    if (!activeAssignment) {
      return { authorized: false, reason: 'ACCESS_DENIED_NO_ACTIVE_ASSIGNMENT', status: 403 };
    }
    return { authorized: true };
  });
}

async function getCurrentUser(enforceDbCheck = false) {
  try {
    const { cookies } = require('next/headers');
    const { verifyAuthToken } = require('./auth');
    const cookieStore = cookies();
    const token = cookieStore.get('facss_token')?.value;
    if (!token) return null;

    const session = verifyAuthToken(token);
    if (!session) return null;

    if (enforceDbCheck) {
      const prisma = getPrisma();
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, email: true, role: true, isActive: true },
      });
      if (!user || !user.isActive) return null;
      return {
        ...session,
        role: user.role,
        isActive: user.isActive,
      };
    }
    return session;
  } catch (err) {
    return null;
  }
}

async function requireAuth(redirectPath) {
  const { redirect } = require('next/navigation');
  const user = await getCurrentUser(true);
  if (!user) {
    const loginUrl = redirectPath 
      ? `/login?redirect=${encodeURIComponent(redirectPath)}` 
      : '/login';
    redirect(loginUrl);
  }
  return user;
}

async function requireRole(allowedRoles, redirectPath) {
  const { redirect } = require('next/navigation');
  const user = await requireAuth(redirectPath);
  if (user.role === ROLES.SUPER_ADMIN) return user;
  if (!allowedRoles.includes(user.role)) {
    redirect('/login?error=unauthorized');
  }
  return user;
}

async function requireStaff(redirectPath = '/admin') {
  return requireRole(STAFF_ROLES, redirectPath);
}

async function requireAdmin(redirectPath = '/admin') {
  return requireRole(ADMIN_ROLES, redirectPath);
}

async function requireCapability(capability, redirectPath) {
  const { redirect } = require('next/navigation');
  const user = await requireAuth(redirectPath);
  const allowed = await hasCapability(user, capability);
  if (!allowed) {
    redirect('/admin?error=forbidden');
  }
  return user;
}

async function requireAdminOrCapability(capability, redirectPath) {
  const { redirect } = require('next/navigation');
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

async function requireOwnershipOrStaff(resourceUserId, redirectPath) {
  const { redirect } = require('next/navigation');
  const user = await requireAuth(redirectPath);
  const isStaffMember = STAFF_ROLES.includes(user.role);
  const isOwner = Boolean(resourceUserId && user.userId === resourceUserId);
  if (!isOwner && !isStaffMember) {
    redirect('/login?error=forbidden');
  }
  return { user, isStaff: isStaffMember, isOwner };
}

async function assertApiCapability(session, capability) {
  const { NextResponse } = require('next/server');
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

module.exports = {
  ROLES,
  STAFF_ROLES,
  ADMIN_ROLES,
  CAPABILITIES,
  ALL_CAPABILITIES,
  ADMIN_OPERATIONAL_CAPABILITIES,
  isStaffRole,
  isStaff,
  isAdminRole,
  isAdmin,
  isFieldFocalPoint,
  getUserCapabilities,
  hasCapability,
  canAccessOriginalIncident,
  canAccessIncidentOriginal,
  canAccessRedactedIncident,
  getCurrentUser,
  requireAuth,
  requireRole,
  requireStaff,
  requireAdmin,
  requireCapability,
  requireAdminOrCapability,
  requireOwnershipOrStaff,
  assertApiCapability,
};

