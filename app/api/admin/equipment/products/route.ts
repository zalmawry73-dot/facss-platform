import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { validateProductInput } from '@/lib/validations/equipment';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_EQUIPMENT);
    if (!gate.authorized) return gate.response!;

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const stockStatus = searchParams.get('stockStatus'); // 'ALL', 'LOW', 'OUT', 'AVAILABLE'
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const where: any = {};
    if (!includeInactive) where.isActive = true;
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { sku: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.equipmentProduct.findMany({
      where,
      include: {
        category: {
          select: { id: true, code: true, nameAr: true, nameEn: true },
        },
        inspections: {
          orderBy: { inspectionDate: 'desc' },
          take: 1,
          select: { id: true, result: true, inspectionDate: true, inspectionType: true },
        },
        _count: {
          select: { trackedItems: true, movements: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let formatted = products.map((p) => {
      const available = Math.max(0, p.quantityOnHand - p.quantityReserved);
      const isLowStock = available > 0 && available <= p.minimumStockLevel;
      const isOutOfStock = available === 0;
      const latestInspection = p.inspections[0] || null;

      return {
        ...p,
        quantityAvailable: available,
        isLowStock,
        isOutOfStock,
        latestInspection,
        trackedItemsCount: p._count.trackedItems,
        movementsCount: p._count.movements,
      };
    });

    if (stockStatus === 'LOW') {
      formatted = formatted.filter((p) => p.isLowStock);
    } else if (stockStatus === 'OUT') {
      formatted = formatted.filter((p) => p.isOutOfStock);
    } else if (stockStatus === 'AVAILABLE') {
      formatted = formatted.filter((p) => p.quantityAvailable > 0);
    }

    return NextResponse.json({
      success: true,
      products: formatted,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_EQUIPMENT);
    if (!gate.authorized) return gate.response!;

    const body = await request.json().catch(() => ({}));
    const validation = validateProductInput(body);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات المنتج غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const input = validation.data;

    // Check SKU uniqueness
    const existingSku = await prisma.equipmentProduct.findUnique({
      where: { sku: input.sku },
    });
    if (existingSku) {
      return NextResponse.json(
        { error: `رمز الصنف / SKU (${input.sku}) مسجل مسبقاً في النظام` },
        { status: 409 }
      );
    }

    // Verify category exists
    const categoryExists = await prisma.equipmentCategory.findUnique({
      where: { id: input.categoryId },
    });
    if (!categoryExists) {
      return NextResponse.json({ error: 'تصنيف المنتج المحدد غير موجود' }, { status: 400 });
    }

    const product = await prisma.equipmentProduct.create({
      data: {
        sku: input.sku,
        nameAr: input.nameAr,
        nameEn: input.nameEn,
        categoryId: input.categoryId,
        descriptionAr: input.descriptionAr,
        descriptionEn: input.descriptionEn,
        unit: input.unit || 'piece',
        manufacturer: input.manufacturer,
        brand: input.brand,
        model: input.model,
        specifications: input.specifications,
        imageUrl: input.imageUrl,
        isActive: input.isActive ?? true,
        inspectionRequired: input.inspectionRequired ?? false,
        maintenanceRequired: input.maintenanceRequired ?? false,
        expiryTrackingRequired: input.expiryTrackingRequired ?? false,
        serialTrackingRequired: input.serialTrackingRequired ?? false,
        minimumStockLevel: input.minimumStockLevel ?? 5,
        quantityOnHand: 0,
        quantityReserved: 0,
      },
      include: {
        category: true,
      },
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'CREATE_EQUIPMENT_PRODUCT',
      entityType: 'EquipmentProduct',
      entityId: product.id,
      details: `إضافة صنف معدات جديد إلى السجل المركزي: [${product.sku}] ${product.nameAr}`,
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
