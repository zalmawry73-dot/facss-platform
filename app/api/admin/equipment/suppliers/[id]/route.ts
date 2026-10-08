import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { validateSupplierInput } from '@/lib/validations/equipment';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_PROCUREMENT);
    if (!gate.authorized) return gate.response!;

    const supplier = await prisma.supplier.findUnique({
      where: { id: params.id },
      include: {
        procurements: {
          orderBy: { orderDate: 'desc' },
          take: 20,
          include: {
            items: {
              include: { product: { select: { sku: true, nameAr: true, unit: true } } },
            },
          },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json({ error: 'المورد غير موجود' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      supplier: {
        ...supplier,
        categories: supplier.categories ? JSON.parse(supplier.categories) : [],
      },
    });
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

    const existing = await prisma.supplier.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'المورد غير موجود' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const validation = validateSupplierInput(body, true);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات التحديث غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const input = validation.data;
    const updateData: any = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.nameAr !== undefined) updateData.nameAr = input.nameAr;
    if (input.contactPerson !== undefined) updateData.contactPerson = input.contactPerson;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.address !== undefined) updateData.address = input.address;
    if (input.categories !== undefined) updateData.categories = input.categories ? JSON.stringify(input.categories) : null;
    if (input.taxNumber !== undefined) updateData.taxNumber = input.taxNumber;
    if (input.commercialReg !== undefined) updateData.commercialReg = input.commercialReg;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.notes !== undefined) updateData.notes = input.notes;

    const updated = await prisma.supplier.update({
      where: { id: params.id },
      data: updateData,
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'UPDATE_SUPPLIER',
      entityType: 'Supplier',
      entityId: updated.id,
      details: `تحديث بيانات المورد: [${updated.supplierCode}] ${updated.name}`,
    });

    return NextResponse.json({
      success: true,
      supplier: {
        ...updated,
        categories: updated.categories ? JSON.parse(updated.categories) : [],
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_PROCUREMENT);
    if (!gate.authorized) return gate.response!;

    const supplier = await prisma.supplier.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { procurements: true } },
      },
    });

    if (!supplier) {
      return NextResponse.json({ error: 'المورد غير موجود' }, { status: 404 });
    }

    if (supplier._count.procurements > 0) {
      const deactivated = await prisma.supplier.update({
        where: { id: params.id },
        data: { status: 'INACTIVE' },
      });

      await logActivity({
        userId: session?.userId,
        userName: session?.fullName,
        action: 'DEACTIVATE_SUPPLIER',
        entityType: 'Supplier',
        entityId: supplier.id,
        details: `إيقاف التعامل مع المورد [${supplier.supplierCode}] ${supplier.name} وأرشفته لوجود أوامر شراء مرتبطة به`,
      });

      return NextResponse.json({
        success: true,
        message: 'تم إيقاف التعامل مع المورد وأرشفته بأمان حفاظاً على السجل التاريخي للمشتريات',
        supplier: deactivated,
      });
    }

    await prisma.supplier.delete({
      where: { id: params.id },
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'DELETE_SUPPLIER',
      entityType: 'Supplier',
      entityId: params.id,
      details: `حذف سجل مورد جديد بدون عمليات سابقة: [${supplier.supplierCode}] ${supplier.name}`,
    });

    return NextResponse.json({ success: true, message: 'تم حذف المورد بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
