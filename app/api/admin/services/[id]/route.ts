import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ROLES, CAPABILITIES, hasCapability } from '@/lib/rbac';
import { logActivity } from '@/lib/audit';

interface RouteContext {
  params: { id: string };
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const isAuthorized =
      session.role === ROLES.SUPER_ADMIN ||
      session.role === ROLES.ADMIN ||
      session.role === ROLES.SERVICE_MANAGER ||
      (await hasCapability(session, CAPABILITIES.MANAGE_REQUESTS)) ||
      (await hasCapability(session, CAPABILITIES.MANAGE_CONTENT));

    if (!isAuthorized) {
      return NextResponse.json({ error: 'ليس لديك صلاحية تعديل دليل الخدمات' }, { status: 403 });
    }

    const serviceId = params.id;
    const existing = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { category: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'الخدمة غير موجودة' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { 
      titleAr, 
      titleEn, 
      shortDescAr, 
      shortDescEn, 
      fullDescAr, 
      fullDescEn, 
      featuresAr,
      featuresEn,
      processAr,
      processEn,
      targetSectorsAr,
      targetSectorsEn,
      order, 
      isActive 
    } = body;

    const parseArrayField = (val: any): string | undefined => {
      if (val === undefined) return undefined;
      if (Array.isArray(val)) return JSON.stringify(val.filter(Boolean));
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          return trimmed;
        }
        const lines = trimmed.split('\n').map((l: string) => l.trim()).filter(Boolean);
        return JSON.stringify(lines);
      }
      return undefined;
    };

    const updated = await prisma.service.update({
      where: { id: serviceId },
      data: {
        ...(titleAr !== undefined ? { titleAr: titleAr.trim() } : {}),
        ...(titleEn !== undefined ? { titleEn: titleEn.trim() } : {}),
        ...(shortDescAr !== undefined ? { shortDescAr: shortDescAr.trim() } : {}),
        ...(shortDescEn !== undefined ? { shortDescEn: shortDescEn.trim() } : {}),
        ...(fullDescAr !== undefined ? { fullDescAr: fullDescAr.trim() } : {}),
        ...(fullDescEn !== undefined ? { fullDescEn: fullDescEn.trim() } : {}),
        ...(featuresAr !== undefined ? { featuresAr: parseArrayField(featuresAr) || '[]' } : {}),
        ...(featuresEn !== undefined ? { featuresEn: parseArrayField(featuresEn) || '[]' } : {}),
        ...(processAr !== undefined ? { processAr: parseArrayField(processAr) } : {}),
        ...(processEn !== undefined ? { processEn: parseArrayField(processEn) } : {}),
        ...(targetSectorsAr !== undefined ? { targetSectorsAr: parseArrayField(targetSectorsAr) } : {}),
        ...(targetSectorsEn !== undefined ? { targetSectorsEn: parseArrayField(targetSectorsEn) } : {}),
        ...(typeof order === 'number' ? { order } : {}),
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
      },
      include: {
        category: true,
      },
    });

    await logActivity({
      userId: session.userId,
      userName: session.fullName,
      action: 'UPDATE_SERVICE',
      entityType: 'Service',
      entityId: serviceId,
      details: `تعديل بيانات الخدمة [${updated.titleAr} (${updated.slug})] ضمن قطاع [${updated.category.titleAr}]`,
    });

    return NextResponse.json({
      success: true,
      service: updated,
      message: 'تم تحديث بيانات الخدمة بنجاح',
    });
  } catch (error: any) {
    console.error('[API admin/services/id PATCH error]', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء حفظ التعديلات' },
      { status: 500 }
    );
  }
}
