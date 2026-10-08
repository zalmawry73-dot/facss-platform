import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { validateReturnInput } from '@/lib/validations/equipment';
import { executeReturnTransaction } from '@/lib/equipment-rules';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_INVENTORY);
    if (!gate.authorized) return gate.response!;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const productId = searchParams.get('productId');

    const where: any = {};
    if (status) where.status = status;
    if (productId) where.productId = productId;

    const returns = await prisma.equipmentReturn.findMany({
      where,
      include: {
        product: { select: { id: true, sku: true, nameAr: true, nameEn: true, unit: true, inspectionRequired: true } },
        trackedItem: { select: { id: true, serialNumber: true, batchNumber: true, status: true } },
        serviceRequest: { select: { id: true, requestNumber: true, organization: true } },
      },
      orderBy: { returnDate: 'desc' },
    });

    return NextResponse.json({
      success: true,
      returns,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_INVENTORY);
    if (!gate.authorized) return gate.response!;

    const body = await request.json().catch(() => ({}));
    const validation = validateReturnInput(body);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات الإرجاع غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const input = validation.data;

    const returnRecord = await executeReturnTransaction({
      serviceRequestId: input.serviceRequestId,
      productId: input.productId,
      trackedItemId: input.trackedItemId,
      quantity: input.quantity,
      reason: input.reason,
      receivedByName: input.receivedByName,
      notes: input.notes,
      actorId: session!.userId,
      actorName: session!.fullName || 'Staff',
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'RETURN_EQUIPMENT_QUARANTINE',
      entityType: 'EquipmentReturn',
      entityId: returnRecord.id,
      details: `استلام معدات مرتجعة بحالة الحجر الفني [${returnRecord.returnNumber}] كمية (${input.quantity}) السبب: ${input.reason}`,
    });

    return NextResponse.json({
      success: true,
      message: 'تم تسجيل إرجاع المعدات بحالة الحجر المؤقت (Quarantine) في انتظار الفحص الفني',
      returnRecord,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
