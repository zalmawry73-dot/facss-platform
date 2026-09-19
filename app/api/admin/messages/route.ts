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

    const where: any = {};
    if (status && ['UNREAD', 'READ', 'REPLIED', 'ARCHIVED'].includes(status)) {
      where.status = status;
    }

    const messages = await prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const [unreadCount, readCount, repliedCount, archivedCount] = await Promise.all([
      prisma.contactMessage.count({ where: { status: 'UNREAD' } }),
      prisma.contactMessage.count({ where: { status: 'READ' } }),
      prisma.contactMessage.count({ where: { status: 'REPLIED' } }),
      prisma.contactMessage.count({ where: { status: 'ARCHIVED' } }),
    ]);

    return NextResponse.json({
      success: true,
      messages,
      counts: {
        total: messages.length,
        unread: unreadCount,
        read: readCount,
        replied: repliedCount,
        archived: archivedCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
