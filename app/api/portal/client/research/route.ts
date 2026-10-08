import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/portal/client/research
 * List all restricted studies that the authenticated client has an active access grant for.
 */
export async function GET() {
  try {
    const session = await getCurrentUser(true);
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'غير مصرح لك بالوصول. يرجى تسجيل الدخول.' }, { status: 401 });
    }

    // Find all active access grants for this client
    const grants = await prisma.researchAccessGrant.findMany({
      where: {
        grantedToUserId: session.userId,
        isActive: true,
      },
      include: {
        publication: {
          include: {
            category: { select: { id: true, titleAr: true, titleEn: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Only return publications that are PUBLISHED
    const accessibleStudies = grants
      .filter((g) => g.publication.status === 'PUBLISHED')
      .map((g) => ({
        grantId: g.id,
        grantedAt: g.createdAt,
        id: g.publication.id,
        titleAr: g.publication.titleAr,
        titleEn: g.publication.titleEn,
        slug: g.publication.slug,
        author: g.publication.author,
        summaryAr: g.publication.summaryAr,
        summaryEn: g.publication.summaryEn,
        publicationDate: g.publication.publicationDate,
        visibility: g.publication.visibility,
        category: g.publication.category,
        hasPdf: Boolean(g.publication.pdfPath),
      }));

    return NextResponse.json({
      success: true,
      studies: accessibleStudies,
    });
  } catch (error: any) {
    console.error('Client research list API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
