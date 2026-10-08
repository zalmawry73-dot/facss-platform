import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { validateCategoryInput } from '@/lib/validations/equipment';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_EQUIPMENT);
    if (!gate.authorized) return gate.response!;

    const category = await prisma.equipmentCategory.findUnique({
      where: { id: params.id },
      include: {
        products: {
          select: {
            id: true,
            sku: true,
            nameAr: true,
            nameEn: true,
            quantityOnHand: true,
            quantityReserved: true,
            isActive: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'تصنيف المعدات غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_EQUIPMENT);
    if (!gate.authorized) return gate.response!;

    const existing = await prisma.equipmentCategory.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'تصنيف المعدات غير موجود' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const validation = validateCategoryInput(body, true);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات التحديث غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (validation.data.nameAr !== undefined) updateData.nameAr = validation.data.nameAr;
    if (validation.data.nameEn !== undefined) updateData.nameEn = validation.data.nameEn;
    if (validation.data.description !== undefined) updateData.description = validation.data.description;
    if (validation.data.icon !== undefined) updateData.icon = validation.data.icon;
    if (validation.data.isActive !== undefined) updateData.isActive = validation.data.isActive;
    if (validation.data.order !== undefined) updateData.order = validation.data.order;

    if (validation.data.code && validation.data.code !== existing.code) {
      const codeTaken = await prisma.equipmentCategory.findUnique({
        where: { code: validation.data.code },
      });
      if (codeTaken) {
        return NextResponse.json({ error: `رمز التصنيف (${validation.data.code}) مسجل مسبقاً` }, { status: 409 });
      }
      updateData.code = validation.data.code;
    }

    const updated = await prisma.equipmentCategory.update({
      where: { id: params.id },
      data: updateData,
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'UPDATE_EQUIPMENT_CATEGORY',
      entityType: 'EquipmentCategory',
      entityId: updated.id,
      details: `تحديث تصنيف المعدات: [${updated.code}] ${updated.nameAr}`,
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_EQUIPMENT);
    if (!gate.authorized) return gate.response!;

    const category = await prisma.equipmentCategory.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'تصنيف المعدات غير موجود' }, { status: 404 });
    }

    // Historical Preservation: Deletion strictly prevented if products exist
    if (category._count.products > 0) {
      // Safely deactivate instead of hard delete
      const deactivated = await prisma.equipmentCategory.update({
        where: { id: params.id },
        data: { isActive: false },
      });

      await logActivity({
        userId: session?.userId,
        userName: session?.fullName,
        action: 'DEACTIVATE_EQUIPMENT_CATEGORY',
        entityType: 'EquipmentCategory',
        entityId: category.id,
        details: `إيقاف تنشيط تصنيف المعدات (${category.nameAr}) لوجود أصناف مرتبطة به تاريخياً`,
      });

      return NextResponse.json({
        success: true,
        message: 'تم إيقاف تنشيط التصنيف وأرشفته بأمان حفاظاً على السجل التاريخي للأصناف',
        category: deactivated,
      });
    }

    await prisma.equipmentCategory.delete({
      where: { id: params.id },
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'DELETE_EQUIPMENT_CATEGORY',
      entityType: 'EquipmentCategory',
      entityId: params.id,
      details: `حذف تصنيف معدات فارغ: [${category.code}] ${category.nameAr}`,
    });

    return NextResponse.json({ success: true, message: 'تم حذف التصنيف بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
