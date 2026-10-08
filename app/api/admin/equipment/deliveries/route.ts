import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_INVENTORY);
    if (!gate.authorized) return gate.response!;

    const { searchParams } = new URL(request.url);
    const serviceRequestId = searchParams.get('serviceRequestId');

    const where: any = {};
    if (serviceRequestId) where.serviceRequestId = serviceRequestId;

    const deliveries = await prisma.equipmentDelivery.findMany({
      where,
      include: {
        serviceRequest: {
          select: {
            id: true,
            requestNumber: true,
            organization: true,
            contactName: true,
            contactPhone: true,
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
        deliveredBy: { select: { id: true, fullName: true } },
        items: {
          include: {
            product: { select: { id: true, sku: true, nameAr: true, nameEn: true, unit: true } },
            trackedItem: { select: { id: true, serialNumber: true, batchNumber: true } },
          },
        },
      },
      orderBy: { deliveryDate: 'desc' },
    });

    return NextResponse.json({
      success: true,
      deliveries: deliveries.map((d) => ({
        ...d,
        totalItemsCount: d.items.reduce((s, it) => s + it.quantity, 0),
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
