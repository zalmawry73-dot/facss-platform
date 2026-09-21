import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ROLES } from '@/lib/rbac';
import { validateRedactedVersionInput } from '@/lib/validations/incidents';
import { decryptIncidentOriginalPayload } from '@/lib/security/crypto';
import { logActivity } from '@/lib/audit';

interface RouteContext {
  params: { id: string };
}

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    if (!session || session.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'صلاحيات غير كافية: إعداد واعتماد النسخ المنقحة محصور بالإدارة العليا (SUPER_ADMIN) حصراً' },
        { status: 403 }
      );
    }

    const incident = await prisma.incident.findUnique({
      where: { id: params.id },
      include: {
        original: true,
        redactedVersions: { orderBy: { versionNumber: 'desc' }, take: 1 },
      },
    });

    if (!incident) {
      return NextResponse.json({ error: 'البلاغ غير موجود' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));

    // In-memory anti-leakage context
    let originalContext: { sourceName?: string | null; sourcePhone?: string | null } | undefined = undefined;
    if (incident.original) {
      const decrypted = decryptIncidentOriginalPayload({
        sourceType: incident.original.sourceType,
        sourceNameEnc: incident.original.sourceNameEnc,
        sourcePhoneEnc: incident.original.sourcePhoneEnc,
        sourceOrgEnc: incident.original.sourceOrgEnc,
        rawDescriptionEnc: incident.original.rawDescriptionEnc,
        exactLocationEnc: incident.original.exactLocationEnc,
        exactLatEnc: incident.original.exactLatEnc,
        exactLngEnc: incident.original.exactLngEnc,
        initialRiskNotesEnc: incident.original.initialRiskNotesEnc,
      });
      originalContext = {
        sourceName: decrypted.sourceName,
        sourcePhone: decrypted.sourceContactPhone,
      };
    }

    const validation = validateRedactedVersionInput(body, originalContext);
    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات النسخة المنقحة غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const input = validation.data;
    const nextVersionNumber = incident.redactedVersions.length > 0 ? incident.redactedVersions[0].versionNumber + 1 : 1;

    const newRedacted = await prisma.$transaction(async (tx) => {
      // Mark all existing versions as not current
      await tx.incidentRedacted.updateMany({
        where: { incidentId: params.id },
        data: { isCurrent: false },
      });

      const created = await tx.incidentRedacted.create({
        data: {
          incidentId: params.id,
          versionNumber: nextVersionNumber,
          redactedTitleAr: input.redactedTitleAr,
          redactedTitleEn: input.redactedTitleEn,
          redactedDescAr: input.redactedDescAr,
          redactedDescEn: input.redactedDescEn,
          safeAreaScopeAr: input.safeAreaScopeAr,
          safeAreaScopeEn: input.safeAreaScopeEn,
          immediateImpact: input.immediateImpact,
          safetyAdvisory: input.safetyAdvisory,
          approvedByUserId: session.userId,
          isApproved: input.isApproved ?? true,
          isCurrent: true,
        },
      });

      // Update incident status if currently RECEIVED or TRIAGED
      if (['RECEIVED', 'TRIAGED'].includes(incident.status)) {
        await tx.incident.update({
          where: { id: params.id },
          data: { status: 'REDACTED' },
        });
      }

      return created;
    });

    await logActivity({
      userId: session.userId,
      userName: session.fullName,
      action: 'CREATE_REDACTED_VERSION',
      entityType: 'IncidentRedacted',
      entityId: newRedacted.id,
      details: `إنشاء واعتماد النسخة المنقحة v${newRedacted.versionNumber} للبلاغ [${incident.incidentNumber}]`,
    });

    return NextResponse.json({
      success: true,
      message: 'تم حفظ واعتماد النسخة المنقحة بنجاح',
      redacted: newRedacted,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    if (!session || session.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'اعتماد النسخ المنقحة محصور بالإدارة العليا (SUPER_ADMIN) حصراً' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { redactedId, isApproved } = body;

    if (!redactedId || typeof isApproved !== 'boolean') {
      return NextResponse.json({ error: 'معرّف النسخة وحالة الاعتماد مطلوبة' }, { status: 400 });
    }

    const updated = await prisma.incidentRedacted.update({
      where: { id: redactedId },
      data: {
        isApproved,
        approvedByUserId: session.userId,
      },
    });

    return NextResponse.json({ success: true, redacted: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
