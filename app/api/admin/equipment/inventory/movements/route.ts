import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { MovementType } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_INVENTORY);
    if (!gate.authorized) return gate.response!;

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const movementType = searchParams.get('movementType');
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 50));
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (productId) where.productId = productId;
    if (movementType) where.movementType = movementType as MovementType;

    const [total, movements] = await Promise.all([
      prisma.inventoryMovement.count({ where }),
      prisma.inventoryMovement.findMany({
        where,
        include: {
          product: {
            select: { id: true, sku: true, nameAr: true, nameEn: true, unit: true },
          },
          trackedItem: {
            select: { id: true, serialNumber: true, batchNumber: true },
          },
          actor: {
            select: { id: true, fullName: true, email: true },
          },
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip,
      }),
    ]);

    return NextResponse.json({
      success: true,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      movements,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
