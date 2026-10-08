import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { validateProductInput } from '@/lib/validations/equipment';
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

    const product = await prisma.equipmentProduct.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        trackedItems: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        inspections: {
          orderBy: { inspectionDate: 'desc' },
          take: 10,
          include: {
            inspector: { select: { id: true, fullName: true } },
          },
        },
        maintenances: {
          orderBy: { maintenanceDate: 'desc' },
          take: 10,
        },
        movements: {
          orderBy: { timestamp: 'desc' },
          take: 20,
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'صنف المعدات غير موجود' }, { status: 404 });
    }

    const available = Math.max(0, product.quantityOnHand - product.quantityReserved);

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        quantityAvailable: available,
        isLowStock: available > 0 && available <= product.minimumStockLevel,
        isOutOfStock: available === 0,
      },
    });
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

    const existing = await prisma.equipmentProduct.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'صنف المعدات غير موجود' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const validation = validateProductInput(body, true);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات التحديث غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const input = validation.data;
    const updateData: any = {};

    if (input.sku && input.sku !== existing.sku) {
      const skuTaken = await prisma.equipmentProduct.findUnique({
        where: { sku: input.sku },
      });
      if (skuTaken) {
        return NextResponse.json({ error: `رمز الصنف (${input.sku}) مسجل مسبقاً` }, { status: 409 });
      }
      updateData.sku = input.sku;
    }

    if (input.nameAr !== undefined) updateData.nameAr = input.nameAr;
    if (input.nameEn !== undefined) updateData.nameEn = input.nameEn;
    if (input.categoryId !== undefined) updateData.categoryId = input.categoryId;
    if (input.descriptionAr !== undefined) updateData.descriptionAr = input.descriptionAr;
    if (input.descriptionEn !== undefined) updateData.descriptionEn = input.descriptionEn;
    if (input.unit !== undefined) updateData.unit = input.unit;
    if (input.manufacturer !== undefined) updateData.manufacturer = input.manufacturer;
    if (input.brand !== undefined) updateData.brand = input.brand;
    if (input.model !== undefined) updateData.model = input.model;
    if (input.specifications !== undefined) updateData.specifications = input.specifications;
    if (input.imageUrl !== undefined) updateData.imageUrl = input.imageUrl;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    if (input.inspectionRequired !== undefined) updateData.inspectionRequired = input.inspectionRequired;
    if (input.maintenanceRequired !== undefined) updateData.maintenanceRequired = input.maintenanceRequired;
    if (input.expiryTrackingRequired !== undefined) updateData.expiryTrackingRequired = input.expiryTrackingRequired;
    if (input.serialTrackingRequired !== undefined) updateData.serialTrackingRequired = input.serialTrackingRequired;
    if (input.minimumStockLevel !== undefined) updateData.minimumStockLevel = input.minimumStockLevel;

    const updated = await prisma.equipmentProduct.update({
      where: { id: params.id },
      data: updateData,
      include: { category: true },
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'UPDATE_EQUIPMENT_PRODUCT',
      entityType: 'EquipmentProduct',
      entityId: updated.id,
      details: `تحديث بيانات صنف المعدات: [${updated.sku}] ${updated.nameAr}`,
    });

    return NextResponse.json({ success: true, product: updated });
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

    const product = await prisma.equipmentProduct.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { movements: true, deliveryItems: true, procurementItems: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'صنف المعدات غير موجود' }, { status: 404 });
    }

    // Historical Preservation: if product has history or stock, safely deactivate
    const hasHistory = product._count.movements > 0 || product._count.deliveryItems > 0 || product.quantityOnHand > 0;

    if (hasHistory) {
      const deactivated = await prisma.equipmentProduct.update({
        where: { id: params.id },
        data: { isActive: false },
      });

      await logActivity({
        userId: session?.userId,
        userName: session?.fullName,
        action: 'DEACTIVATE_EQUIPMENT_PRODUCT',
        entityType: 'EquipmentProduct',
        entityId: product.id,
        details: `إيقاف تنشيط صنف المعدات (${product.nameAr}) لوجود حركات مخزنية أو أرصدة سابقة`,
      });

      return NextResponse.json({
        success: true,
        message: 'تم إيقاف تنشيط الصنف وأرشفته بأمان حفاظاً على السجل المخزني التاريخي',
        product: deactivated,
      });
    }

    await prisma.equipmentProduct.delete({
      where: { id: params.id },
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'DELETE_EQUIPMENT_PRODUCT',
      entityType: 'EquipmentProduct',
      entityId: params.id,
      details: `حذف صنف معدات جديد بدون تاريخ: [${product.sku}] ${product.nameAr}`,
    });

    return NextResponse.json({ success: true, message: 'تم حذف الصنف بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
