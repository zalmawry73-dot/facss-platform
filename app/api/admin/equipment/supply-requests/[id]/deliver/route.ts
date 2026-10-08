import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { validateDeliveryInput } from '@/lib/validations/equipment';
import { executeDeliveryTransaction } from '@/lib/equipment-rules';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_INVENTORY);
    if (!gate.authorized) return gate.response!;

    const sReq = await prisma.serviceRequest.findUnique({
      where: { id: params.id },
      include: { supplyItems: true },
    });
    if (!sReq) {
      return NextResponse.json({ error: 'طلب الخدمة غير موجود' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    body.serviceRequestId = params.id;

    const validation = validateDeliveryInput(body);
    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات تسليم المعدات غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const input = validation.data;

    const delivery = await executeDeliveryTransaction({
      serviceRequestId: params.id,
      receivedByName: input.receivedByName,
      receivedByPhone: input.receivedByPhone,
      receivedByRole: input.receivedByRole,
      deliveryLocation: input.deliveryLocation,
      notes: input.notes,
      actorId: session!.userId,
      actorName: session!.fullName || 'Staff',
      items: input.items,
    });

    const totalDelivered = input.items.reduce((s, it) => s + it.quantity, 0);

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'DELIVER_EQUIPMENT_HANDOVER',
      entityType: 'EquipmentDelivery',
      entityId: delivery.id,
      details: `تسليم وتسليم معدات رسمي [${delivery.deliveryNumber}] للعميل [${sReq.organization}] لممثل العميل [${delivery.receivedByName}] (إجمالي ${totalDelivered} قطعة)`,
    });

    return NextResponse.json({
      success: true,
      message: `تم تسليم المعدات وتوثيق محضر الاستلام والتسليم الرسمي [${delivery.deliveryNumber}] بنجاح`,
      delivery,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 400 });
  }
}
