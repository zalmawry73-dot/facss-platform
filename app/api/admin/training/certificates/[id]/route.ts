import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability, ROLES } from '@/lib/rbac';
import { logActivity } from '@/lib/audit';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/admin/training/certificates/[id]
 * Admin: Get single certificate details.
 */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const certificate = await prisma.certificate.findUnique({
      where: { id: params.id },
      include: {
        registration: {
          include: {
            course: { select: { id: true, titleAr: true, titleEn: true } },
          },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json({ error: 'الشهادة غير موجودة' }, { status: 404 });
    }

    return NextResponse.json({ success: true, certificate });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/training/certificates/[id]
 * Admin: Revoke a certificate.
 * Only ADMIN and SUPER_ADMIN can revoke certificates.
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized || !session) return gate.response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Additional admin-level gate for revocation
    if (session.role !== ROLES.SUPER_ADMIN && session.role !== ROLES.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden: إلغاء الشهادات متاح فقط لمسؤولي النظام (ADMIN/SUPER_ADMIN)' },
        { status: 403 }
      );
    }

    const certificate = await prisma.certificate.findUnique({
      where: { id: params.id },
      include: {
        registration: {
          select: { userId: true, fullName: true, course: { select: { titleAr: true, titleEn: true } } },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json({ error: 'الشهادة غير موجودة' }, { status: 404 });
    }

    if (certificate.isRevoked) {
      return NextResponse.json(
        { error: `هذه الشهادة ملغاة بالفعل منذ ${certificate.revokedAt?.toISOString()}` },
        { status: 409 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const reason = body.reason && typeof body.reason === 'string' ? body.reason.trim() : 'لم يُحدد السبب';

    const revoked = await prisma.certificate.update({
      where: { id: params.id },
      data: {
        isRevoked: true,
        revokedReason: reason,
        revokedAt: new Date(),
      },
    });

    // Send notification to trainee
    if (certificate.registration.userId) {
      await prisma.notification.create({
        data: {
          userId: certificate.registration.userId,
          titleAr: 'إشعار بإلغاء الشهادة التدريبية',
          titleEn: 'Training Certificate Revocation Notice',
          messageAr: `تم إلغاء الشهادة التدريبية رقم [${certificate.certificateNumber}]. يرجى مراجعة إدارة التدريب.`,
          messageEn: `Training certificate [${certificate.certificateNumber}] has been revoked. Please contact training administration.`,
          type: 'ALERT',
          link: '/portal/trainee/certificates',
        },
      }).catch(err => console.error('Notification error on cert revocation:', err));
    }

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'REVOKE_CERTIFICATE',
      entityType: 'Certificate',
      entityId: params.id,
      details: `إلغاء شهادة [${certificate.certificateNumber}] للمتدرب [${certificate.registration.fullName}] — السبب: ${reason}`,
    });

    return NextResponse.json({
      success: true,
      message: `تم إلغاء الشهادة [${certificate.certificateNumber}] بنجاح`,
      certificate: revoked,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
