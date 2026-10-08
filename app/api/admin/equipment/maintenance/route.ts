import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { validateMaintenanceInput } from '@/lib/validations/equipment';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_EQUIPMENT);
    if (!gate.authorized) return gate.response!;

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    const where: any = {};
    if (productId) where.productId = productId;

    const maintenances = await prisma.equipmentMaintenance.findMany({
      where,
      include: {
        product: { select: { id: true, sku: true, nameAr: true, nameEn: true, unit: true } },
        trackedItem: { select: { id: true, serialNumber: true, batchNumber: true } },
      },
      orderBy: { maintenanceDate: 'desc' },
    });

    return NextResponse.json({
      success: true,
      maintenances,
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
    const validation = validateMaintenanceInput(body);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات الصيانة غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const input = validation.data;

    const product = await prisma.equipmentProduct.findUnique({
      where: { id: input.productId },
    });
    if (!product) {
      return NextResponse.json({ error: 'صنف المعدات غير موجود' }, { status: 400 });
    }

    const maintenance = await prisma.equipmentMaintenance.create({
      data: {
        productId: input.productId,
        trackedItemId: input.trackedItemId,
        maintenanceType: input.maintenanceType || 'PREVENTIVE',
        status: input.status || 'COMPLETED',
        performedBy: input.performedBy,
        result: input.result,
        notes: input.notes,
        nextDueDate: input.nextDueDate ? new Date(input.nextDueDate) : null,
        cost: input.cost,
        documentUrl: input.documentUrl,
      },
      include: {
        product: true,
        trackedItem: true,
      },
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'RECORD_EQUIPMENT_MAINTENANCE',
      entityType: 'EquipmentMaintenance',
      entityId: maintenance.id,
      details: `تسجيل صيانة [${maintenance.maintenanceType}] للصنف [${product.sku}] بواسطة [${maintenance.performedBy}]`,
    });

    return NextResponse.json({ success: true, maintenance }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
