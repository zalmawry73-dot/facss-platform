import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ROLES, CAPABILITIES, hasCapability } from '@/lib/rbac';
import { logActivity } from '@/lib/audit';

function parseArrayField(val: any): string {
  if (!val) return '[]';
  if (Array.isArray(val)) return JSON.stringify(val.filter(Boolean));
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      return trimmed;
    }
    const lines = trimmed.split('\n').map((l: string) => l.trim()).filter(Boolean);
    return JSON.stringify(lines);
  }
  return '[]';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function POST(req: NextRequest) {
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
      return NextResponse.json({ error: 'ليس لديك صلاحية إضافة خدمة جديدة' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { 
      categoryId,
      titleAr, 
      titleEn, 
      slug: customSlug,
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
      isActive = true 
    } = body;

    if (!categoryId || !titleAr || !titleEn) {
      return NextResponse.json(
        { error: 'يرجى تحديد القطاع وكتابة اسم الخدمة بالعربية والإنجليزية' },
        { status: 400 }
      );
    }

    // Check category existence
    const category = await prisma.serviceCategory.findUnique({
      where: { id: categoryId }
    });
    if (!category) {
      return NextResponse.json({ error: 'القطاع المحدد غير موجود' }, { status: 404 });
    }

    // Generate or sanitize slug
    let finalSlug = customSlug ? slugify(customSlug) : slugify(titleEn);
    if (!finalSlug) {
      finalSlug = `service-${Date.now().toString(36)}`;
    }

    // Ensure slug uniqueness
    const existingWithSlug = await prisma.service.findUnique({
      where: { slug: finalSlug }
    });
    if (existingWithSlug) {
      finalSlug = `${finalSlug}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const newService = await prisma.service.create({
      data: {
        categoryId,
        titleAr: titleAr.trim(),
        titleEn: titleEn.trim(),
        slug: finalSlug,
        shortDescAr: (shortDescAr || '').trim(),
        shortDescEn: (shortDescEn || '').trim(),
        fullDescAr: (fullDescAr || shortDescAr || '').trim(),
        fullDescEn: (fullDescEn || shortDescEn || '').trim(),
        featuresAr: parseArrayField(featuresAr),
        featuresEn: parseArrayField(featuresEn),
        processAr: parseArrayField(processAr),
        processEn: parseArrayField(processEn),
        targetSectorsAr: parseArrayField(targetSectorsAr),
        targetSectorsEn: parseArrayField(targetSectorsEn),
        order: typeof order === 'number' ? order : 0,
        isActive: Boolean(isActive),
      },
      include: {
        category: true,
      }
    });

    await logActivity({
      userId: session.userId,
      userName: session.fullName,
      action: 'CREATE_SERVICE',
      entityType: 'Service',
      entityId: newService.id,
      details: `إضافة خدمة جديدة [${newService.titleAr} (${newService.slug})] ضمن قطاع [${newService.category.titleAr}]`,
    });

    return NextResponse.json({
      success: true,
      service: newService,
      message: 'تمت إضافة الخدمة بنجاح إلى دليل الخدمات',
    });
  } catch (error: any) {
    console.error('[API admin/services POST error]', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء إضافة الخدمة' },
      { status: 500 }
    );
  }
}
