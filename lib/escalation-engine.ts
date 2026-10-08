import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/rbac';
import { logActivity } from '@/lib/audit';

export interface EscalationResult {
  success: boolean;
  alreadyEscalated?: boolean;
  error?: string;
  incident?: any;
  notifiedCount?: number;
}

/**
 * Executes an internal escalation on an Incident.
 * Strictly In-App notifications, zero external providers (SMS/WhatsApp).
 * Idempotent: Prevents duplicate escalation.
 */
export async function escalateIncidentInternal(
  incidentId: string,
  reason: string,
  escalatedByUserId?: string,
  escalatedByName?: string,
  txPrisma?: any
): Promise<EscalationResult> {
  const db = txPrisma || prisma;

  const incident = await db.incident.findUnique({
    where: { id: incidentId },
    include: {
      assignments: {
        where: { isActive: true },
        select: { assignedToUserId: true },
      },
    },
  });

  if (!incident) {
    return { success: false, error: 'البلاغ الميداني غير موجود' };
  }

  // Prevent duplicate escalation
  if (incident.isEscalated) {
    return {
      success: true,
      alreadyEscalated: true,
      incident,
      notifiedCount: 0,
    };
  }

  const now = new Date();
  const escalationReasonText = reason || 'تجاوز الحد الزمني لاتفاقية مستوى الخدمة (SLA Breach) أو تصعيد تشغيلي طارئ';

  // 1. Update Incident record atomically
  const updated = await db.incident.update({
    where: { id: incidentId },
    data: {
      isEscalated: true,
      escalatedAt: now,
      escalationReason: escalationReasonText,
      slaStatus: 'BREACHED',
    },
  });

  // 2. Collect In-App Notification recipients:
  // All SUPER_ADMIN & ADMIN users, plus users actively assigned to this incident
  const adminUsers = await db.user.findMany({
    where: {
      isActive: true,
      role: { in: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
    },
    select: { id: true },
  });

  const recipientUserIds = new Set<string>();
  adminUsers.forEach((u: { id: string }) => recipientUserIds.add(u.id));
  incident.assignments.forEach((a: { assignedToUserId: string }) => recipientUserIds.add(a.assignedToUserId));



  let notifiedCount = 0;
  if (recipientUserIds.size > 0) {
    const notifications = Array.from(recipientUserIds).map((userId) => ({
      userId,
      titleAr: `🚨 تصعيد تشغيلي طارئ: البلاغ [${incident.incidentNumber}]`,
      titleEn: `🚨 Operational Escalation: Incident [${incident.incidentNumber}]`,
      messageAr: `تم تصعيد البلاغ الميداني [${incident.incidentNumber}] في [${incident.governorate}]. السبب: ${escalationReasonText}`,
      messageEn: `Field Incident [${incident.incidentNumber}] in [${incident.governorate}] has been escalated. Reason: ${escalationReasonText}`,
      type: 'ALERT',
      link: `/admin/incidents/${incident.id}`,
      isRead: false,
    }));

    await db.notification.createMany({
      data: notifications,
    });
    notifiedCount = notifications.length;
  }

  // 3. Audit Logging
  await logActivity({
    userId: escalatedByUserId || null,
    userName: escalatedByName || 'SYSTEM_SLA_ENGINE',
    action: 'ESCALATE_INCIDENT',
    entityType: 'Incident',
    entityId: incident.id,
    details: `تصعيد البلاغ [${incident.incidentNumber}] بنجاح وإشعار (${notifiedCount}) من المشرفين والمكلفين. السبب: ${escalationReasonText}`,
  });

  return {
    success: true,
    alreadyEscalated: false,
    incident: updated,
    notifiedCount,
  };
}
