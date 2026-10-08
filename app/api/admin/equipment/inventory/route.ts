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
    const categoryId = searchParams.get('categoryId');
    const filter = searchParams.get('filter'); // 'ALL', 'LOW', 'OUT', 'AVAILABLE'

    const where: any = { isActive: true };
    if (categoryId) where.categoryId = categoryId;

    const products = await prisma.equipmentProduct.findMany({
      where,
      include: {
        category: { select: { id: true, code: true, nameAr: true } },
        trackedItems: {
          where: { status: 'AVAILABLE' },
          select: { id: true, serialNumber: true, batchNumber: true, expiryDate: true },
        },
      },
      orderBy: { nameAr: 'asc' },
    });

    const now = new Date();
    const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    let items = products.map((p) => {
      const available = Math.max(0, p.quantityOnHand - p.quantityReserved);
      const isLowStock = available > 0 && available <= p.minimumStockLevel;
      const isOutOfStock = available === 0;

      const expiringSoonCount = p.trackedItems.filter(
        (t) => t.expiryDate && new Date(t.expiryDate) >= now && new Date(t.expiryDate) <= thirtyDaysAhead
      ).length;

      const expiredCount = p.trackedItems.filter(
        (t) => t.expiryDate && new Date(t.expiryDate) < now
      ).length;

      return {
        id: p.id,
        sku: p.sku,
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        category: p.category,
        unit: p.unit,
        minimumStockLevel: p.minimumStockLevel,
        quantityOnHand: p.quantityOnHand,
        quantityReserved: p.quantityReserved,
        quantityAvailable: available,
        isLowStock,
        isOutOfStock,
        expiringSoonCount,
        expiredCount,
        trackedUnitsCount: p.trackedItems.length,
      };
    });

    if (filter === 'LOW') {
      items = items.filter((it) => it.isLowStock);
    } else if (filter === 'OUT') {
      items = items.filter((it) => it.isOutOfStock);
    } else if (filter === 'AVAILABLE') {
      items = items.filter((it) => it.quantityAvailable > 0);
    }

    const summary = {
      totalProducts: items.length,
      totalOnHand: items.reduce((s, it) => s + it.quantityOnHand, 0),
      totalReserved: items.reduce((s, it) => s + it.quantityReserved, 0),
      totalAvailable: items.reduce((s, it) => s + it.quantityAvailable, 0),
      lowStockCount: items.filter((it) => it.isLowStock).length,
      outOfStockCount: items.filter((it) => it.isOutOfStock).length,
    };

    return NextResponse.json({
      success: true,
      summary,
      inventory: items,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
