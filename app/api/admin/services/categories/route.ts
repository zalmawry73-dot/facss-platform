import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ROLES, CAPABILITIES, hasCapability, isStaffRole } from '@/lib/rbac';
import { logActivity } from '@/lib/audit';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * GET /api/admin/services/categories
 * Lists all service categories (institutional activity sectors)
 */
export async function GET() {
  try {
    const session = await getCurrentUser(true);
    if (!session || !isStaffRole(session.role)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const categories = await prisma.serviceCategory.findMany({
      orderBy: { order: 'asc' },
      include: {
        services: {
          select: { id: true, titleAr: true, isActive: true },
        },
        _count: {
          select: { services: true },
        },
      },
    });

    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في الخادم' }, { status: 500 });
  }
}

/**
 * POST /api/admin/services/categories
 * Creates a new service category (institutional activity sector)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser(true);
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const isAuthorized =
      session.role === ROLES.SUPER_ADMIN ||
      session.role === ROLES.ADMIN ||
      session.role === ROLES.CONTENT_MANAGER ||
      (await hasCapability(session, CAPABILITIES.MANAGE_CONTENT)) ||
      (await hasCapability(session, CAPABILITIES.MANAGE_REQUESTS));

    if (!isAuthorized) {
      return NextResponse.json({ error: 'ليس لديك صلاحية إضافة مجال نشاط مؤسسي جديد' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { titleAr, titleEn, slug: customSlug, icon, order = 0, isActive = true } = body;

    if (!titleAr || !titleAr.trim() || !titleEn || !titleEn.trim()) {
      return NextResponse.json(
        { error: 'يرجى كتابة اسم مجال النشاط باللغتين العربية والإنجليزية' },
        { status: 400 }
      );
    }

    let finalSlug = customSlug ? slugify(customSlug) : slugify(titleEn);
    if (!finalSlug) {
      finalSlug = `activity-${Date.now().toString(36)}`;
    }

    // Ensure uniqueness
    const existing = await prisma.serviceCategory.findUnique({
      where: { slug: finalSlug },
    });
    if (existing) {
      finalSlug = `${finalSlug}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const newCategory = await prisma.serviceCategory.create({
      data: {
        titleAr: titleAr.trim(),
        titleEn: titleEn.trim(),
        slug: finalSlug,
        icon: icon || null,
        order: Number(order) || 0,
        isActive: Boolean(isActive),
      },
      include: {
        services: true,
      },
    });

    // Sync with ContentBlock (section: activity_fields)
    try {
      if ((prisma as any).contentBlock) {
        await (prisma as any).contentBlock.upsert({
          where: {
            section_key: {
              section: 'activity_fields',
              key: finalSlug,
            },
          },
          update: {
            titleAr: titleAr.trim(),
            titleEn: titleEn.trim(),
            order: Number(order) || 0,
            isVisible: Boolean(isActive),
          },
          create: {
            section: 'activity_fields',
            key: finalSlug,
            titleAr: titleAr.trim(),
            titleEn: titleEn.trim(),
            order: Number(order) || 0,
            isVisible: Boolean(isActive),
          },
        });
      }
    } catch (syncErr) {
      console.warn('[Sync with ContentBlock warning]:', syncErr);
    }

    // Log Activity
    await logActivity({
      userId: session.userId,
      userName: session.fullName,
      action: 'CREATE_SERVICE_CATEGORY',
      entityType: 'ServiceCategory',
      entityId: newCategory.id,
      details: `إضافة مجال نشاط مؤسسي جديد [${newCategory.titleAr} (${newCategory.slug})]`,
    });

    return NextResponse.json({
      success: true,
      category: newCategory,
      message: 'تمت إضافة مجال النشاط المؤسسي بنجاح',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في معالجة الطلب' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/services/categories
 * Updates an existing service category
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getCurrentUser(true);
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const isAuthorized =
      session.role === ROLES.SUPER_ADMIN ||
      session.role === ROLES.ADMIN ||
      session.role === ROLES.CONTENT_MANAGER ||
      (await hasCapability(session, CAPABILITIES.MANAGE_CONTENT)) ||
      (await hasCapability(session, CAPABILITIES.MANAGE_REQUESTS));

    if (!isAuthorized) {
      return NextResponse.json({ error: 'ليس لديك صلاحية تعديل مجالات النشاط' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { id, titleAr, titleEn, slug, icon, order, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'معرف مجال النشاط مطلوب' }, { status: 400 });
    }

    const existing = await prisma.serviceCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'مجال النشاط غير موجود' }, { status: 404 });
    }

    const updateData: any = {};
    if (titleAr !== undefined) updateData.titleAr = titleAr.trim();
    if (titleEn !== undefined) updateData.titleEn = titleEn.trim();
    if (icon !== undefined) updateData.icon = icon || null;
    if (order !== undefined) updateData.order = Number(order);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    if (slug && slug !== existing.slug) {
      const sanitizedSlug = slugify(slug);
      const duplicate = await prisma.serviceCategory.findUnique({
        where: { slug: sanitizedSlug },
      });
      if (duplicate && duplicate.id !== id) {
        return NextResponse.json({ error: 'المعرف الرابط (Slug) مستخدم بالفعل لمجال آخر' }, { status: 400 });
      }
      updateData.slug = sanitizedSlug;
    }

    const updated = await prisma.serviceCategory.update({
      where: { id },
      data: updateData,
      include: {
        services: true,
      },
    });

    // Sync updated data with ContentBlock
    try {
      if ((prisma as any).contentBlock) {
        await (prisma as any).contentBlock.updateMany({
          where: {
            section: 'activity_fields',
            key: existing.slug,
          },
          data: {
            ...(updateData.titleAr ? { titleAr: updateData.titleAr } : {}),
            ...(updateData.titleEn ? { titleEn: updateData.titleEn } : {}),
            ...(updateData.order !== undefined ? { order: updateData.order } : {}),
            ...(updateData.isActive !== undefined ? { isVisible: updateData.isActive } : {}),
            ...(updateData.slug ? { key: updateData.slug } : {}),
          },
        });
      }
    } catch (syncErr) {
      console.warn('[Sync update warning]:', syncErr);
    }

    await logActivity({
      userId: session.userId,
      userName: session.fullName,
      action: 'UPDATE_SERVICE_CATEGORY',
      entityType: 'ServiceCategory',
      entityId: id,
      details: `تحديث بيانات مجال النشاط [${updated.titleAr} (${updated.slug})]`,
    });

    return NextResponse.json({
      success: true,
      category: updated,
      message: 'تم تحديث بيانات مجال النشاط بنجاح',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في معالجة التحديث' }, { status: 500 });
  }
}
