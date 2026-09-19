import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser(true);
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'غير مصرح به - يرجى تسجيل الدخول' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10) || 10));
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const whereClause: any = {
      userId: session.userId,
    };

    if (unreadOnly) {
      whereClause.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.notification.count({
      where: whereClause,
    });

    const unreadCount = unreadOnly
      ? total
      : await prisma.notification.count({
          where: {
            userId: session.userId,
            isRead: false,
          },
        });

    return NextResponse.json({
      notifications,
      unreadCount,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    console.error('[API] GET /api/notifications error:', error);
    return NextResponse.json({ error: 'فشل في استرجاع الإشعارات' }, { status: 500 });
  }
}
