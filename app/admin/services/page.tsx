import React from 'react';
import prisma from '@/lib/prisma';
import { requireStaff } from '@/lib/rbac';
import ServicesCatalogManager from '@/components/admin/ServicesCatalogManager';

export const revalidate = 0;

export default async function AdminServicesCatalogPage() {
  await requireStaff('/admin/services');

  const categories = await prisma.serviceCategory.findMany({
    orderBy: { order: 'asc' },
    include: {
      services: {
        orderBy: { order: 'asc' },
        include: {
          _count: {
            select: { requests: true }
          }
        }
      }
    }
  });

  const totalRequests = await prisma.serviceRequest.count();

  const serializedCategories = categories.map((cat) => ({
    id: cat.id,
    titleAr: cat.titleAr,
    titleEn: cat.titleEn,
    slug: cat.slug,
    isActive: cat.isActive,
    services: cat.services.map((s) => ({
      id: s.id,
      order: s.order,
      titleAr: s.titleAr,
      titleEn: s.titleEn,
      slug: s.slug,
      isActive: s.isActive,
      requestsCount: s._count.requests,
    })),
  }));

  return (
    <ServicesCatalogManager
      categories={serializedCategories}
      totalRequests={totalRequests}
    />
  );
}
