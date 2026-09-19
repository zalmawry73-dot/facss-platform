import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { validateResearchInput } from '@/lib/validations/admin';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_RESEARCH);
    if (!gate.authorized) return gate.response!;

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

    return NextResponse.json({
      success: true,
      publications,
      categories,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_RESEARCH);
    if (!gate.authorized) return gate.response!;

    const body = await request.json().catch(() => ({}));
    const validation = validateResearchInput(body);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات البحث غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const {
      titleAr,
      titleEn,
      summaryAr,
      summaryEn,
      contentAr,
      contentEn,
      author,
      categoryId,
      visibility,
      status,
      isFeatured,
    } = validation.data;

    // Verify category exists
    const categoryExists = await prisma.researchCategory.findUnique({
      where: { id: categoryId },
    });

    if (!categoryExists) {
      return NextResponse.json({ error: 'تصنيف البحث غير موجود' }, { status: 400 });
    }

    // Generate unique slug
    const baseSlug = (titleEn || titleAr)
      .toLowerCase()
      .replace(/[^a-z0-9\u0621-\u064A-]+/g, '-')
      .replace(/^-+|-+$/g, '') || `study-${Date.now()}`;
    let slug = baseSlug;
    let count = 1;
    while (await prisma.researchPublication.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${count++}`;
    }

    const publication = await prisma.researchPublication.create({
      data: {
        titleAr,
        titleEn,
        slug,
        summaryAr,
        summaryEn,
        contentAr,
        contentEn,
        author,
        categoryId,
        visibility,
        status,
        isFeatured: Boolean(isFeatured),
      },
      include: {
        category: true,
      },
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'CREATE_RESEARCH_PUBLICATION',
      entityType: 'ResearchPublication',
      entityId: publication.id,
      details: `إنشاء دراسة استراتيجية: [${publication.titleAr}] - الرؤية: [${publication.visibility}] - الحالة: [${publication.status}]`,
    });

    return NextResponse.json({ success: true, publication }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
