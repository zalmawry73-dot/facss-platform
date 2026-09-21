import prisma from '@/lib/prisma';
import { verifySnapshotIntegrity } from '@/lib/security/alert-snapshot';
import { ROLES } from '@/lib/rbac';

export interface DispatchResult {
  success: boolean;
  error?: string;
  deliveredCount: number;
  skippedCount: number;
  dispatchedAt?: Date;
}

/**
 * Dispatches an approved alert strictly In-App (Portal notifications).
 * Absolutely no external SMS/Email/WhatsApp/Push.
 * Exclusively executed by SUPER_ADMIN.
 */
export async function dispatchAlertInternal(
  alertId: string,
  dispatcherUserId: string,
  dispatcherRole: string,
  txPrisma?: any
): Promise<DispatchResult> {
  if (dispatcherRole !== ROLES.SUPER_ADMIN) {
    return {
      success: false,
      error: 'غير مصرح: إصدار وتوزيع التنبيهات محصور بمسؤولي الإدارة العليا (SUPER_ADMIN) حصراً',
      deliveredCount: 0,
      skippedCount: 0,
    };
  }

  const db = txPrisma || prisma;

  const alert = await db.incidentAlert.findUnique({
    where: { id: alertId },
    include: {
      snapshots: true,
      incident: { select: { id: true, incidentNumber: true, status: true } },
    },
  });

  if (!alert) {
    return { success: false, error: 'التنبيه غير موجود', deliveredCount: 0, skippedCount: 0 };
  }

  if (alert.approvalStatus !== 'APPROVED' || !alert.activeSnapshotId) {
    return {
      success: false,
      error: 'لا يمكن إصدار التنبيه: التنبيه ليس في حالة معتمدة (APPROVED) أو لا يملك لقطة مجمدة صالحة',
      deliveredCount: 0,
      skippedCount: 0,
    };
  }

  const snapshot = alert.snapshots.find((s: any) => s.id === alert.activeSnapshotId);
  if (!snapshot) {
    return {
      success: false,
      error: 'خطأ أمني: تعذر العثور على اللقطة المجمدة المعتمدة للتنبيه',
      deliveredCount: 0,
      skippedCount: 0,
    };
  }

  // Cryptographic Integrity Verification
  const isIntegrityValid = verifySnapshotIntegrity(snapshot);
  if (!isIntegrityValid) {
    return {
      success: false,
      error: 'فشل فحص السلامة المشفرة: تم اكتشاف تلاعب أو تلف في بيانات اللقطة المعتمدة (Snapshot Tamper Detected)',
      deliveredCount: 0,
      skippedCount: 0,
    };
  }

  // Parse frozen recipients list
  let frozenRecipients: Array<{
    recipientUserId: string;
    fullName: string;
    email: string;
    role: string;
    alertTier: string;
  }> = [];

  try {
    frozenRecipients = JSON.parse(snapshot.frozenRecipients);
  } catch (e) {
    return {
      success: false,
      error: 'خطأ في قراءة بيانات المستلمين المجمدة',
      deliveredCount: 0,
      skippedCount: 0,
    };
  }

  if (!Array.isArray(frozenRecipients) || frozenRecipients.length === 0) {
    return {
      success: false,
      error: 'قائمة المستلمين المجمدة فارغة',
      deliveredCount: 0,
      skippedCount: 0,
    };
  }

  const now = new Date();
  let deliveredCount = 0;
  let skippedCount = 0;

  // Execute atomic distribution inside transaction
  await db.$transaction(async (tx: any) => {
    for (const recipient of frozenRecipients) {
      // Re-verify recipient user is still active in database
      const user = await tx.user.findUnique({
        where: { id: recipient.recipientUserId },
        select: { id: true, isActive: true, role: true },
      });

      if (!user || !user.isActive) {
        skippedCount++;
        continue;
      }

      const idempotencyKey = `disp_${snapshot.id}_${recipient.recipientUserId}`;

      // Check if already dispatched to prevent duplicates on retry
      const existingLog = await tx.alertDeliveryLog.findUnique({
        where: { idempotencyKey },
      });

      if (existingLog) {
        skippedCount++;
        continue;
      }

      // Upsert AlertRecipient
      await tx.alertRecipient.upsert({
        where: {
          alertId_recipientUserId: {
            alertId: alert.id,
            recipientUserId: recipient.recipientUserId,
          },
        },
        update: {
          alertTier: recipient.alertTier,
          isDispatched: true,
          dispatchedAt: now,
        },
        create: {
          alertId: alert.id,
          recipientUserId: recipient.recipientUserId,
          alertTier: recipient.alertTier,
          isDispatched: true,
          dispatchedAt: now,
        },
      });

      // Create Delivery Log
      await tx.alertDeliveryLog.create({
        data: {
          alertId: alert.id,
          recipientUserId: recipient.recipientUserId,
          channel: 'IN_APP_PORTAL',
          status: 'SUCCESS',
          idempotencyKey,
          deliveredAt: now,
        },
      });

      // Notification titles and summaries based strictly on recipient tier
      const isExecutiveTier = recipient.alertTier === 'EXECUTIVE_FLASH_SUMMARY';
      const notifTitle = isExecutiveTier
        ? `إحاطة تنفيذية موجزة: ${snapshot.executiveTitleAr || snapshot.titleAr}`
        : `تنبيه أمني تشغيلي: ${snapshot.titleAr}`;
      
      const notifMessage = isExecutiveTier
        ? `صدر ملخص تنسيقي تنفيذي موجز لمحافظة ${snapshot.targetGovernorate}. يرجى مراجعة التفاصيل.`
        : `صدرت إحاطة تشغيلية منقحة لمحافظة ${snapshot.targetGovernorate}. يرجى مراجعة الإرشادات التشغيلية.`;

      // Create In-App Notification (strictly internal)
      await tx.notification.create({
        data: {
          userId: recipient.recipientUserId,
          titleAr: notifTitle,
          titleEn: `Security Alert: ${snapshot.targetGovernorate}`,
          messageAr: notifMessage,
          messageEn: `A verified field alert has been published for ${snapshot.targetGovernorate}.`,
          type: alert.severity === 'CRITICAL_FLASH' ? 'ALERT' : 'WARNING',
          link: `/portal/alerts/${alert.id}`,
        },
      });

      deliveredCount++;
    }

    // Mark Alert as Dispatched
    await tx.incidentAlert.update({
      where: { id: alert.id },
      data: {
        dispatchedAt: now,
      },
    });

    // Update parent incident status to ALERT_DISPATCHED
    await tx.incident.update({
      where: { id: alert.incidentId },
      data: {
        status: 'ALERT_DISPATCHED',
      },
    });

    // Audit Log (zero sensitive narrative or coords)
    await tx.activityLog.create({
      data: {
        userId: dispatcherUserId,
        userName: 'SUPER_ADMIN',
        action: 'ALERT_DISPATCHED_INTERNAL',
        entityType: 'IncidentAlert',
        entityId: alert.id,
        details: `Alert ${alert.alertNumber} dispatched in-app to ${deliveredCount} active recipients (Snapshot v${snapshot.approvalVersion})`,
      },
    });
  });

  return {
    success: true,
    deliveredCount,
    skippedCount,
    dispatchedAt: now,
  };
}
