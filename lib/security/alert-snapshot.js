const crypto = require('crypto');

function computeSnapshotHash(payload) {
  const canonicalString = JSON.stringify({
    alertId: payload.alertId,
    approvalVersion: payload.approvalVersion,
    titleAr: payload.titleAr.trim(),
    bodyAr: payload.bodyAr.trim(),
    executiveTitleAr: (payload.executiveTitleAr || '').trim(),
    executiveSummaryAr: (payload.executiveSummaryAr || '').trim(),
    movementAdviceAr: (payload.movementAdviceAr || '').trim(),
    severity: payload.severity,
    targetGovernorate: payload.targetGovernorate.trim(),
    targetDistricts: payload.targetDistricts,
    isPrecautionary: Boolean(payload.isPrecautionary),
    approvedByUserId: payload.approvedByUserId,
    approvedAt: payload.approvedAt,
    frozenRecipients: payload.frozenRecipients,
  });

  return crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');
}

function verifySnapshotIntegrity(snapshot) {
  const approvedAtIso = snapshot.approvedAt instanceof Date 
    ? snapshot.approvedAt.toISOString() 
    : new Date(snapshot.approvedAt).toISOString();

  const expectedHash = computeSnapshotHash({
    alertId: snapshot.alertId,
    approvalVersion: snapshot.approvalVersion,
    titleAr: snapshot.titleAr,
    bodyAr: snapshot.bodyAr,
    executiveTitleAr: snapshot.executiveTitleAr,
    executiveSummaryAr: snapshot.executiveSummaryAr,
    movementAdviceAr: snapshot.movementAdviceAr,
    severity: snapshot.severity,
    targetGovernorate: snapshot.targetGovernorate,
    targetDistricts: snapshot.targetDistricts,
    isPrecautionary: snapshot.isPrecautionary,
    approvedByUserId: snapshot.approvedByUserId,
    approvedAt: approvedAtIso,
    frozenRecipients: snapshot.frozenRecipients,
  });

  return expectedHash === snapshot.snapshotHash;
}

async function createAlertSnapshot(alertId, approverUserId, txPrisma) {
  const db = txPrisma;

  const alert = await db.incidentAlert.findUnique({
    where: { id: alertId },
    include: {
      recipients: {
        include: {
          recipientUser: {
            select: { id: true, fullName: true, email: true, role: true, isActive: true },
          },
        },
      },
    },
  });

  if (!alert) {
    throw new Error('التنبيه غير موجود');
  }

  if (!alert.recipients || alert.recipients.length === 0) {
    throw new Error('لا يمكن اعتماد التنبيه دون تحديد قائمة مستلمين معتمدة');
  }

  const frozenRecipientsList = alert.recipients
    .filter((r) => r.recipientUser && r.recipientUser.isActive)
    .map((r) => ({
      recipientUserId: r.recipientUserId,
      fullName: r.recipientUser.fullName,
      email: r.recipientUser.email,
      role: r.recipientUser.role,
      alertTier: r.alertTier,
    }))
    .sort((a, b) => a.recipientUserId.localeCompare(b.recipientUserId));

  if (frozenRecipientsList.length === 0) {
    throw new Error('جميع المستلمين المحددين غير نشطين أو معطلين');
  }

  const frozenRecipientsJson = JSON.stringify(frozenRecipientsList);
  const nextVersion = alert.currentVersion + 1;
  const approvedAtDate = new Date();
  const approvedAtIso = approvedAtDate.toISOString();

  const hash = computeSnapshotHash({
    alertId: alert.id,
    approvalVersion: nextVersion,
    titleAr: alert.titleAr,
    bodyAr: alert.bodyAr,
    executiveTitleAr: alert.executiveTitleAr,
    executiveSummaryAr: alert.executiveSummaryAr,
    movementAdviceAr: alert.movementAdviceAr,
    severity: alert.severity,
    targetGovernorate: alert.targetGovernorate,
    targetDistricts: alert.targetDistricts,
    isPrecautionary: alert.isPrecautionary,
    approvedByUserId: approverUserId,
    approvedAt: approvedAtIso,
    frozenRecipients: frozenRecipientsJson,
  });

  const snapshot = await db.alertSnapshot.create({
    data: {
      alertId: alert.id,
      approvalVersion: nextVersion,
      titleAr: alert.titleAr,
      titleEn: alert.titleEn,
      bodyAr: alert.bodyAr,
      bodyEn: alert.bodyEn,
      executiveTitleAr: alert.executiveTitleAr,
      executiveSummaryAr: alert.executiveSummaryAr,
      movementAdviceAr: alert.movementAdviceAr,
      movementAdviceEn: alert.movementAdviceEn,
      severity: alert.severity,
      targetGovernorate: alert.targetGovernorate,
      targetDistricts: alert.targetDistricts,
      isPrecautionary: alert.isPrecautionary,
      approvedByUserId: approverUserId,
      approvedAt: approvedAtDate,
      snapshotHash: hash,
      frozenRecipients: frozenRecipientsJson,
    },
  });

  const updatedAlert = await db.incidentAlert.update({
    where: { id: alert.id },
    data: {
      approvalStatus: 'APPROVED',
      activeSnapshotId: snapshot.id,
      currentVersion: nextVersion,
      approvedByUserId: approverUserId,
      approvedAt: approvedAtDate,
    },
  });

  return { snapshot, alert: updatedAlert };
}

async function invalidateAlertApproval(alertId, reason, actorId, txPrisma) {
  const db = txPrisma;

  return db.incidentAlert.update({
    where: { id: alertId },
    data: {
      approvalStatus: 'DRAFT',
      activeSnapshotId: null,
      approvedByUserId: null,
      approvedAt: null,
    },
  });
}

module.exports = {
  computeSnapshotHash,
  verifySnapshotIntegrity,
  createAlertSnapshot,
  invalidateAlertApproval,
};
