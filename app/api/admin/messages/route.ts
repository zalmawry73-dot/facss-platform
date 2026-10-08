import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_MESSAGES);
    if (!gate.authorized) return gate.response!;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const messageType = searchParams.get('type'); // 'ALL' | 'GENERAL_INQUIRY' | 'COMPLAINT'

    const where: any = {};
    if (status && ['UNREAD', 'READ', 'IN_PROGRESS', 'RESOLVED', 'REPLIED', 'ARCHIVED'].includes(status)) {
      where.status = status;
    }
    if (messageType && ['GENERAL_INQUIRY', 'COMPLAINT'].includes(messageType)) {
      where.messageType = messageType;
    }

    const { getSlaConfig, calculateComplaintSlaStatus } = await import('@/lib/sla-engine');
    const slaConfig = await getSlaConfig();
    const now = new Date();

    const rawMessages = await prisma.contactMessage.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const messages = rawMessages.map((m) => {
      let slaDetails = null;
      if (m.messageType === 'COMPLAINT') {
        slaDetails = calculateComplaintSlaStatus(m, slaConfig, now);
      }
      return {
        ...m,
        slaDetails,
      };
    });

    const [unreadCount, readCount, inProgressCount, resolvedCount, repliedCount, archivedCount, complaintsCount, inquiriesCount] = await Promise.all([
      prisma.contactMessage.count({ where: { status: 'UNREAD' } }),
      prisma.contactMessage.count({ where: { status: 'READ' } }),
      prisma.contactMessage.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.contactMessage.count({ where: { status: 'RESOLVED' } }),
      prisma.contactMessage.count({ where: { status: 'REPLIED' } }),
      prisma.contactMessage.count({ where: { status: 'ARCHIVED' } }),
      prisma.contactMessage.count({ where: { messageType: 'COMPLAINT' } }),
      prisma.contactMessage.count({ where: { messageType: 'GENERAL_INQUIRY' } }),
    ]);

    return NextResponse.json({
      success: true,
      messages,
      counts: {
        total: rawMessages.length,
        unread: unreadCount,
        read: readCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        replied: repliedCount,
        archived: archivedCount,
        complaints: complaintsCount,
        inquiries: inquiriesCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
