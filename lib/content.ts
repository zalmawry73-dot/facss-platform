/**
 * lib/content.ts
 * Central content fetching layer for public pages.
 * Reads from ContentBlock DB with i18n fallback.
 * Server-side only — do NOT import in 'use client' components.
 */
import prisma from './prisma';

export type Locale = 'ar' | 'en';

export interface ContentBlockData {
  id: string;
  section: string;
  key: string;
  titleAr: string | null;
  titleEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  icon: string | null;
  link: string | null;
  order: number;
  isVisible: boolean;
}

/**
 * Fetches all visible ContentBlock records for a given section.
 * Returns sorted by `order` ascending.
 */
export async function getContentSection(section: string): Promise<ContentBlockData[]> {
  try {
    if ((prisma as any).contentBlock) {
      const blocks = await (prisma as any).contentBlock.findMany({
        where: { section, isVisible: true },
        orderBy: { order: 'asc' },
        select: {
          id: true,
          section: true,
          key: true,
          titleAr: true,
          titleEn: true,
          descriptionAr: true,
          descriptionEn: true,
          icon: true,
          link: true,
          order: true,
          isVisible: true,
        },
      });
      return blocks;
    }

    const rows = await prisma.$queryRaw<ContentBlockData[]>`
      SELECT "id", "section", "key", "titleAr", "titleEn", "descriptionAr", "descriptionEn", "icon", "link", "order", "isVisible"
      FROM "ContentBlock"
      WHERE "section" = ${section} AND "isVisible" = true
      ORDER BY "order" ASC
    `;
    return rows;
  } catch (err) {
    console.error(`[content] Failed to fetch section "${section}":`, err);
    return [];
  }
}

/**
 * Fetches a single visible ContentBlock by section + key.
 * Returns null if not found or hidden.
 */
export async function getContentBlock(section: string, key: string): Promise<ContentBlockData | null> {
  try {
    if ((prisma as any).contentBlock) {
      const block = await (prisma as any).contentBlock.findUnique({
        where: { section_key: { section, key } },
        select: {
          id: true,
          section: true,
          key: true,
          titleAr: true,
          titleEn: true,
          descriptionAr: true,
          descriptionEn: true,
          icon: true,
          link: true,
          order: true,
          isVisible: true,
        },
      });
      if (!block || !block.isVisible) return null;
      return block;
    }

    const rows = await prisma.$queryRaw<ContentBlockData[]>`
      SELECT "id", "section", "key", "titleAr", "titleEn", "descriptionAr", "descriptionEn", "icon", "link", "order", "isVisible"
      FROM "ContentBlock"
      WHERE "section" = ${section} AND "key" = ${key} AND "isVisible" = true
      LIMIT 1
    `;
    return rows[0] || null;
  } catch (err) {
    console.error(`[content] Failed to fetch block "${section}/${key}":`, err);
    return null;
  }
}

/**
 * Fetches multiple sections in parallel.
 * Returns a map: section -> ContentBlockData[]
 */
export async function getContentSections(sections: string[]): Promise<Record<string, ContentBlockData[]>> {
  const results = await Promise.all(
    sections.map(async (section) => ({
      section,
      blocks: await getContentSection(section),
    }))
  );
  return Object.fromEntries(results.map(r => [r.section, r.blocks]));
}

/**
 * Helper: pick localized text from a block with fallback.
 */
export function pickText(block: ContentBlockData | null | undefined, field: 'title' | 'description', locale: Locale): string {
  if (!block) return '';
  if (field === 'title') {
    return (locale === 'ar' ? block.titleAr : block.titleEn) || block.titleAr || block.titleEn || '';
  }
  return (locale === 'ar' ? block.descriptionAr : block.descriptionEn) || block.descriptionAr || block.descriptionEn || '';
}
