import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { validateSupplierInput } from '@/lib/validations/equipment';
import { generateReferenceNumber } from '@/lib/equipment-rules';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_PROCUREMENT);
    if (!gate.authorized) return gate.response!;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { supplierCode: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        _count: {
          select: { procurements: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      suppliers: suppliers.map((s) => ({
        ...s,
        categories: s.categories ? JSON.parse(s.categories) : [],
        procurementsCount: s._count.procurements,
      })),
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
    const validation = validateSupplierInput(body);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات المورد غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const input = validation.data;
    const supplierCode = input.supplierCode || (await generateReferenceNumber('FACSS-SUP', 'supplier', 'supplierCode'));

    const existingCode = await prisma.supplier.findUnique({
      where: { supplierCode },
    });
    if (existingCode) {
      return NextResponse.json({ error: `كود المورد (${supplierCode}) مسجل مسبقاً` }, { status: 409 });
    }

    const supplier = await prisma.supplier.create({
      data: {
        supplierCode,
        name: input.name,
        nameAr: input.nameAr,
        contactPerson: input.contactPerson,
        phone: input.phone,
        email: input.email,
        address: input.address,
        categories: input.categories ? JSON.stringify(input.categories) : null,
        taxNumber: input.taxNumber,
        commercialReg: input.commercialReg,
        status: input.status || 'ACTIVE',
        notes: input.notes,
      },
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'CREATE_SUPPLIER',
      entityType: 'Supplier',
      entityId: supplier.id,
      details: `تسجيل مورد معتمد جديد: [${supplier.supplierCode}] ${supplier.name}`,
    });

    return NextResponse.json(
      {
        success: true,
        supplier: {
          ...supplier,
          categories: supplier.categories ? JSON.parse(supplier.categories) : [],
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
