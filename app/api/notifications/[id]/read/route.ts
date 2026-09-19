import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUser(true);
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'غير مصرح به - يرجى تسجيل الدخول' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'معرف الإشعار مطلوب' }, { status: 400 });
    }

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json({ error: 'الإشعار غير موجود' }, { status: 404 });
    }

    // Anti-IDOR: Check that the notification belongs to the authenticated user
    if (notification.userId !== session.userId) {
      return NextResponse.json({ error: 'غير مصرح بالوصول لهذا الإشعار' }, { status: 403 });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({
      success: true,
      notification: updated,
    });
  } catch (error) {
    console.error('[API] PATCH /api/notifications/[id]/read error:', error);
    return NextResponse.json({ error: 'فشل في تحديث حالة الإشعار' }, { status: 500 });
  }
}
