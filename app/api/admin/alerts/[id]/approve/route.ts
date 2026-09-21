import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ROLES } from '@/lib/rbac';
import { createAlertSnapshot } from '@/lib/security/alert-snapshot';
import { decryptIncidentOriginalPayload } from '@/lib/security/crypto';
import { validateAlertDraftInput } from '@/lib/validations/alerts';

interface RouteContext {
  params: { id: string };
}

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'غير مصرح: يلزم تسجيل الدخول' }, { status: 401 });
    }

    // Gate: Strictly SUPER_ADMIN only!
    if (session.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'غير مصرح: اعتماد التنبيهات الميدانية محصور بمسؤولي الإدارة العليا (SUPER_ADMIN) حصراً' },
        { status: 403 }
      );
    }

    const alert = await prisma.incidentAlert.findUnique({
      where: { id: params.id },
      include: {
        incident: {
          include: {
            redactedVersions: { where: { isApproved: true }, take: 1 },
            original: true,
          },
        },
        recipients: true,
      },
    });

    if (!alert) {
      return NextResponse.json({ error: 'التنبيه غير موجود' }, { status: 404 });
    }

    if (alert.dispatchedAt) {
      return NextResponse.json(
        { error: 'التنبيه تم اعتماده وإصداره مسبقاً' },
        { status: 400 }
      );
    }

    // Gate: Check approved redacted version
    if (!alert.incident.redactedVersions || alert.incident.redactedVersions.length === 0) {
      return NextResponse.json(
        { error: 'مرفوض أمنياً: لا يمكن اعتماد تنبيه لبلاغ لا يملك نسخة منقحة معتمدة' },
        { status: 400 }
      );
    }

    // Gate: Check at least 1 recipient
    if (!alert.recipients || alert.recipients.length === 0) {
      return NextResponse.json(
        { error: 'مرفوض: لا يمكن اعتماد تنبيه دون تحديد قائمة مستلمين مصرح لهم أولاً' },
        { status: 400 }
      );
    }

    // Run Anti-leakage Check
    let sensitiveContext = null;
    if (alert.incident.original) {
      try {
        sensitiveContext = decryptIncidentOriginalPayload(alert.incident.original);
      } catch (e) {
        // Safe fallback
      }
    }

    const validation = validateAlertDraftInput(
      {
        incidentId: alert.incidentId,
        severity: alert.severity,
        titleAr: alert.titleAr,
        titleEn: alert.titleEn,
        bodyAr: alert.bodyAr,
        bodyEn: alert.bodyEn,
        executiveTitleAr: alert.executiveTitleAr,
        executiveSummaryAr: alert.executiveSummaryAr,
        movementAdviceAr: alert.movementAdviceAr,
        movementAdviceEn: alert.movementAdviceEn,
        targetGovernorate: alert.targetGovernorate,
        targetDistricts: alert.targetDistricts,
        isPrecautionary: alert.isPrecautionary,
      },
      sensitiveContext
    );

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'فشل الفحص الأمني للاعتماد: تم رصد تعارض أو تسريب في نصوص التنبيه',
          validationErrors: validation.errors,
        },
        { status: 400 }
      );
    }

    // Create immutable snapshot and approve alert
    const { snapshot, alert: approvedAlert } = await createAlertSnapshot(alert.id, session.userId);

    // Audit log
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        userName: session.fullName,
        action: 'ALERT_SNAPSHOT_APPROVED',
        entityType: 'IncidentAlert',
        entityId: alert.id,
        details: `Alert ${alert.alertNumber} approved with snapshot v${snapshot.approvalVersion} (Hash: ${snapshot.snapshotHash.substring(0, 16)}...)`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم اعتماد التنبيه وتجميد اللقطة بنجاح',
      snapshot: {
        id: snapshot.id,
        approvalVersion: snapshot.approvalVersion,
        snapshotHash: snapshot.snapshotHash,
        approvedAt: snapshot.approvedAt,
      },
      alert: approvedAlert,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
