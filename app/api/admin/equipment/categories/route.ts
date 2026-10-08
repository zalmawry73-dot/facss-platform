import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { validateCategoryInput } from '@/lib/validations/equipment';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_EQUIPMENT);
    if (!gate.authorized) return gate.response!;

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const categories = await prisma.equipmentCategory.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: [{ order: 'asc' }, { nameAr: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      categories: categories.map((c) => ({
        ...c,
        productsCount: c._count.products,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_EQUIPMENT);
    if (!gate.authorized) return gate.response!;

    const body = await request.json().catch(() => ({}));
    const validation = validateCategoryInput(body);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات تصنيف المعدات غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const { code, nameAr, nameEn, description, icon, isActive, order } = validation.data;

    const existingCode = await prisma.equipmentCategory.findUnique({
      where: { code },
    });
    if (existingCode) {
      return NextResponse.json(
        { error: `رمز التصنيف (${code}) مسجل مسبقاً` },
        { status: 409 }
      );
    }

    const category = await prisma.equipmentCategory.create({
      data: {
        code,
        nameAr,
        nameEn,
        description,
        icon,
        isActive: isActive ?? true,
        order: order ?? 0,
      },
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'CREATE_EQUIPMENT_CATEGORY',
      entityType: 'EquipmentCategory',
      entityId: category.id,
      details: `إنشاء تصنيف معدات جديد: [${category.code}] ${category.nameAr}`,
    });

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
