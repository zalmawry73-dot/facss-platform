/**
 * Granular RBAC Role and Capability Definitions
 * Pure constants and type definitions safe for both Client and Server Components.
 */

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
