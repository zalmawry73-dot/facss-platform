import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability, ROLES } from '@/lib/rbac';
import { validateResearchReviewAction } from '@/lib/validations/admin';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/admin/research/[id]/review
 * List the complete review history and logs for a publication.
 */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_RESEARCH);
    if (!gate.authorized) return gate.response!;

    const publicationId = params.id;

    const publication = await prisma.researchPublication.findUnique({
      where: { id: publicationId },
      select: {
        id: true,
        titleAr: true,
        titleEn: true,
        status: true,
        visibility: true,
        author: true,
        submittedById: true,
        approvedById: true,
        approvedAt: true,
        rejectedReason: true,
      },
    });

    if (!publication) {
      return NextResponse.json({ error: 'الدراسة غير موجودة' }, { status: 404 });
    }

    const reviewLogs = await prisma.researchReviewLog.findMany({
      where: { publicationId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      publication,
      reviewLogs,
    });
  } catch (error: any) {
    console.error('Fetch research review logs error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/research/[id]/review
 * Advance research review state (SUBMIT, REVIEW, APPROVE, REJECT, RETURN, PUBLISH).
 * Authority:
 * - APPROVE, REJECT, PUBLISH: Restricted to ADMIN and SUPER_ADMIN.
 * - SUBMIT, START_REVIEW, RETURN_FOR_REVISION: Available to RESEARCH_MANAGER, ADMIN, SUPER_ADMIN.
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

    const validation = validateResearchReviewAction(body);
    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات إجراء المراجعة غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const { action, comments } = validation.data;

    const publication = await prisma.researchPublication.findUnique({
      where: { id: publicationId },
    });

    if (!publication) {
      return NextResponse.json({ error: 'الدراسة غير موجودة' }, { status: 404 });
    }

    const userRole = session.role;
    const isAdminOrSuper = userRole === ROLES.ADMIN || userRole === ROLES.SUPER_ADMIN;

    // RBAC Decision enforcement: APPROVE and PUBLISH restricted to ADMIN / SUPER_ADMIN
    if ((action === 'APPROVE' || action === 'PUBLISH' || action === 'REJECT') && !isAdminOrSuper) {
      return NextResponse.json(
        {
          error:
            'الاعتماد النهائي أو الرفض أو النشر محصور حصراً بإدارة المركز العليا (ADMIN / SUPER_ADMIN). بصفتك باحثاً أو مسؤول بحوث يمكنك المراجعة وطلب التعديل فقط.',
        },
        { status: 403 }
      );
    }

    let nextStatus: any = publication.status;
    const updateData: any = {};

    switch (action) {
      case 'SUBMIT_FOR_REVIEW':
        if (publication.status !== 'DRAFT') {
          return NextResponse.json(
            { error: `لا يمكن إرسال دراسة بحالة [${publication.status}] للمراجعة. يجب أن تكون مسودة (DRAFT).` },
            { status: 400 }
          );
        }
        nextStatus = 'SUBMITTED';
        updateData.submittedById = session.userId;
        break;

      case 'START_REVIEW':
        if (publication.status !== 'SUBMITTED') {
          return NextResponse.json(
            { error: `لا يمكن بدء المراجعة إلا لدراسة مرسلة بحالة (SUBMITTED). الحالة الحالية: [${publication.status}].` },
            { status: 400 }
          );
        }
        nextStatus = 'UNDER_REVIEW';
        break;

      case 'RETURN_FOR_REVISION':
        if (publication.status !== 'SUBMITTED' && publication.status !== 'UNDER_REVIEW') {
          return NextResponse.json(
            { error: `لا يمكن إعادة الدراسة للتعديل إلا إذا كانت قيد المراجعة أو مرسلة.` },
            { status: 400 }
          );
        }
        nextStatus = 'DRAFT';
        break;

      case 'REJECT':
        if (publication.status !== 'SUBMITTED' && publication.status !== 'UNDER_REVIEW') {
          return NextResponse.json(
            { error: `لا يمكن رفض دراسة إلا إذا كانت قيد المراجعة أو مرسلة.` },
            { status: 400 }
          );
        }
        nextStatus = 'REJECTED';
        updateData.rejectedReason = comments;
        break;

      case 'APPROVE':
        if (publication.status !== 'UNDER_REVIEW' && publication.status !== 'SUBMITTED') {
          return NextResponse.json(
            { error: `لا يمكن اعتماد دراسة إلا بعد مراجعتها (قيد المراجعة أو مرسلة).` },
            { status: 400 }
          );
        }
        nextStatus = 'APPROVED';
        updateData.approvedById = session.userId;
        updateData.approvedAt = new Date();
        break;

      case 'PUBLISH':
        if (publication.status !== 'APPROVED') {
          return NextResponse.json(
            {
              error: `لا يمكن نشر الدراسة مباشرة. يجب أن تكون معتمدة أولاً من إدارة المركز (APPROVED). الحالة الحالية: [${publication.status}].`,
            },
            { status: 400 }
          );
        }
        nextStatus = 'PUBLISHED';
        break;

      default:
        return NextResponse.json({ error: 'إجراء غير مدعوم' }, { status: 400 });
    }

    updateData.status = nextStatus;

    // Update publication and log in transaction
    const [updatedPub, reviewLog] = await prisma.$transaction([
      prisma.researchPublication.update({
        where: { id: publicationId },
        data: updateData,
      }),
      prisma.researchReviewLog.create({
        data: {
          publicationId,
          action,
          fromStatus: publication.status,
          toStatus: nextStatus,
          reviewerUserId: session.userId || 'system',
          reviewerName: session.fullName || 'مسؤول النظام',
          comments: comments || null,
        },
      }),
    ]);

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: `RESEARCH_${action}`,
      entityType: 'ResearchPublication',
      entityId: publicationId,
      details: `تنفيذ إجراء [${action}] على دراسة [${publication.titleAr}]: تحويل الحالة من [${publication.status}] إلى [${nextStatus}].`,
    });

    return NextResponse.json({
      success: true,
      message: `تم تنفيذ الإجراء [${action}] وتحويل الحالة إلى [${nextStatus}] بنجاح`,
      publication: updatedPub,
      reviewLog,
    });
  } catch (error: any) {
    console.error('Research review action error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
