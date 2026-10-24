import React from 'react';
import prisma from '@/lib/prisma';
import { requireAuth, getUserCapabilities, CAPABILITIES, ROLES } from '@/lib/rbac';
import { redirect } from 'next/navigation';
import ServicesCatalogManager from '@/components/admin/ServicesCatalogManager';

export const revalidate = 0;

export default async function AdminServicesCatalogPage() {
  const session = await requireAuth('/admin/services');

  if (session.role !== ROLES.SUPER_ADMIN && session.role !== ROLES.ADMIN) {
    const caps = await getUserCapabilities(session.userId, session.role);
    const canAccess = caps.includes(CAPABILITIES.MANAGE_REQUESTS) || caps.includes(CAPABILITIES.MANAGE_CONTENT);
    if (!canAccess) {
      redirect('/admin?error=forbidden');
    }
  }

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
      shortDescAr: s.shortDescAr,
      shortDescEn: s.shortDescEn,
      fullDescAr: s.fullDescAr,
      fullDescEn: s.fullDescEn,
      featuresAr: s.featuresAr,
      featuresEn: s.featuresEn,
      processAr: s.processAr,
      processEn: s.processEn,
      targetSectorsAr: s.targetSectorsAr,
      targetSectorsEn: s.targetSectorsEn,
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
