import prisma from './prisma';

export interface ActivityLogInput {
  userId?: string | null;
  userName?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
}

/**
 * Standardized Audit Logging helper.
 * Records operational actions in the ActivityLog table.
 * Strips out sensitive credentials, passwords, or secrets automatically.
 */
export async function logActivity(input: ActivityLogInput) {
  try {
    let sanitizedDetails = input.details || '';
    
    // Safety check: ensure no passwords or secrets are ever recorded in logs
    if (typeof sanitizedDetails === 'string') {
      sanitizedDetails = sanitizedDetails
        .replace(/password[:=]\s*[^,\s]+/gi, 'password=[REDACTED]')
        .replace(/secret[:=]\s*[^,\s]+/gi, 'secret=[REDACTED]')
        .replace(/token[:=]\s*[^,\s]+/gi, 'token=[REDACTED]');
    }

    return await prisma.activityLog.create({
      data: {
        userId: input.userId || null,
        userName: input.userName || null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId || null,
        details: sanitizedDetails,
        ipAddress: input.ipAddress || null,
      },
    });
  } catch (error) {
    console.error('Failed to write activity log:', error);
    return null;
  }
}
