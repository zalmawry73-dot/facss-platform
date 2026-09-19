import React from 'react';
import prisma from '@/lib/prisma';
import { requireCapability, CAPABILITIES } from '@/lib/rbac';
import ResearchManager from '@/components/admin/ResearchManager';

export const revalidate = 0;

export default async function AdminResearchCMSPage() {
  // Layer 3 Authorization: Enforce Granular Capability
  await requireCapability(CAPABILITIES.MANAGE_RESEARCH, '/admin');

  const [publications, categories] = await Promise.all([
    prisma.researchPublication.findMany({
      include: {
        category: { select: { id: true, titleAr: true, titleEn: true } },
      },
      orderBy: { publicationDate: 'desc' },
    }),
    prisma.researchCategory.findMany({
      select: { id: true, titleAr: true, titleEn: true },
      orderBy: { titleAr: 'asc' },
    }),
  ]);

  const serializedPublications = publications.map((pub) => ({
    id: pub.id,
    titleAr: pub.titleAr,
    titleEn: pub.titleEn,
    slug: pub.slug,
    summaryAr: pub.summaryAr,
    summaryEn: pub.summaryEn,
    contentAr: pub.contentAr,
    contentEn: pub.contentEn,
    author: pub.author,
    categoryId: pub.categoryId,
    visibility: pub.visibility,
    status: pub.status || 'PUBLISHED',
    isFeatured: pub.isFeatured,
    viewsCount: pub.viewsCount,
    publicationDate: pub.publicationDate.toISOString(),
    category: { id: pub.category.id, titleAr: pub.category.titleAr },
  }));

  return (
    <div>
      <ResearchManager
        initialPublications={serializedPublications}
        categories={categories}
      />
    </div>
  );
}

