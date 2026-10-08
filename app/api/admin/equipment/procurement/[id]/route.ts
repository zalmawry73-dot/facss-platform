import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { logActivity } from '@/lib/audit';
import { ProcurementStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_PROCUREMENT);
    if (!gate.authorized) return gate.response!;

    const order = await prisma.procurementOrder.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        createdBy: { select: { id: true, fullName: true, email: true } },
        approvedBy: { select: { id: true, fullName: true, email: true } },
        serviceRequest: { select: { id: true, requestNumber: true, organization: true } },
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                nameAr: true,
                nameEn: true,
                unit: true,
                quantityOnHand: true,
                quantityReserved: true,
              },
            },
          },
        },
        receivings: {
          include: {
            receivedBy: { select: { id: true, fullName: true } },
            items: {
              include: {
                product: { select: { sku: true, nameAr: true } },
              },
            },
          },
          orderBy: { receivingDate: 'desc' },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'أمر الشراء غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
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
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_PROCUREMENT);
    if (!gate.authorized) return gate.response!;

    const order = await prisma.procurementOrder.findUnique({
      where: { id: params.id },
    });
    if (!order) {
      return NextResponse.json({ error: 'أمر الشراء غير موجود' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { status, notes, expectedDeliveryDate } = body;

    const updateData: any = {};
    if (notes !== undefined) updateData.notes = notes;
    if (expectedDeliveryDate !== undefined) {
      updateData.expectedDeliveryDate = expectedDeliveryDate ? new Date(expectedDeliveryDate) : null;
    }

    if (status) {
      const validStatuses = Object.values(ProcurementStatus);
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `حالة أمر الشراء غير صالحة. الحالات المتاحة: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.status = status;

      if (status === ProcurementStatus.APPROVED && !order.approvedById) {
        updateData.approvedById = session!.userId;
        updateData.approvedAt = new Date();
      }
    }

    const updated = await prisma.procurementOrder.update({
      where: { id: params.id },
      data: updateData,
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'UPDATE_PROCUREMENT_STATUS',
      entityType: 'ProcurementOrder',
      entityId: updated.id,
      details: `تحديث أمر الشراء [${updated.referenceNumber}] إلى الحالة [${updated.status}]`,
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
