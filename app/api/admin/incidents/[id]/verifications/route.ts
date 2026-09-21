import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ROLES, canAccessRedactedIncident } from '@/lib/rbac';
import { validateVerificationInput } from '@/lib/validations/incidents';
import { logActivity } from '@/lib/audit';

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

    const isSuperAdmin = session.role === ROLES.SUPER_ADMIN;

    // Triple-Gate verification check for staff
    if (!isSuperAdmin) {
      const gate = await canAccessRedactedIncident(session, params.id);
      if (!gate.authorized) {
        return NextResponse.json(
          { error: gate.error || 'غير مصرح: لا تملك إسناداً نشطاً أو صلاحية معتمدة لتوثيق التحقق من هذا البلاغ' },
          { status: gate.status || 403 }
        );
      }
    }

    const incident = await prisma.incident.findUnique({
      where: { id: params.id },
      select: { id: true, incidentNumber: true, status: true },
    });

    if (!incident) {
      return NextResponse.json({ error: 'البلاغ غير موجود' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const validation = validateVerificationInput(body);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات التحقق غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const input = validation.data;
    const admiraltyCode = `${input.sourceReliability}${input.infoCredibility}`;

    const verification = await prisma.$transaction(async (tx) => {
      const created = await tx.incidentVerification.create({
        data: {
          incidentId: params.id,
          verifiedByUserId: session.userId,
          sourceReliability: input.sourceReliability,
          infoCredibility: input.infoCredibility,
          admiraltyCode,
          verificationMethod: input.verificationMethod,
          verificationSummary: input.verificationSummary,
          corroboratingCount: input.corroboratingCount || 1,
          contradictionsFound: input.contradictionsFound || false,
          contradictionNotes: input.contradictionNotes || null,
        },
        include: {
          verifiedBy: { select: { id: true, fullName: true, role: true } },
        },
      });

      // Update incident status to recommended status or UNDER_VERIFICATION
      if (input.recommendedStatus) {
        await tx.incident.update({
          where: { id: params.id },
          data: { status: input.recommendedStatus as any },
        });
      } else if (incident.status === 'ASSIGNED') {
        await tx.incident.update({
          where: { id: params.id },
          data: { status: 'UNDER_VERIFICATION' },
        });
      }

      return created;
    });

    await logActivity({
      userId: session.userId,
      userName: session.fullName,
      action: 'SUBMIT_INCIDENT_VERIFICATION',
      entityType: 'IncidentVerification',
      entityId: verification.id,
      details: `توثيق تحقق أدميرالتي [${admiraltyCode}] للبلاغ [${incident.incidentNumber}] وتحديث الحالة إلى [${input.recommendedStatus || 'UNDER_VERIFICATION'}]`,
    });

    return NextResponse.json(
      {
        success: true,
        message: `تم توثيق التحقق بمعيار أدميرالتي (${admiraltyCode}) وتحديث حالة البلاغ بنجاح`,
        verification,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
