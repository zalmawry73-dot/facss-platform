import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ROLES } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUser(true);
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const req = await prisma.serviceRequest.findUnique({
      where: { id: params.id },
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
                descriptionAr: true,
                imageUrl: true,
              },
            },
          },
        },
        equipmentDeliveries: {
          include: {
            deliveredBy: { select: { fullName: true } },
            items: {
              include: {
                product: { select: { sku: true, nameAr: true, unit: true } },
                trackedItem: { select: { serialNumber: true } },
              },
            },
          },
          orderBy: { deliveryDate: 'desc' },
        },
      },
    });

    if (!req) {
      return NextResponse.json({ error: 'طلب التوريد غير موجود' }, { status: 404 });
    }

    // Strict IDOR Check: Ensure request belongs to user (or Super Admin / Admin)
    const isOwner = req.userId === session.userId;
    const isAdmin = session.role === ROLES.SUPER_ADMIN || session.role === ROLES.ADMIN;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'غير مصرح بالوصول إلى هذا الطلب (IDOR Protected)' }, { status: 403 });
    }

    // Sanitized client response: zero supplier data, zero internal stock counts, zero procurement internal notes
    const sanitized = {
      id: req.id,
      requestNumber: req.requestNumber,
      organization: req.organization,
      contactName: req.contactName,
      contactPhone: req.contactPhone,
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
        description: it.product.descriptionAr,
        quantityRequested: it.quantityRequested,
        quantityDelivered: it.quantityDelivered,
        specifications: it.specifications,
      })),
      deliveries: req.equipmentDeliveries.map((d) => ({
        id: d.id,
        deliveryNumber: d.deliveryNumber,
        deliveryDate: d.deliveryDate,
        status: d.status,
        deliveredByOfficer: d.deliveredBy.fullName,
        receivedByName: d.receivedByName,
        deliveryLocation: d.deliveryLocation,
        notes: d.notes,
        items: d.items.map((it) => ({
          sku: it.product.sku,
          nameAr: it.product.nameAr,
          unit: it.product.unit,
          quantity: it.quantity,
          serialNumber: it.trackedItem?.serialNumber || null,
        })),
      })),
    };

    return NextResponse.json({
      success: true,
      request: sanitized,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
