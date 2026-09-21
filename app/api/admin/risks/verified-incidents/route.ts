import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';

/**
 * GET /api/admin/risks/verified-incidents
 * Returns a list of verified incidents (sanitized summary only) that are eligible to be linked to risks.
 * Protected by MANAGE_RISK_REGISTER capability.
 * Strictly guarantees that no sensitive original data or source identity is returned.
 */
export async function GET(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_RISK_REGISTER);
    if (!gate.authorized) return gate.response!;

    const incidents = await prisma.incident.findMany({
      where: {
        OR: [
          { status: 'VERIFIED' },
          { status: 'ALERT_DRAFTED' },
          { status: 'ALERT_APPROVED' },
          { status: 'ALERT_DISPATCHED' },
          { verifications: { some: {} } },
        ],
      },
      orderBy: { incidentDate: 'desc' },
      take: 50,
      select: {
        id: true,
        incidentNumber: true,
        category: true,
        priority: true,
        status: true,
        governorate: true,
        district: true,
        incidentDate: true,
        redactedVersions: {
          where: { isCurrent: true },
          select: {
            redactedTitleAr: true,
            redactedTitleEn: true,
            safeAreaScopeAr: true,
          },
        },
      },
    });

    const sanitizedList = incidents.map((inc) => ({
      id: inc.id,
      incidentNumber: inc.incidentNumber,
      category: inc.category,
      priority: inc.priority,
      status: inc.status,
      governorate: inc.governorate,
      district: inc.district,
      incidentDate: inc.incidentDate,
      title: inc.redactedVersions[0]?.redactedTitleAr || `بلاغ رقم ${inc.incidentNumber}`,
      safeArea: inc.redactedVersions[0]?.safeAreaScopeAr || inc.district || inc.governorate,
    }));

    return NextResponse.json({ success: true, incidents: sanitizedList });
  } catch (error: any) {
    console.error('Error fetching verified incidents for risk linking:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
