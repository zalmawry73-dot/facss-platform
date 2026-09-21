const { verifySnapshotIntegrity } = require('../security/alert-snapshot');
const { ROLES } = require('../rbac');

async function dispatchAlertInternal(alertId, dispatcherUserId, dispatcherRole, txPrisma) {
  if (dispatcherRole !== ROLES.SUPER_ADMIN) {
    return {
      success: false,
      error: 'غير مصرح: إصدار وتوزيع التنبيهات محصور بمسؤولي الإدارة العليا (SUPER_ADMIN) حصراً',
      deliveredCount: 0,
      skippedCount: 0,
    };
  }

  const db = txPrisma;

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

  const snapshot = alert.snapshots.find((s) => s.id === alert.activeSnapshotId);
  if (!snapshot) {
    return {
      success: false,
      error: 'خطأ أمني: تعذر العثور على اللقطة المجمدة المعتمدة للتنبيه',
      deliveredCount: 0,
      skippedCount: 0,
    };
  }

  const isIntegrityValid = verifySnapshotIntegrity(snapshot);
  if (!isIntegrityValid) {
    return {
      success: false,
      error: 'فشل فحص السلامة المشفرة: تم اكتشاف تلاعب أو تلف في بيانات اللقطة المعتمدة (Snapshot Tamper Detected)',
      deliveredCount: 0,
      skippedCount: 0,
    };
  }

  let frozenRecipients = [];
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

  await db.$transaction(async (tx) => {
    for (const recipient of frozenRecipients) {
      const user = await tx.user.findUnique({
        where: { id: recipient.recipientUserId },
        select: { id: true, isActive: true, role: true },
      });

      if (!user || !user.isActive) {
        skippedCount++;
        continue;
      }

      const idempotencyKey = `disp_${snapshot.id}_${recipient.recipientUserId}`;

      const existingLog = await tx.alertDeliveryLog.findUnique({
        where: { idempotencyKey },
      });

      if (existingLog) {
        skippedCount++;
        continue;
      }

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

      const isExecutiveTier = recipient.alertTier === 'EXECUTIVE_FLASH_SUMMARY';
      const notifTitle = isExecutiveTier
        ? `إحاطة تنفيذية موجزة: ${snapshot.executiveTitleAr || snapshot.titleAr}`
        : `تنبيه أمني تشغيلي: ${snapshot.titleAr}`;
      
      const notifMessage = isExecutiveTier
        ? `صدر ملخص تنسيقي تنفيذي موجز لمحافظة ${snapshot.targetGovernorate}. يرجى مراجعة التفاصيل.`
        : `صدرت إحاطة تشغيلية منقحة لمحافظة ${snapshot.targetGovernorate}. يرجى مراجعة الإرشادات التشغيلية.`;

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

    await tx.incidentAlert.update({
      where: { id: alert.id },
      data: {
        dispatchedAt: now,
      },
    });

    await tx.incident.update({
      where: { id: alert.incidentId },
      data: {
        status: 'ALERT_DISPATCHED',
      },
    });

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

module.exports = {
  dispatchAlertInternal,
};
