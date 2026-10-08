import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { validateReceivingInput } from '@/lib/validations/equipment';
import { executeReceivingTransaction } from '@/lib/equipment-rules';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_PROCUREMENT);
    if (!gate.authorized) return gate.response!;

    const po = await prisma.procurementOrder.findUnique({
      where: { id: params.id },
      include: { items: true },
    });

    if (!po) {
      return NextResponse.json({ error: 'أمر الشراء غير موجود' }, { status: 404 });
    }

    if (po.status === 'CANCELLED') {
      return NextResponse.json({ error: 'لا يمكن استلام شحنة لأمر شراء ملغى' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    body.procurementOrderId = params.id;

    const validation = validateReceivingInput(body);
    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات استلام الشحنة غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const input = validation.data;

    // Execute atomic transaction
    const receiving = await executeReceivingTransaction({
      procurementOrderId: params.id,
      deliveryNoteNumber: input.deliveryNoteNumber,
      notes: input.notes,
      actorId: session!.userId,
      actorName: session!.fullName || 'Staff',
      items: input.items.map((it) => ({
        ...it,
        quantityRejected: it.quantityRejected ?? 0,
      })),
    });

    const totalAccepted = input.items.reduce((s, it) => s + it.quantityAccepted, 0);
    const totalRejected = input.items.reduce((s, it) => s + (it.quantityRejected ?? 0), 0);

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'RECEIVE_PROCUREMENT_SHIPMENT',
      entityType: 'ProcurementReceiving',
      entityId: receiving.id,
      details: `استلام شحنة توريد رسمية [${receiving.receivingNumber}] لأمر الشراء [${po.referenceNumber}]: مقبول (${totalAccepted})، مرفوض (${totalRejected})`,
    });

    return NextResponse.json(
      {
        success: true,
        message: `تم استلام الشحنة بنجاح وزيادة المخزون بالكميات المقبولة (${totalAccepted}) فقط`,
        receiving,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
