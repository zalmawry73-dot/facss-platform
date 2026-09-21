import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ROLES, isStaffRole } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser(true);
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'غير مصرح: يلزم تسجيل الدخول' }, { status: 401 });
    }

    if (!isStaffRole(session.role)) {
      return NextResponse.json({ error: 'غير مصرح: الوصول محصور بالكوادر الإدارية' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity');
    const approvalStatus = searchParams.get('approvalStatus');
    const governorate = searchParams.get('governorate');

    const where: any = {};
    if (severity) where.severity = severity;
    if (approvalStatus) where.approvalStatus = approvalStatus;
    if (governorate) where.targetGovernorate = { contains: governorate, mode: 'insensitive' };

    const alerts = await prisma.incidentAlert.findMany({
      where,
      include: {
        incident: {
          select: {
            id: true,
            incidentNumber: true,
            status: true,
            category: true,
            governorate: true,
            district: true,
          },
        },
        snapshots: {
          select: { id: true, approvalVersion: true, approvedAt: true, snapshotHash: true },
        },
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
