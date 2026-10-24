import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { calculateExecutiveKpis } from '@/lib/kpi-engine';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/equipment/overview
 * Unified single-call endpoint that concurrently retrieves all equipment, inventory,
 * procurement, inspection, and delivery summary indicators in a single server round-trip.
 * Replaces 8 sequential client HTTP requests to dramatically accelerate dashboard load times.
 */
export async function GET() {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_EQUIPMENT);
    if (!gate.authorized) return gate.response!;

    // Concurrently fetch all operational datasets in parallel
    const [
      categories,
      products,
      suppliers,
      procurements,
      movements,
      inspections,
      maintenances,
      deliveries,
      kpis,
    ] = await Promise.all([
      prisma.equipmentCategory.findMany({
        where: { isActive: true },
        select: { id: true, code: true, nameAr: true, nameEn: true, order: true },
        orderBy: [{ order: 'asc' }, { nameAr: 'asc' }],
      }),
      prisma.equipmentProduct.findMany({
        include: {
          category: { select: { id: true, code: true, nameAr: true, nameEn: true } },
          inspections: {
            orderBy: { inspectionDate: 'desc' },
            take: 1,
            select: { id: true, result: true, inspectionDate: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supplier.findMany({
        include: {
          _count: { select: { procurements: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.procurementOrder.findMany({
        include: {
          supplier: { select: { id: true, name: true, nameAr: true, supplierCode: true } },
          items: {
            include: {
              product: { select: { id: true, sku: true, nameAr: true, nameEn: true, unit: true } },
            },
          },
          receivings: { select: { id: true, receivingNumber: true } },
        },
        orderBy: { orderDate: 'desc' },
        take: 30,
      }),
      prisma.inventoryMovement.findMany({
        include: {
          product: { select: { id: true, sku: true, nameAr: true, nameEn: true, unit: true } },
        },
        orderBy: { timestamp: 'desc' },
        take: 30,
      }),
      prisma.equipmentInspection.findMany({
        include: {
          product: { select: { id: true, sku: true, nameAr: true, nameEn: true } },
          inspector: { select: { id: true, fullName: true } },
        },
        orderBy: { inspectionDate: 'desc' },
        take: 30,
      }),
      prisma.equipmentMaintenance.findMany({
        include: {
          product: { select: { id: true, sku: true, nameAr: true, nameEn: true } },
        },
        orderBy: { maintenanceDate: 'desc' },
        take: 30,
      }),
      prisma.equipmentDelivery.findMany({
        include: {
          serviceRequest: {
            select: {
              id: true,
              requestNumber: true,
              organization: true,
              contactName: true,
              contactPhone: true,
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
        take: 30,
      }),
      calculateExecutiveKpis('30d').catch(() => null),
    ]);

    // Format products with availability metrics
    const formattedProducts = products.map((p) => {
      const available = Math.max(0, p.quantityOnHand - p.quantityReserved);
      return {
        ...p,
        quantityAvailable: available,
        isLowStock: available > 0 && available <= p.minimumStockLevel,
        isOutOfStock: available === 0,
        latestInspection: p.inspections[0] || null,
      };
    });

    // Compute inventory summary statistics
    const totalOnHand = products.reduce((s, p) => s + p.quantityOnHand, 0);
    const totalReserved = products.reduce((s, p) => s + p.quantityReserved, 0);
    const totalAvailable = Math.max(0, totalOnHand - totalReserved);
    const lowStockCount = formattedProducts.filter((p) => p.isLowStock).length;
    const outOfStockCount = formattedProducts.filter((p) => p.isOutOfStock).length;

    const inventorySummary = {
      totalProducts: products.length,
      totalOnHand,
      totalReserved,
      totalAvailable,
      lowStockCount,
      outOfStockCount,
    };

    return NextResponse.json({
      success: true,
      categories,
      products: formattedProducts,
      suppliers: suppliers.map((s) => ({
        ...s,
        procurementsCount: s._count?.procurements || 0,
      })),
      procurements: procurements.map((o) => ({
        ...o,
        receivingsCount: o.receivings.length,
      })),
      inventorySummary,
      movements,
      inspections,
      maintenances,
      deliveries: deliveries.map((d) => ({
        ...d,
        totalItemsCount: d.items.reduce((s, it) => s + it.quantity, 0),
      })),
      kpis,
    });
  } catch (error: any) {
    console.error('Equipment overview API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
