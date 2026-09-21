import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { extractSanitizedIncidentData } from '@/lib/risk-engine';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/admin/incidents/[id]/risk-preview
 * Safely extracts sanitized operational incident data to preview / populate a new risk form.
 * Protected by MANAGE_RISK_REGISTER capability.
 * Strictly guarantees that no encrypted original, source info, or raw coordinates are exposed.
 */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_RISK_REGISTER);
    if (!gate.authorized) return gate.response!;

    const incident = await prisma.incident.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        incidentNumber: true,
        category: true,
        priority: true,
        status: true,
        governorate: true,
        district: true,
        incidentDate: true,
        verifications: {
          select: {
            id: true,
            admiraltyCode: true,
            verifiedAt: true,
          },
        },
        redactedVersions: {
          where: { isCurrent: true },
          select: {
            redactedTitleAr: true,
            redactedTitleEn: true,
            redactedDescAr: true,
            redactedDescEn: true,
            safeAreaScopeAr: true,
            immediateImpact: true,
            safetyAdvisory: true,
          },
        },
      },
    });

    if (!incident) {
      return NextResponse.json({ error: 'البلاغ الميداني غير موجود' }, { status: 404 });
    }

    const isVerified =
      incident.status === 'VERIFIED' ||
      incident.status === 'ALERT_DRAFTED' ||
      incident.status === 'ALERT_APPROVED' ||
      incident.status === 'ALERT_DISPATCHED' ||
      incident.verifications.length > 0;

    if (!isVerified) {
      return NextResponse.json(
        {
          error:
            'لا يمكن إنشاء قيد خطر من بلاغ لم يخضع للتحقق والاعتماد الميداني. حالة البلاغ الحالية: ' +
            incident.status,
        },
        { status: 400 }
      );
    }

    const sanitizedData = extractSanitizedIncidentData(incident);

    return NextResponse.json({
      success: true,
      data: sanitizedData,
    });
  } catch (error: any) {
    console.error('Error extracting sanitized incident for risk preview:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
