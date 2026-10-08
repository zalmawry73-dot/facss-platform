import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, hasCapability, ROLES } from '@/lib/rbac';

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

    const delivery = await prisma.equipmentDelivery.findUnique({
      where: { id: params.id },
      include: {
        serviceRequest: {
          include: {
            user: { select: { id: true, fullName: true, organization: true, email: true, phone: true } },
          },
        },
        deliveredBy: { select: { id: true, fullName: true, organization: true } },
        items: {
          include: {
            product: {
              include: {
                inspections: {
                  orderBy: { inspectionDate: 'desc' },
                  take: 1,
                  select: { inspectionNumber: true, result: true, inspectionDate: true },
                },
              },
            },
            trackedItem: true,
          },
        },
      },
    });

    if (!delivery) {
      return NextResponse.json({ error: 'وثيقة التسليم غير موجودة' }, { status: 404 });
    }

    // Authorization: Either staff with MANAGE_INVENTORY or the client who owns the service request
    const isStaff = await hasCapability({ userId: session.userId, role: session.role }, CAPABILITIES.MANAGE_INVENTORY);
    const isOwnerClient = session.userId === delivery.serviceRequest.userId;

    if (!isStaff && !isOwnerClient && session.role !== ROLES.SUPER_ADMIN && session.role !== ROLES.ADMIN) {
      return NextResponse.json({ error: 'غير مصرح بالوصول إلى هذه الوثيقة' }, { status: 403 });
    }

    // Format formal official handover document data
    const handoverDocument = {
      documentTitleAr: 'محضر تسليم واستلام معدات وتجهيزات أمنية وسلامة',
      documentTitleEn: 'Official Safety Equipment Delivery & Handover Report',
      centerNameAr: 'مركز عدن الأول للخدمات الأمنية والدراسات الاستراتيجية (FACSS)',
      centerNameEn: 'Aden First Center for Security Services & Strategic Studies',
      deliveryReference: delivery.deliveryNumber,
      serviceRequestNumber: delivery.serviceRequest.requestNumber,
      deliveryDate: delivery.deliveryDate,
      status: delivery.status,
      client: {
        organization: delivery.serviceRequest.organization,
        contactName: delivery.serviceRequest.contactName,
        contactPhone: delivery.serviceRequest.contactPhone,
        accountEmail: delivery.serviceRequest.user?.email || null,
      },
      deliveredBy: {
        officerName: delivery.deliveredBy.fullName,
        centerDepartment: 'إدارة الإمداد والتجهيزات الفنية والسلامة المهنية',
      },
      receivedBy: {
        representativeName: delivery.receivedByName,
        phone: delivery.receivedByPhone || delivery.serviceRequest.contactPhone,
        role: delivery.receivedByRole || 'ممثل العميل المعتمد',
        acknowledgmentTextAr: 'أقر أنا الموقع أدناه باستلام كافة المعدات والتجهيزات المبينة في هذا المحضر بحالة فنية سليمة ومطابقة للمواصفات المطلوبة.',
      },
      deliveryLocation: delivery.deliveryLocation || 'مقر العميل المعتمد',
      notes: delivery.notes,
      items: delivery.items.map((it, idx) => ({
        itemNumber: idx + 1,
        sku: it.product.sku,
        nameAr: it.product.nameAr,
        nameEn: it.product.nameEn,
        unit: it.product.unit,
        quantity: it.quantity,
        serialNumber: it.trackedItem?.serialNumber || null,
        batchNumber: it.trackedItem?.batchNumber || null,
        expiryDate: it.trackedItem?.expiryDate || null,
        inspectionStatus: it.product.inspectionRequired
          ? (it.product.inspections[0]?.result === 'PASS' ? 'معتمد ومفحوص (PASS)' : 'غير مكتمل')
          : 'غير مشمول بالفحص الفني المسبق',
        inspectionRef: it.product.inspections[0]?.inspectionNumber || null,
        notes: it.notes,
      })),
      totalQuantity: delivery.items.reduce((s, it) => s + it.quantity, 0),
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      handoverDocument,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
