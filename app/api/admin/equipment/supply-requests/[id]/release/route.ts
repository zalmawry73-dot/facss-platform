import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { executeReleaseReservationTransaction } from '@/lib/equipment-rules';
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
    let itemsToRelease = body.items;

    // If no specific items provided, release all reserved items for this request
    if (!Array.isArray(itemsToRelease) || itemsToRelease.length === 0) {
      itemsToRelease = sReq.supplyItems
        .filter((it) => it.quantityReserved > 0)
        .map((it) => ({
          productId: it.productId,
          quantityToRelease: it.quantityReserved,
        }));
    }

    if (itemsToRelease.length === 0) {
      return NextResponse.json({ error: 'لا توجد كميات محجوزة لتحريرها في هذا الطلب' }, { status: 400 });
    }

    await executeReleaseReservationTransaction({
      serviceRequestId: params.id,
      items: itemsToRelease,
      actorId: session!.userId,
      actorName: session!.fullName || 'Staff',
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'RELEASE_EQUIPMENT_RESERVATION',
      entityType: 'ServiceRequest',
      entityId: params.id,
      details: `تحرير حجز المعدات وإعادتها للمخزون المتاح لطلب الخدمة [${sReq.requestNumber}]`,
    });

    return NextResponse.json({
      success: true,
      message: 'تم تحرير الحجز وإعادة الكميات إلى المخزون المتاح بنجاح',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 400 });
  }
}
