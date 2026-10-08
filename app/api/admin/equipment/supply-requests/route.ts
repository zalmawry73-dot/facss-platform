import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_REQUESTS);
    if (!gate.authorized) return gate.response!;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const fulfillmentStatus = searchParams.get('fulfillmentStatus');

    const where: any = {
      OR: [
        { supplyItems: { some: {} } },
        { service: { slug: 'safety-equipment-supplies' } },
      ],
    };

    if (status) where.status = status;
    if (fulfillmentStatus) where.fulfillmentStatus = fulfillmentStatus;

    const requests = await prisma.serviceRequest.findMany({
      where,
      include: {
        service: { select: { id: true, titleAr: true, titleEn: true, slug: true } },
        user: { select: { id: true, fullName: true, organization: true, email: true } },
        supplyItems: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                nameAr: true,
                unit: true,
                quantityOnHand: true,
                quantityReserved: true,
                inspectionRequired: true,
                expiryTrackingRequired: true,
              },
            },
          },
        },
        equipmentDeliveries: {
          select: { id: true, deliveryNumber: true, deliveryDate: true, status: true, receivedByName: true },
        },
        procurementOrders: {
          select: { id: true, referenceNumber: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = requests.map((req) => {
      let isFullyReserved = true;
      let hasShortage = false;

      const itemsWithStock = req.supplyItems.map((it) => {
        const available = Math.max(0, it.product.quantityOnHand - it.product.quantityReserved);
        const shortage = Math.max(0, it.quantityRequested - it.quantityReserved - available);
        if (it.quantityReserved < it.quantityRequested) isFullyReserved = false;
        if (shortage > 0) hasShortage = true;

        return {
          ...it,
          productAvailableStock: available,
          shortage,
        };
      });

      return {
        ...req,
        supplyItems: itemsWithStock,
        isFullyReserved,
        hasShortage,
      };
    });

    return NextResponse.json({
      success: true,
      requests: formatted,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_REQUESTS);
    if (!gate.authorized) return gate.response!;

    const body = await request.json().catch(() => ({}));
    const { serviceRequestId, items } = body;

    if (!serviceRequestId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'معرف طلب الخدمة وقائمة الأصناف المطلوبة إلزامية' },
        { status: 400 }
      );
    }

    const sReq = await prisma.serviceRequest.findUnique({
      where: { id: serviceRequestId },
    });
    if (!sReq) {
      return NextResponse.json({ error: 'طلب الخدمة غير موجود' }, { status: 404 });
    }

    const createdItems = [];
    for (const item of items) {
      if (!item.productId || !item.quantityRequested || Number(item.quantityRequested) <= 0) {
        continue;
      }

      const prod = await prisma.equipmentProduct.findUnique({
        where: { id: item.productId },
      });
      if (!prod) continue;

      const created = await prisma.supplyRequestItem.create({
        data: {
          serviceRequestId,
          productId: item.productId,
          quantityRequested: Math.floor(Number(item.quantityRequested)),
          specifications: item.specifications ? String(item.specifications).trim() : null,
          notes: item.notes ? String(item.notes).trim() : null,
        },
        include: { product: true },
      });
      createdItems.push(created);
    }

    await prisma.serviceRequest.update({
      where: { id: serviceRequestId },
      data: { fulfillmentStatus: 'REQUESTED' },
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'ADD_SUPPLY_REQUEST_ITEMS',
      entityType: 'ServiceRequest',
      entityId: serviceRequestId,
      details: `إضافة أصناف توريد لطلب الخدمة [${sReq.requestNumber}]: ${createdItems.length} صنف`,
    });

    return NextResponse.json({ success: true, items: createdItems }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
