import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { validateReservationInput } from '@/lib/validations/equipment';
import { executeReservationTransaction } from '@/lib/equipment-rules';
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
    });
    if (!sReq) {
      return NextResponse.json({ error: 'طلب الخدمة غير موجود' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const validation = validateReservationInput(body);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات الحجز غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const result = await executeReservationTransaction({
      serviceRequestId: params.id,
      items: validation.data.items,
      actorId: session!.userId,
      actorName: session!.fullName || 'Staff',
    });

    const totalReserved = validation.data.items.reduce((s, it) => s + it.quantityToReserve, 0);

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'RESERVE_EQUIPMENT_STOCK',
      entityType: 'ServiceRequest',
      entityId: params.id,
      details: `حجز كميات معدات [إجمالي ${totalReserved} وحدة] لصالح طلب الخدمة [${sReq.requestNumber}]`,
    });

    return NextResponse.json({
      success: true,
      message: `تم حجز الكميات بنجاح وخصمها من المخزون المتاح للطلب [${sReq.requestNumber}]`,
      reservedItems: result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 400 });
  }
}
