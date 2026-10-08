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
 * POST /api/admin/training/trainers/[id]/courses
 * Assign a trainer to a course
 */
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const trainer = await prisma.trainer.findUnique({
      where: { id: params.id },
    });

    if (!trainer) {
      return NextResponse.json({ error: 'المدرب غير موجود' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { courseId, role = 'LEAD_TRAINER', isLead = true } = body;

    if (!courseId) {
      return NextResponse.json({ error: 'معرّف الدورة التدريبية مطلوب' }, { status: 400 });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: 'الدورة التدريبية غير موجودة' }, { status: 404 });
    }

    const assignment = await prisma.courseTrainer.upsert({
      where: {
        courseId_trainerId: {
          courseId,
          trainerId: trainer.id,
        },
      },
      update: {
        role,
        isLead: Boolean(isLead),
      },
      create: {
        courseId,
        trainerId: trainer.id,
        role,
        isLead: Boolean(isLead),
      },
      include: {
        course: { select: { id: true, titleAr: true } },
        trainer: { select: { id: true, fullNameAr: true } },
      },
    });

    await logActivity({
      userId: session!.userId,
      userName: session!.fullName,
      action: 'ASSIGN_TRAINER_TO_COURSE',
      entityType: 'CourseTrainer',
      entityId: assignment.id,
      details: `تكليف المدرب [${trainer.fullNameAr}] بالدورة [${course.titleAr}] بصفة [${role}]`,
    });

    return NextResponse.json({ success: true, assignment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/training/trainers/[id]/courses
 * Remove trainer assignment from a course (?courseId=...)
 */
export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ error: 'معرّف الدورة التدريبية مطلوب' }, { status: 400 });
    }

    const assignment = await prisma.courseTrainer.findUnique({
      where: {
        courseId_trainerId: {
          courseId,
          trainerId: params.id,
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'التكليف غير موجود' }, { status: 404 });
    }

    await prisma.courseTrainer.delete({
      where: { id: assignment.id },
    });

    return NextResponse.json({ success: true, message: 'تم إلغاء تكليف المدرب من الدورة' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
