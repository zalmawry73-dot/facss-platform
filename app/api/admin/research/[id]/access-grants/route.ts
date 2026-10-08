import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { validateAccessGrantInput } from '@/lib/validations/admin';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/admin/research/[id]/access-grants
 * List all access grants (active & revoked) for a CLIENT_ONLY research publication.
 */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_RESEARCH);
    if (!gate.authorized) return gate.response!;

    const publicationId = params.id;

    const publication = await prisma.researchPublication.findUnique({
      where: { id: publicationId },
      select: { id: true, titleAr: true, visibility: true },
    });

    if (!publication) {
      return NextResponse.json({ error: 'الدراسة غير موجودة' }, { status: 404 });
    }

    const grants = await prisma.researchAccessGrant.findMany({
      where: { publicationId },
      orderBy: { createdAt: 'desc' },
    });

    // Populate user details for grantedTo and grantedBy
    const userIds = Array.from(
      new Set(grants.flatMap((g) => [g.grantedToUserId, g.grantedByUserId, g.revokedByUserId].filter(Boolean) as string[]))
    );

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, fullName: true, email: true, organization: true, role: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const enrichedGrants = grants.map((g) => ({
      ...g,
      client: userMap.get(g.grantedToUserId) || null,
      grantedBy: userMap.get(g.grantedByUserId) || null,
      revokedBy: g.revokedByUserId ? userMap.get(g.revokedByUserId) || null : null,
    }));

    return NextResponse.json({
      success: true,
      publication,
      grants: enrichedGrants,
    });
  } catch (error: any) {
    console.error('Fetch access grants error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/research/[id]/access-grants
 * Grant access to a client/user for a restricted research study.
 */
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_RESEARCH);
    if (!gate.authorized) return gate.response!;
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const publicationId = params.id;
    const body = await request.json().catch(() => ({}));

    const validation = validateAccessGrantInput(body);
    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات منح التصريح غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const { grantedToUserId, notes } = validation.data;

    // Verify publication exists
    const publication = await prisma.researchPublication.findUnique({
      where: { id: publicationId },
    });

    if (!publication) {
      return NextResponse.json({ error: 'الدراسة غير موجودة' }, { status: 404 });
    }

    // Verify user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: grantedToUserId },
      select: { id: true, fullName: true, email: true, organization: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'المستخدم / العميل المحدد غير موجود في النظام' }, { status: 404 });
    }

    // Upsert access grant
    const grant = await prisma.researchAccessGrant.upsert({
      where: {
        publicationId_grantedToUserId: {
          publicationId,
          grantedToUserId,
        },
      },
      update: {
        isActive: true,
        grantedByUserId: session.userId || 'admin',
        revokedAt: null,
        revokedByUserId: null,
        revokedReason: null,
        notes,
      },
      create: {
        publicationId,
        grantedToUserId,
        grantedByUserId: session.userId || 'admin',
        isActive: true,
        notes,
      },
    });

    // Notify client
    await prisma.notification.create({
      data: {
        userId: targetUser.id,
        titleAr: 'تم منحك تصريح وصول لدراسة بحثية خاصة',
        titleEn: 'Access Granted to Restricted Research Study',
        messageAr: `تم منحك تصريح رسمي للاطلاع على الدراسة الأمنية: [${publication.titleAr}].`,
        messageEn: `You have been granted official access to: [${publication.titleEn || publication.titleAr}].`,
        type: 'SUCCESS',
        link: `/portal/client/research/${publication.id}`,
      },
    }).catch((err) => console.error('Notification error on grant:', err));

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'GRANT_RESEARCH_ACCESS',
      entityType: 'ResearchAccessGrant',
      entityId: grant.id,
      details: `منح تصريح وصول للدراسة [${publication.titleAr}] للعميل [${targetUser.fullName} - ${targetUser.email}]`,
    });

    return NextResponse.json(
      {
        success: true,
        message: `تم منح تصريح الوصول للعميل [${targetUser.fullName}] بنجاح`,
        grant,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Grant research access error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/research/[id]/access-grants
 * Revoke an active access grant with mandatory justification reason.
 */
export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_RESEARCH);
    if (!gate.authorized) return gate.response!;
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const publicationId = params.id;
    const body = await request.json().catch(() => ({}));
    const { grantId, revokedReason } = body;

    if (!grantId || typeof grantId !== 'string') {
      return NextResponse.json({ error: 'معرف التصريح مطلوب' }, { status: 400 });
    }

    if (!revokedReason || typeof revokedReason !== 'string' || revokedReason.trim().length < 5) {
      return NextResponse.json(
        { error: 'سبب ومبرر سحب التصريح إلزامي لتوثيق مسار التدقيق (5 أحرف على الأقل)' },
        { status: 400 }
      );
    }

    const grant = await prisma.researchAccessGrant.findUnique({
      where: { id: grantId },
      include: {
        publication: { select: { titleAr: true } },
      },
    });

    if (!grant || grant.publicationId !== publicationId) {
      return NextResponse.json({ error: 'تصريح الوصول غير موجود' }, { status: 404 });
    }

    const updated = await prisma.researchAccessGrant.update({
      where: { id: grantId },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokedByUserId: session.userId,
        revokedReason: revokedReason.trim(),
      },
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'REVOKE_RESEARCH_ACCESS',
      entityType: 'ResearchAccessGrant',
      entityId: grantId,
      details: `سحب تصريح وصول للدراسة [${grant.publication.titleAr}] من المستخدم [${grant.grantedToUserId}]. السبب: ${revokedReason.trim()}`,
    });

    return NextResponse.json({
      success: true,
      message: 'تم سحب تصريح الوصول وتوثيق السبب في مسار التدقيق',
      grant: updated,
    });
  } catch (error: any) {
    console.error('Revoke research access error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
