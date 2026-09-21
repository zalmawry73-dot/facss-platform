import crypto from 'crypto';
import prisma from '@/lib/prisma';

export interface SnapshotPayload {
  alertId: string;
  approvalVersion: number;
  titleAr: string;
  bodyAr: string;
  executiveTitleAr?: string | null;
  executiveSummaryAr?: string | null;
  movementAdviceAr?: string | null;
  severity: string;
  targetGovernorate: string;
  targetDistricts: string;
  isPrecautionary: boolean;
  approvedByUserId: string;
  approvedAt: string; // ISO string
  frozenRecipients: string; // Canonical JSON string
}

/**
 * Computes deterministic SHA-256 hash for immutable snapshot integrity.
 */
export function computeSnapshotHash(payload: SnapshotPayload): string {
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

/**
 * Verifies that a stored snapshot has not been tampered with.
 */
export function verifySnapshotIntegrity(snapshot: {
  alertId: string;
  approvalVersion: number;
  titleAr: string;
  bodyAr: string;
  executiveTitleAr?: string | null;
  executiveSummaryAr?: string | null;
  movementAdviceAr?: string | null;
  severity: string;
  targetGovernorate: string;
  targetDistricts: string;
  isPrecautionary: boolean;
  approvedByUserId: string;
  approvedAt: Date | string;
  snapshotHash: string;
  frozenRecipients: string;
}): boolean {
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

/**
 * Creates an immutable snapshot for an alert and approves it.
 * Strictly called by SUPER_ADMIN.
 */
export async function createAlertSnapshot(
  alertId: string,
  approverUserId: string,
  txPrisma?: any
): Promise<{ snapshot: any; alert: any }> {
  const db = txPrisma || prisma;

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

  // Filter and format frozen recipients (strictly active users)
  const frozenRecipientsList = alert.recipients
    .filter((r: any) => r.recipientUser && r.recipientUser.isActive)
    .map((r: any) => ({
      recipientUserId: r.recipientUserId,
      fullName: r.recipientUser.fullName,
      email: r.recipientUser.email,
      role: r.recipientUser.role,
      alertTier: r.alertTier,
    }))
    .sort((a: any, b: any) => a.recipientUserId.localeCompare(b.recipientUserId));

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

  // Create immutable snapshot record
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

  // Update alert status
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

/**
 * Invalidates alert approval when any content or recipients are modified.
 * Reverts status to DRAFT and unsets active snapshot.
 */
export async function invalidateAlertApproval(
  alertId: string,
  reason: string,
  actorId?: string,
  txPrisma?: any
): Promise<any> {
  const db = txPrisma || prisma;

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
