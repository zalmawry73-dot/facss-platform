import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { ROLES } from '@/lib/rbac';
import { dispatchAlertInternal } from '@/lib/alerts/dispatch-engine';

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

    if (session.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'غير مصرح: إصدار وتوزيع التنبيهات محصور بمسؤولي الإدارة العليا (SUPER_ADMIN) حصراً' },
        { status: 403 }
      );
    }

    const result = await dispatchAlertInternal(params.id, session.userId, session.role);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `تم إصدار وتوزيع التنبيه داخلياً بنجاح إلى ${result.deliveredCount} مستلم`,
      deliveredCount: result.deliveredCount,
      skippedCount: result.skippedCount,
      dispatchedAt: result.dispatchedAt,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
