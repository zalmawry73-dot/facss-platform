import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser(true);
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'غير مصرح به - يرجى تسجيل الدخول' }, { status: 401 });
    }

    const result = await prisma.notification.updateMany({
      where: {
        userId: session.userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({
      success: true,
      count: result.count,
    });
  } catch (error) {
    console.error('[API] POST /api/notifications/read-all error:', error);
    return NextResponse.json({ error: 'فشل في تحديث حالة جميع الإشعارات' }, { status: 500 });
  }
}
