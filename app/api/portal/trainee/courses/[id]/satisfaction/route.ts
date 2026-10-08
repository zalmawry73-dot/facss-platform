import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/portal/trainee/courses/[id]/satisfaction
 * Check if the current trainee has already submitted a course satisfaction evaluation
 */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: يجب تسجيل الدخول' }, { status: 401 });
    }

    const reg = await prisma.trainingRegistration.findFirst({
      where: {
        courseId: params.id,
        userId: session.userId,
      },
      include: {
        satisfactionEvaluation: true,
      },
    });

    if (!reg) {
      return NextResponse.json({ error: 'غير مسجل في هذه الدورة التدريبية' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      alreadySubmitted: Boolean(reg.satisfactionEvaluation),
      evaluation: reg.satisfactionEvaluation || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/portal/trainee/courses/[id]/satisfaction
 * Submit post-course satisfaction evaluation (1-5 scale)
 */
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: يجب تسجيل الدخول' }, { status: 401 });
    }

    // Verify registration in this course
    const reg = await prisma.trainingRegistration.findFirst({
      where: {
        courseId: params.id,
        OR: [
          { userId: session.userId },
          { email: session.email },
        ],
        status: { notIn: ['REJECTED'] },
      },
      include: {
        satisfactionEvaluation: true,
        course: { select: { titleAr: true } },
      },
    });

    if (!reg) {
      return NextResponse.json(
        { error: 'غير مؤهل لتقييم الدورة: يجب أن تكون مسجلاً في الدورة' },
        { status: 403 }
      );
    }

    // Duplicate prevention
    if (reg.satisfactionEvaluation) {
      return NextResponse.json(
        { error: 'تم تقديم تقييم رضا الدورة مسبقاً لهذا التسجيل ولا يمكن التقييم مجدداً' },
        { status: 409 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      contentRating,
      trainerRating,
      organizationRating,
      usefulnessRating,
      overallRating,
    } = body;
    const comment = (body.comment || body.comments || '').trim();

    const ratings = [
      { name: 'محتوى الدورة', val: contentRating },
      { name: 'أداء المدرب', val: trainerRating },
      { name: 'تنظيم البرنامج', val: organizationRating },
      { name: 'الفائدة العملية', val: usefulnessRating },
      { name: 'التقييم العام', val: overallRating },
    ];

    for (const r of ratings) {
      const num = Number(r.val);
      if (isNaN(num) || num < 1 || num > 5) {
        return NextResponse.json(
          { error: `درجة تقييم [${r.name}] يجب أن تكون رقماً بين 1 و 5` },
          { status: 400 }
        );
      }
    }

    const evaluation = await prisma.courseSatisfactionEvaluation.create({
      data: {
        registrationId: reg.id,
        courseId: params.id,
        userId: session.userId,
        contentRating: Math.round(Number(contentRating)),
        trainerRating: Math.round(Number(trainerRating)),
        organizationRating: Math.round(Number(organizationRating)),
        usefulnessRating: Math.round(Number(usefulnessRating)),
        overallRating: Math.round(Number(overallRating)),
        comment: comment ? String(comment).trim() : null,
      },
    });

    await logActivity({
      userId: session.userId,
      userName: session.fullName,
      action: 'SUBMIT_COURSE_SATISFACTION',
      entityType: 'CourseSatisfactionEvaluation',
      entityId: evaluation.id,
      details: `تقديم تقييم رضا لدورة [${reg.course.titleAr}] بتقييم عام [${evaluation.overallRating}/5]`,
    });

    return NextResponse.json({ success: true, evaluation }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'تم تقديم تقييم رضا الدورة مسبقاً لهذا التسجيل' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
