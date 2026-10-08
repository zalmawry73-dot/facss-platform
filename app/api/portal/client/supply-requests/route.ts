import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ROLES } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getCurrentUser(true);
    if (!session || (session.role !== ROLES.CLIENT && session.role !== ROLES.SUPER_ADMIN && session.role !== ROLES.ADMIN)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // Strict client isolation: only fetch requests belonging to the current user
    const where: any = {
      userId: session.userId,
      OR: [
        { supplyItems: { some: {} } },
        { service: { slug: 'safety-equipment-supplies' } },
      ],
    };

    const requests = await prisma.serviceRequest.findMany({
      where,
      include: {
        service: { select: { titleAr: true, titleEn: true } },
        supplyItems: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                nameAr: true,
                nameEn: true,
                unit: true,
                imageUrl: true,
              },
            },
          },
        },
        equipmentDeliveries: {
          select: {
            id: true,
            deliveryNumber: true,
            deliveryDate: true,
            status: true,
            receivedByName: true,
            notes: true,
            items: {
              select: {
                quantity: true,
                product: { select: { sku: true, nameAr: true, unit: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Sanitized client response: zero supplier data, zero internal stock counts
    const sanitized = requests.map((req) => ({
      id: req.id,
      requestNumber: req.requestNumber,
      organization: req.organization,
      serviceTitle: req.service.titleAr,
      status: req.status,
      fulfillmentStatus: req.fulfillmentStatus || 'REQUESTED',
      createdAt: req.createdAt,
      items: req.supplyItems.map((it) => ({
        id: it.id,
        sku: it.product.sku,
        nameAr: it.product.nameAr,
        nameEn: it.product.nameEn,
        unit: it.product.unit,
        quantityRequested: it.quantityRequested,
        quantityDelivered: it.quantityDelivered,
        specifications: it.specifications,
      })),
      deliveries: req.equipmentDeliveries.map((d) => ({
        id: d.id,
        deliveryNumber: d.deliveryNumber,
        deliveryDate: d.deliveryDate,
        status: d.status,
        receivedByName: d.receivedByName,
        deliveredItemsCount: d.items.reduce((s, it) => s + it.quantity, 0),
      })),
    }));

    return NextResponse.json({
      success: true,
      requests: sanitized,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
