import React from 'react';
import prisma from '@/lib/prisma';
import { requireCapability, CAPABILITIES } from '@/lib/rbac';
import EquipmentManager from '@/components/admin/EquipmentManager';
import { calculateExecutiveKpis } from '@/lib/kpi-engine';

export const revalidate = 0;

export default async function AdminEquipmentPage() {
  // Layer 3 RBAC Authorization: Enforce Granular Capability
  await requireCapability(CAPABILITIES.MANAGE_EQUIPMENT, '/admin');

  const [categories, products, suppliers, kpis] = await Promise.all([
    prisma.equipmentCategory.findMany({
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
      take: 50,
    }),
    prisma.supplier.findMany({
      include: {
        _count: { select: { procurements: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    calculateExecutiveKpis('30d').catch(() => null),
  ]);

  const serializedProducts = products.map((p) => {
    const available = Math.max(0, p.quantityOnHand - p.quantityReserved);
    return {
      id: p.id,
      sku: p.sku,
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      categoryId: p.categoryId,
      category: p.category,
      unit: p.unit,
      manufacturer: p.manufacturer,
      brand: p.brand,
      model: p.model,
      specifications: p.specifications,
      imageUrl: p.imageUrl,
      isActive: p.isActive,
      inspectionRequired: p.inspectionRequired,
      maintenanceRequired: p.maintenanceRequired,
      expiryTrackingRequired: p.expiryTrackingRequired,
      serialTrackingRequired: p.serialTrackingRequired,
      minimumStockLevel: p.minimumStockLevel,
      quantityOnHand: p.quantityOnHand,
      quantityReserved: p.quantityReserved,
      quantityAvailable: available,
      isLowStock: available > 0 && available <= p.minimumStockLevel,
      isOutOfStock: available === 0,
      latestInspection: p.inspections[0] || null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  });

  const serializedCategories = categories.map((c) => ({
    id: c.id,
    code: c.code,
    nameAr: c.nameAr,
    nameEn: c.nameEn,
    description: c.description,
    isActive: c.isActive,
    order: c.order,
  }));

  const serializedSuppliers = suppliers.map((s) => ({
    id: s.id,
    supplierCode: s.supplierCode,
    name: s.name,
    nameAr: s.nameAr,
    contactPerson: s.contactPerson,
    phone: s.phone,
    email: s.email,
    address: s.address,
    categories: s.categories ? JSON.parse(s.categories) : [],
    status: s.status,
    procurementsCount: s._count.procurements,
  }));

  return (
    <EquipmentManager
      initialCategories={serializedCategories}
      initialProducts={serializedProducts}
      initialSuppliers={serializedSuppliers}
      initialKpis={kpis}
    />
  );
}
