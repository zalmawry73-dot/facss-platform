import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/admin/training/tna/[id]
 */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const assessment = await prisma.trainingNeedsAssessment.findUnique({
      where: { id: params.id },
      include: {
        client: { select: { id: true, fullName: true, organization: true, email: true, phone: true } },
        course: { select: { id: true, titleAr: true, status: true, startDate: true } },
        createdBy: { select: { id: true, fullName: true } },
      },
    });

    if (!assessment) {
      return NextResponse.json({ error: 'تقييم الاحتياج غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ success: true, assessment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/training/tna/[id]
 * Update TNA status, recommendations, or link to Course
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const existing = await prisma.trainingNeedsAssessment.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'تقييم الاحتياج غير موجود' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const updateData: any = {};

    if (body.status !== undefined) {
      const validStatuses = ['DRAFT', 'SUBMITTED', 'REVIEWED', 'APPROVED', 'IMPLEMENTED'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: 'حالة التقييم غير صالحة' }, { status: 400 });
      }
      updateData.status = body.status;
    }

    if (body.recommendations !== undefined) {
      updateData.recommendations = body.recommendations ? String(body.recommendations).trim() : null;
    }

    if (body.courseId !== undefined) {
      if (body.courseId) {
        const courseExists = await prisma.course.findUnique({ where: { id: body.courseId } });
        if (!courseExists) {
          return NextResponse.json({ error: 'الدورة التدريبية المحددة غير موجودة' }, { status: 400 });
        }
      }
      updateData.courseId = body.courseId || null;
    }

    if (body.participantCount !== undefined) {
      updateData.participantCount = Number(body.participantCount) || existing.participantCount;
    }

    if (body.title !== undefined) updateData.title = String(body.title).trim();

    const updated = await prisma.trainingNeedsAssessment.update({
      where: { id: params.id },
      data: updateData,
      include: {
        course: { select: { id: true, titleAr: true } },
      },
    });

    await logActivity({
      userId: session!.userId,
      userName: session!.fullName,
      action: 'UPDATE_TNA',
      entityType: 'TrainingNeedsAssessment',
      entityId: updated.id,
      details: `تحديث تقييم الاحتياج [${updated.referenceNumber}]: الحالة [${updated.status}]`,
    });

    return NextResponse.json({ success: true, assessment: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/training/tna/[id]
 */
export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    await prisma.trainingNeedsAssessment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'تم حذف تقييم الاحتياج بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
