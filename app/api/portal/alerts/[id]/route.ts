import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ROLES } from '@/lib/rbac';

interface RouteContext {
  params: { id: string };
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'غير مصرح: يلزم تسجيل الدخول' }, { status: 401 });
    }

    const isSuperAdmin = session.role === ROLES.SUPER_ADMIN;

    // Check recipient authorization record
    const recipientRecord = await prisma.alertRecipient.findUnique({
      where: {
        alertId_recipientUserId: {
          alertId: params.id,
          recipientUserId: session.userId,
        },
      },
    });

    if (!recipientRecord && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'غير مصرح: هذا التنبيه غير موجه إلى حسابك أو تم سحب تصريحك' },
        { status: 403 }
      );
    }

    const alert = await prisma.incidentAlert.findUnique({
      where: { id: params.id },
      include: {
        snapshots: true,
      },
    });

    if (!alert || !alert.dispatchedAt) {
      return NextResponse.json({ error: 'التنبيه غير متاح أو لم يتم إصداره بعد' }, { status: 404 });
    }

    const snapshot = alert.snapshots.find((s) => s.id === alert.activeSnapshotId) || alert.snapshots[0];
    if (!snapshot) {
      return NextResponse.json({ error: 'تعذر العثور على محتوى التنبيه المعتمد' }, { status: 404 });
    }

    // Determine authorized tier
    const userTier = recipientRecord
      ? recipientRecord.alertTier
      : 'REDACTED_OPERATIONAL_BRIEFING'; // Fallback for SUPER_ADMIN preview

    // Strictly send ONLY the authorized tier's content!
    const isExecutive = userTier === 'EXECUTIVE_FLASH_SUMMARY';

    const payload = {
      id: alert.id,
      alertNumber: alert.alertNumber,
      severity: alert.severity,
      title: isExecutive && snapshot.executiveTitleAr ? snapshot.executiveTitleAr : snapshot.titleAr,
      body: isExecutive ? snapshot.executiveSummaryAr : snapshot.bodyAr,
      movementAdvice: snapshot.movementAdviceAr,
      targetGovernorate: snapshot.targetGovernorate,
      targetDistricts: snapshot.targetDistricts,
      isPrecautionary: snapshot.isPrecautionary,
      dispatchedAt: alert.dispatchedAt,
      assignedTier: userTier,
      snapshotVersion: snapshot.approvalVersion,
    };

    // Update read timestamp if regular recipient
    if (recipientRecord && !recipientRecord.readAt) {
      const now = new Date();
      await prisma.alertRecipient.update({
        where: { id: recipientRecord.id },
        data: { readAt: now },
      });

      await prisma.alertDeliveryLog.updateMany({
        where: {
          alertId: alert.id,
          recipientUserId: session.userId,
        },
        data: { readAt: now },
      });
    }

    return NextResponse.json({ alert: payload });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
