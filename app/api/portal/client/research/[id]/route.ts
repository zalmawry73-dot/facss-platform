import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ROLES } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/portal/client/research/[id]
 * Retrieve full restricted research study content with strict server-side access grant validation.
 */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'غير مصرح لك بالوصول. يرجى تسجيل الدخول أولاً.' }, { status: 401 });
    }

    const publicationId = params.id;

    const publication = await prisma.researchPublication.findUnique({
      where: { id: publicationId },
      include: {
        category: { select: { id: true, titleAr: true, titleEn: true } },
      },
    });

    if (!publication) {
      return NextResponse.json({ error: 'الدراسة غير موجودة' }, { status: 404 });
    }

    // Admins always have access
    const isAdmin = session.role === ROLES.ADMIN || session.role === ROLES.SUPER_ADMIN;

    if (!isAdmin) {
      // Must be published
      if (publication.status !== 'PUBLISHED') {
        return NextResponse.json({ error: 'هذه الدراسة غير متاحة للعرض حالياً.' }, { status: 403 });
      }

      // If CLIENT_ONLY, verify active grant
      if (publication.visibility === 'CLIENT_ONLY') {
        const activeGrant = await prisma.researchAccessGrant.findFirst({
          where: {
            publicationId,
            grantedToUserId: session.userId,
            isActive: true,
          },
        });

        if (!activeGrant) {
          return NextResponse.json(
            {
              error: 'عذراً، هذه الدراسة مخصصة لعملاء محددين بتصريح مسبق. لا تملك تصريح وصول نشط لهذه المادة.',
              isRestricted: true,
            },
            { status: 403 }
          );
        }
      }
    }

    // Increment views count safely
    await prisma.researchPublication.update({
      where: { id: publicationId },
      data: { viewsCount: { increment: 1 } },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      study: {
        id: publication.id,
        titleAr: publication.titleAr,
        titleEn: publication.titleEn,
        slug: publication.slug,
        author: publication.author,
        summaryAr: publication.summaryAr,
        summaryEn: publication.summaryEn,
        contentAr: publication.contentAr,
        contentEn: publication.contentEn,
        publicationDate: publication.publicationDate,
        visibility: publication.visibility,
        category: publication.category,
        viewsCount: publication.viewsCount + 1,
        pdfPath: publication.pdfPath,
      },
    });
  } catch (error: any) {
    console.error('Fetch restricted study error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
