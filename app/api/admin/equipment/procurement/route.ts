import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { validateProcurementOrderInput } from '@/lib/validations/equipment';
import { generateReferenceNumber } from '@/lib/equipment-rules';
import { logActivity } from '@/lib/audit';
import { ProcurementStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_PROCUREMENT);
    if (!gate.authorized) return gate.response!;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const supplierId = searchParams.get('supplierId');
    const serviceRequestId = searchParams.get('serviceRequestId');

    const where: any = {};
    if (status) where.status = status as ProcurementStatus;
    if (supplierId) where.supplierId = supplierId;
    if (serviceRequestId) where.serviceRequestId = serviceRequestId;

    const orders = await prisma.procurementOrder.findMany({
      where,
      include: {
        supplier: {
          select: { id: true, supplierCode: true, name: true, phone: true },
        },
        createdBy: {
          select: { id: true, fullName: true },
        },
        approvedBy: {
          select: { id: true, fullName: true },
        },
        items: {
          include: {
            product: { select: { id: true, sku: true, nameAr: true, unit: true } },
          },
        },
        _count: {
          select: { receivings: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      orders: orders.map((o) => {
        const totalOrdered = o.items.reduce((sum, it) => sum + it.quantityOrdered, 0);
        const totalReceived = o.items.reduce((sum, it) => sum + it.quantityReceived, 0);
        return {
          ...o,
          totalQuantityOrdered: totalOrdered,
          totalQuantityReceived: totalReceived,
          receivingsCount: o._count.receivings,
        };
      }),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_PROCUREMENT);
    if (!gate.authorized) return gate.response!;

    const body = await request.json().catch(() => ({}));
    const validation = validateProcurementOrderInput(body);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات أمر الشراء غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const input = validation.data;

    // Verify supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: input.supplierId },
    });
    if (!supplier) {
      return NextResponse.json({ error: 'المورد المحدد غير موجود' }, { status: 400 });
    }

    // Verify products exist
    for (const item of input.items) {
      const prod = await prisma.equipmentProduct.findUnique({
        where: { id: item.productId },
      });
      if (!prod) {
        return NextResponse.json(
          { error: `المنتج ذو المعرف (${item.productId}) غير موجود` },
          { status: 400 }
        );
      }
    }

    const referenceNumber = await generateReferenceNumber('FACSS-PO', 'procurementOrder', 'referenceNumber');

    // Calculate total estimated cost
    const totalEstimatedCost = input.items.reduce((sum, it) => {
      return sum + (it.unitPrice ? it.unitPrice * it.quantityOrdered : 0);
    }, 0);

    // Create PO. RULE: Creating PO does NOT increase stock! Stock increases only upon receiving.
    const order = await prisma.procurementOrder.create({
      data: {
        referenceNumber,
        supplierId: input.supplierId,
        serviceRequestId: input.serviceRequestId,
        status: ProcurementStatus.DRAFT,
        expectedDeliveryDate: input.expectedDeliveryDate ? new Date(input.expectedDeliveryDate) : null,
        notes: input.notes,
        totalEstimatedCost: totalEstimatedCost > 0 ? totalEstimatedCost : null,
        currency: input.currency || 'YER',
        createdById: session!.userId,
        items: {
          create: input.items.map((it) => ({
            productId: it.productId,
            quantityOrdered: it.quantityOrdered,
            unitPrice: it.unitPrice,
            specifications: it.specifications,
            notes: it.notes,
          })),
        },
      },
      include: {
        supplier: true,
        items: {
          include: { product: true },
        },
      },
    });

    // If linked to a service request with shortage, update request fulfillmentStatus
    if (input.serviceRequestId) {
      await prisma.serviceRequest.update({
        where: { id: input.serviceRequestId },
        data: {
          fulfillmentStatus: 'PROCUREMENT_REQUIRED',
        },
      });
    }

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'CREATE_PROCUREMENT_ORDER',
      entityType: 'ProcurementOrder',
      entityId: order.id,
      details: `إنشاء أمر شراء وتوريد جديد: [${order.referenceNumber}] للمورد [${supplier.name}]`,
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
