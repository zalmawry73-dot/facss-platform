import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ROLES, CAPABILITIES, hasCapability } from '@/lib/rbac';
import { validateAlertDraftInput } from '@/lib/validations/alerts';
import { decryptIncidentOriginalPayload } from '@/lib/security/crypto';

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

    // Gate: Check staff assignment if not SUPER_ADMIN
    if (!isSuperAdmin) {
      const assignment = await prisma.incidentAssignment.findFirst({
        where: {
          incidentId: params.id,
          assignedToUserId: session.userId,
          isActive: true,
        },
      });
      if (!assignment) {
        return NextResponse.json(
          { error: 'غير مصرح: لا تملك إسناداً نشطاً للبلاغ للاطلاع على مسودات تنبيهاته' },
          { status: 403 }
        );
      }
    }

    const alerts = await prisma.incidentAlert.findMany({
      where: { incidentId: params.id },
      include: {
        snapshots: { select: { id: true, approvalVersion: true, approvedAt: true, snapshotHash: true } },
        recipients: {
          include: {
            recipientUser: { select: { id: true, fullName: true, email: true, role: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ alerts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'غير مصرح: يلزم تسجيل الدخول' }, { status: 401 });
    }

    const isSuperAdmin = session.role === ROLES.SUPER_ADMIN;

    // Gate 1: Check draft_incident_alert capability and assignment if not SUPER_ADMIN
    if (!isSuperAdmin) {
      const canDraft = await hasCapability(session, CAPABILITIES.DRAFT_INCIDENT_ALERT);
      if (!canDraft) {
        return NextResponse.json(
          { error: 'غير مصرح: لا تملك صلاحية إعداد مسودات التنبيهات الميدانية (draft_incident_alert)' },
          { status: 403 }
        );
      }

      const assignment = await prisma.incidentAssignment.findFirst({
        where: {
          incidentId: params.id,
          assignedToUserId: session.userId,
          isActive: true,
        },
      });
      if (!assignment) {
        return NextResponse.json(
          { error: 'غير مصرح: يلزم وجود إسناد نشط للبلاغ ذاته لإعداد مسودة تنبيه عنه' },
          { status: 403 }
        );
      }
    }

    // Gate 2: The incident MUST have an approved redacted version!
    const approvedRedacted = await prisma.incidentRedacted.findFirst({
      where: {
        incidentId: params.id,
        isApproved: true,
      },
    });

    if (!approvedRedacted) {
      return NextResponse.json(
        { error: 'مرفوض أمنياً: لا يمكن إعداد تنبيه لبلاغ لا يملك نسخة منقحة معتمدة صراحة من الإدارة العليا' },
        { status: 400 }
      );
    }

    // Fetch original to run in-memory anti-leakage check
    const originalRecord = await prisma.incidentOriginal.findUnique({
      where: { incidentId: params.id },
    });

    let sensitiveContext = null;
    if (originalRecord) {
      try {
        sensitiveContext = decryptIncidentOriginalPayload(originalRecord);
      } catch (e) {
        // Handled safely
      }
    }

    const body = await request.json();
    body.incidentId = params.id;

    const validation = validateAlertDraftInput(body, sensitiveContext);
    if (!validation.isValid || !validation.sanitizedData) {
      return NextResponse.json(
        { error: 'فشل التحقق من بيانات التنبيه', validationErrors: validation.errors },
        { status: 400 }
      );
    }

    const data = validation.sanitizedData;

    // Generate Alert Number
    const year = new Date().getFullYear();
    const count = await prisma.incidentAlert.count();
    const alertNumber = `FACSS-ALT-${year}-${String(count + 1).padStart(4, '0')}`;

    const newAlert = await prisma.incidentAlert.create({
      data: {
        alertNumber,
        incidentId: params.id,
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
        draftedByUserId: session.userId,
        approvalStatus: 'DRAFT',
      },
    });

    // Audit log
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        userName: session.fullName,
        action: 'ALERT_DRAFT_CREATED',
        entityType: 'IncidentAlert',
        entityId: newAlert.id,
        details: `Alert draft ${alertNumber} created for incident ${params.id}`,
      },
    });

    return NextResponse.json({ success: true, alert: newAlert }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
