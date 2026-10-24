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

/**
 * POST /api/admin/equipment/deliveries
 * Issue official equipment delivery handover (محضر تسليم واستلام).
 * Supports both pre-existing service requests AND direct ad-hoc deliveries to clients.
 */
export async function POST(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_INVENTORY);
    if (!gate.authorized) return gate.response!;

    const body = await request.json().catch(() => ({}));
    const {
      serviceRequestId,
      clientName,
      receivedByName,
      receivedByPhone,
      receivedByRole,
      deliveryLocation,
      notes,
      items,
    } = body;

    if (!receivedByName || typeof receivedByName !== 'string' || receivedByName.trim().length < 2) {
      return NextResponse.json(
        { error: 'اسم المستلم الرسمي مطلوب (حرفان على الأقل)' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'قائمة أصناف التسليم إلزامية ويجب أن تحتوي على صنف واحد على الأقل' },
        { status: 400 }
      );
    }

    // Validate item quantities
    for (const it of items) {
      if (!it.productId || !it.quantity || Number(it.quantity) <= 0) {
        return NextResponse.json(
          { error: 'بيانات الصنف والكمية المسلمة غير صالحة' },
          { status: 400 }
        );
      }
    }

    let effectiveServiceRequestId = serviceRequestId;

    // If no existing service request provided, auto-provision a formal direct delivery request
    if (!effectiveServiceRequestId) {
      const defaultService =
        (await prisma.service.findFirst({ where: { slug: 'safety-equipment-supplies' } })) ||
        (await prisma.service.findFirst());

      if (!defaultService) {
        return NextResponse.json(
          { error: 'خدمة تسليم وتوريد المعدات غير مهيأة في المنظومة' },
          { status: 500 }
        );
      }

      const reqCount = await prisma.serviceRequest.count();
      const requestNumber = `FACSS-DIR-${new Date().getFullYear()}-${String(reqCount + 1).padStart(4, '0')}`;

      const directReq = await prisma.serviceRequest.create({
        data: {
          requestNumber,
          serviceId: defaultService.id,
          organization: clientName?.trim() || 'عميل تسليم مباشر (ميداني)',
          contactName: receivedByName.trim(),
          contactEmail: 'operations@facss-direct.local',
          contactPhone: receivedByPhone?.trim() || '000000000',
          priority: 'NORMAL',
          status: 'COMPLETED',
          fulfillmentStatus: 'DELIVERED',
          description: `محضر تسليم عهدة ومعدات سلامة مباشر خارج إطار الطلبات المسبقة — الجهة: ${clientName || 'عميل مباشر'} — المستلم: ${receivedByName.trim()}`,
          assignedEmployeeId: session?.userId,
        },
      });

      effectiveServiceRequestId = directReq.id;
    }

    // Import and execute delivery transaction
    const { executeDeliveryTransaction } = await import('@/lib/equipment-rules');
    const { logActivity } = await import('@/lib/audit');

    const delivery = await executeDeliveryTransaction({
      serviceRequestId: effectiveServiceRequestId,
      receivedByName: receivedByName.trim(),
      receivedByPhone: receivedByPhone ? receivedByPhone.trim() : null,
      receivedByRole: receivedByRole ? receivedByRole.trim() : null,
      deliveryLocation: deliveryLocation ? deliveryLocation.trim() : null,
      notes: notes ? notes.trim() : null,
      actorId: session!.userId,
      actorName: session!.fullName || 'Staff',
      items: items.map((it: any) => ({
        productId: it.productId,
        quantity: Math.floor(Number(it.quantity)),
        trackedItemId: it.trackedItemId || null,
        notes: it.notes ? String(it.notes).trim() : null,
      })),
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'CREATE_DIRECT_EQUIPMENT_DELIVERY',
      entityType: 'EquipmentDelivery',
      entityId: delivery.id,
      details: `إنشاء محضر تسليم عهدة [${delivery.deliveryNumber}] للجهة [${clientName || 'عميل مباشر'}] — المستلم: [${receivedByName}]`,
    });

    return NextResponse.json(
      {
        success: true,
        message: `تم إنشاء محضر التسليم رقم [${delivery.deliveryNumber}] بنجاح وخصم الكميات من المخزون`,
        delivery,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Delivery creation error:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء إنشاء محضر التسليم' },
      { status: 500 }
    );
  }
}

