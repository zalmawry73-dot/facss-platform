/**
 * Synchronized RBAC module for Next.js runtime and Node.js companions.
 * Ensures consistent capability evaluation, cookie token resolution, and database checks.
 */

const { jwtVerify } = require('jose');

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
];

const ADMIN_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
];

const CLIENT_ROLES = [
  ROLES.CLIENT,
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
];

const TRAINEE_ROLES = [
  ROLES.TRAINEE,
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
  MANAGE_CONTENT: 'manage_content',
  VIEW_AUDIT_LOGS: 'view_audit_logs',

  SUBMIT_INCIDENT: 'submit_incident',
  VERIFY_INCIDENT: 'verify_incident',
  ANALYZE_INCIDENT: 'analyze_incident',
  DRAFT_INCIDENT_ALERT: 'draft_incident_alert',
  APPROVE_INCIDENT_ALERT: 'approve_incident_alert',

  VIEW_RISK_REGISTER: 'view_risk_register',
  MANAGE_RISK_REGISTER: 'manage_risk_register',
  ASSESS_RISK: 'assess_risk',

  VIEW_KPI: 'view_kpi',
  QA_REPORTS: 'qa_reports',

  MANAGE_TRAINERS: 'manage_trainers',
  MANAGE_TRAINING_CONTENT: 'manage_training_content',

  MANAGE_INVENTORY: 'manage_inventory',
  MANAGE_PROCUREMENT: 'manage_procurement',
  MANAGE_EQUIPMENT: 'manage_equipment',
  MANAGE_INSPECTIONS: 'manage_inspections',
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

const LEGACY_ROLE_CAPABILITIES = {
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
  CONTENT_MANAGER: [
    CAPABILITIES.MANAGE_RESEARCH,
    CAPABILITIES.MANAGE_TRAINING,
    CAPABILITIES.MANAGE_CONTENT,
  ],
};

function isStaffRole(role) {
  return STAFF_ROLES.includes(role);
}

function isAdminRole(role) {
  return ADMIN_ROLES.includes(role);
}

async function getUserCapabilities(userId, role) {
  if (role === ROLES.SUPER_ADMIN) {
    return [...ALL_CAPABILITIES];
  }

  if (role === ROLES.CLIENT || role === ROLES.TRAINEE) {
    return [];
  }

  if (role === ROLES.FIELD_FOCAL_POINT) {
    try {
      const prisma = getPrisma();
      const assigned = await prisma.userCapability.findMany({
        where: { userId },
        select: { capability: true },
      });
      return assigned
        .map((a) => a.capability)
        .filter((c) => c === CAPABILITIES.SUBMIT_INCIDENT);
    } catch (err) {
      return [];
    }
  }

  let baseCaps = [];
  if (role === ROLES.ADMIN) {
    baseCaps = [...ADMIN_OPERATIONAL_CAPABILITIES];
  } else if (LEGACY_ROLE_CAPABILITIES[role]) {
    baseCaps = [...LEGACY_ROLE_CAPABILITIES[role]];
  }

  try {
    const prisma = getPrisma();
    const assigned = await prisma.userCapability.findMany({
      where: { userId },
      select: { capability: true },
    });

    const assignedCaps = assigned
      .map((a) => a.capability)
      .filter((c) => ALL_CAPABILITIES.includes(c));

    return Array.from(new Set([...baseCaps, ...assignedCaps]));
  } catch (err) {
    return baseCaps;
  }
}

async function hasCapability(user, capability) {
  if (!user || !user.role) return false;
  if (user.role === ROLES.SUPER_ADMIN) return true;
  if (user.role === ROLES.CLIENT || user.role === ROLES.TRAINEE) return false;

  const userCaps = await getUserCapabilities(user.userId, user.role);
  return userCaps.includes(capability);
}

const TOKEN_COOKIE_NAME = 'facss_session_token';

async function getCurrentUser(verifyDb = true) {
  try {
    const { cookies } = require('next/headers');
    const cookieStore = cookies();
    const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
    if (!token) return null;

    const secret = process.env.AUTH_SECRET;
    if (!secret || secret.trim().length < 32) return null;

    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    if (!payload || !payload.userId) return null;

    if (!verifyDb) {
      return payload;
    }

    const prisma = getPrisma();
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
      },
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

async function requireOwnershipOrStaff(resourceUserId, redirectPath) {
  const { redirect } = require('next/navigation');
  const user = await requireAuth(redirectPath);
  const isStaff = STAFF_ROLES.includes(user.role);
  const isOwner = Boolean(resourceUserId && user.userId === resourceUserId);
  if (!isOwner && !isStaff) {
    redirect('/login?error=forbidden');
  }
  return { user, isStaff, isOwner };
}

function canAccessOriginalIncident(session) {
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

async function canAccessRedactedIncident(session, incidentId) {
  if (!session || !session.userId) {
    return { authorized: false, error: 'Unauthorized: Authentication required', status: 401 };
  }
  if (session.role === ROLES.SUPER_ADMIN) {
    return { authorized: true };
  }
  if (
    session.role === ROLES.CLIENT ||
    session.role === ROLES.TRAINEE ||
    session.role === ROLES.FIELD_FOCAL_POINT
  ) {
    return { authorized: false, error: 'Forbidden: Role not authorized for incident review', status: 403 };
  }

  const prisma = getPrisma();
  const dbUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { isActive: true },
  });
  if (!dbUser || !dbUser.isActive) {
    return { authorized: false, error: 'Forbidden: User account is inactive or disabled', status: 403 };
  }

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
      error: 'Forbidden: Missing required incident capability',
      status: 403,
    };
  }

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
      error: 'Forbidden: Access denied. No active assignment found for this incident',
      status: 403,
    };
  }
  return { authorized: true };
}

module.exports = {
  ROLES,
  STAFF_ROLES,
  ADMIN_ROLES,
  CLIENT_ROLES,
  TRAINEE_ROLES,
  CAPABILITIES,
  ALL_CAPABILITIES,
  ADMIN_OPERATIONAL_CAPABILITIES,
  LEGACY_ROLE_CAPABILITIES,
  isStaffRole,
  isAdminRole,
  getUserCapabilities,
  hasCapability,
  getCurrentUser,
  requireAuth,
  requireRole,
  requireStaff,
  requireAdmin,
  requireCapability,
  requireAdminOrCapability,
  assertApiCapability,
  requireOwnershipOrStaff,
  canAccessOriginalIncident,
  canAccessRedactedIncident,
};
