import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser(true);
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'غير مصرح: يلزم تسجيل الدخول' }, { status: 401 });
    }

    // Fetch dispatched alerts addressed to this user
    const recipientRecords = await prisma.alertRecipient.findMany({
      where: {
        recipientUserId: session.userId,
        isDispatched: true,
      },
      include: {
        alert: {
          select: {
            id: true,
            alertNumber: true,
            severity: true,
            titleAr: true,
            executiveTitleAr: true,
            targetGovernorate: true,
            dispatchedAt: true,
            isPrecautionary: true,
          },
        },
      },
      orderBy: { dispatchedAt: 'desc' },
    });

    const alerts = recipientRecords.map((r) => {
      const isExec = r.alertTier === 'EXECUTIVE_FLASH_SUMMARY';
      return {
        id: r.alert.id,
        alertNumber: r.alert.alertNumber,
        severity: r.alert.severity,
        title: isExec && r.alert.executiveTitleAr ? r.alert.executiveTitleAr : r.alert.titleAr,
        targetGovernorate: r.alert.targetGovernorate,
        dispatchedAt: r.dispatchedAt,
        alertTier: r.alertTier,
        isRead: Boolean(r.readAt),
        readAt: r.readAt,
        isPrecautionary: r.alert.isPrecautionary,
      };
    });

    return NextResponse.json({ alerts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
