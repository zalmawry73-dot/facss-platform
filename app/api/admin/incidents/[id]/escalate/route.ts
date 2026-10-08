import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { ROLES } from '@/lib/rbac';
import { escalateIncidentInternal } from '@/lib/escalation-engine';

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

    if (session.role !== ROLES.SUPER_ADMIN && session.role !== ROLES.ADMIN) {
      return NextResponse.json(
        { error: 'غير مصرح: تصعيد البلاغات محصور بمسؤولي العمليات والإدارة حصراً' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const reason = body.reason || 'تصعيد يدوي مباشر من غرفة العمليات';

    const result = await escalateIncidentInternal(
      params.id,
      reason,
      session.userId,
      session.fullName
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (result.alreadyEscalated) {
      return NextResponse.json(
        { error: 'تم تصعيد هذا البلاغ مسبقاً ولا يمكن تكرار التصعيد', alreadyEscalated: true },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      alreadyEscalated: false,
      message: `تم تصعيد البلاغ وإشعار ${result.notifiedCount} من المشرفين والمكلفين بنجاح`,
      incident: result.incident,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
