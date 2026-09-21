import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ROLES, isStaffRole } from '@/lib/rbac';
import { validateAlertDraftInput } from '@/lib/validations/alerts';
import { decryptIncidentOriginalPayload } from '@/lib/security/crypto';
import { invalidateAlertApproval } from '@/lib/security/alert-snapshot';

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

    if (!isStaffRole(session.role)) {
      return NextResponse.json({ error: 'غير مصرح: الوصول محصور بالكوادر الإدارية' }, { status: 403 });
    }

    const alert = await prisma.incidentAlert.findUnique({
      where: { id: params.id },
      include: {
        incident: {
          include: {
            redactedVersions: { where: { isApproved: true }, take: 1 },
            verifications: {
              include: { verifiedBy: { select: { fullName: true } } },
              orderBy: { verifiedAt: 'desc' },
            },
          },
        },
        snapshots: {
          orderBy: { approvalVersion: 'desc' },
        },
        recipients: {
          include: {
            recipientUser: {
              select: { id: true, fullName: true, email: true, role: true, isActive: true },
            },
          },
        },
        deliveryLogs: {
          include: {
            recipientUser: { select: { fullName: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!alert) {
      return NextResponse.json({ error: 'التنبيه غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ alert });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'غير مصرح: يلزم تسجيل الدخول' }, { status: 401 });
    }

    const isSuperAdmin = session.role === ROLES.SUPER_ADMIN;

    const existingAlert = await prisma.incidentAlert.findUnique({
      where: { id: params.id },
      include: { incident: { select: { id: true } } },
    });

    if (!existingAlert) {
      return NextResponse.json({ error: 'التنبيه غير موجود' }, { status: 404 });
    }

    if (existingAlert.dispatchedAt) {
      return NextResponse.json(
        { error: 'لا يمكن تعديل تنبيه تم إصداره وتوزيعه بالفعل' },
        { status: 400 }
      );
    }

    // Fetch original to run anti-leakage check
    const originalRecord = await prisma.incidentOriginal.findUnique({
      where: { incidentId: existingAlert.incidentId },
    });

    let sensitiveContext = null;
    if (originalRecord) {
      try {
        sensitiveContext = decryptIncidentOriginalPayload(originalRecord);
      } catch (e) {
        // Safe fallback
      }
    }

    const body = await request.json();
    body.incidentId = existingAlert.incidentId;

    const validation = validateAlertDraftInput(body, sensitiveContext);
    if (!validation.isValid || !validation.sanitizedData) {
      return NextResponse.json(
        { error: 'فشل التحقق من مدخلات التنبيه', validationErrors: validation.errors },
        { status: 400 }
      );
    }

    const data = validation.sanitizedData;

    // Invalidate approval if it was approved: any modification reverts status to DRAFT!
    const wasApproved = existingAlert.approvalStatus === 'APPROVED';

    const updatedAlert = await prisma.incidentAlert.update({
      where: { id: params.id },
      data: {
        severity: data.severity,
        titleAr: data.titleAr,
        titleEn: data.titleEn,
        bodyAr: data.bodyAr,
        bodyEn: data.bodyEn,
        executiveTitleAr: data.executiveTitleAr,
        executiveSummaryAr: data.executiveSummaryAr,
        movementAdviceAr: data.movementAdviceAr,
        movementAdviceEn: data.movementAdviceEn,
        targetGovernorate: data.targetGovernorate,
        targetDistricts: JSON.stringify(data.targetDistricts),
        isPrecautionary: data.isPrecautionary,
        approvalStatus: 'DRAFT', // Always reverts to DRAFT on edit
        activeSnapshotId: null,
        approvedByUserId: null,
        approvedAt: null,
      },
    });

    // Audit log
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        userName: session.fullName,
        action: wasApproved ? 'ALERT_APPROVAL_REVOKED_BY_EDIT' : 'ALERT_DRAFT_UPDATED',
        entityType: 'IncidentAlert',
        entityId: params.id,
        details: wasApproved
          ? 'Alert was modified after approval; reverted approval to DRAFT'
          : 'Alert draft updated',
      },
    });

    return NextResponse.json({
      success: true,
      alert: updatedAlert,
      notice: wasApproved ? 'تم إبطال اعتماد التنبيه وإعادته إلى مسودة بسبب التعديل' : undefined,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    if (!session || session.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ error: 'غير مصرح: الحذف محصور بالمدير الأعلى (SUPER_ADMIN)' }, { status: 403 });
    }

    const alert = await prisma.incidentAlert.findUnique({
      where: { id: params.id },
    });

    if (!alert) {
      return NextResponse.json({ error: 'التنبيه غير موجود' }, { status: 404 });
    }

    if (alert.dispatchedAt) {
      return NextResponse.json(
        { error: 'لا يمكن حذف تنبيه تم إصداره وتوزيعه مسبقاً' },
        { status: 400 }
      );
    }

    await prisma.incidentAlert.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'تم حذف مسودة التنبيه بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
