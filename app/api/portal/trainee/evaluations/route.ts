import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/portal/trainee/evaluations
 * Return authenticated trainee's pre/post evaluation results across all their courses.
 */
export async function GET() {
  try {
    const session = await getCurrentUser(true);
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'غير مصرح لك بالوصول. يرجى تسجيل الدخول.' }, { status: 401 });
    }

    const registrations = await prisma.trainingRegistration.findMany({
      where: {
        OR: [
          { userId: session.userId },
          { email: session.email },
        ],
      },
      include: {
        course: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            requiresPreEval: true,
            requiresPostEval: true,
          },
        },
        evaluations: {
          orderBy: { type: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const evaluationsSummary = registrations.map((reg) => {
      const preEval = reg.evaluations.find((e) => e.type === 'PRE') || null;
      const postEval = reg.evaluations.find((e) => e.type === 'POST') || null;

      let scoreGain: number | null = null;
      if (preEval?.score !== null && preEval?.score !== undefined && postEval?.score !== null && postEval?.score !== undefined) {
        scoreGain = postEval.score - preEval.score;
      }

      return {
        registrationId: reg.id,
        courseId: reg.course.id,
        courseTitleAr: reg.course.titleAr,
        courseTitleEn: reg.course.titleEn,
        requiresPreEval: reg.course.requiresPreEval,
        requiresPostEval: reg.course.requiresPostEval,
        preEvaluation: preEval,
        postEvaluation: postEval,
        scoreGain,
      };
    });

    return NextResponse.json({
      success: true,
      data: evaluationsSummary,
    });
  } catch (error: any) {
    console.error('Trainee evaluations API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/portal/trainee/evaluations
 * Trainee submits their own PRE or POST evaluation response.
 */
export async function POST(request: Request) {
  try {
    const session = await getCurrentUser(true);
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'غير مصرح لك بالوصول. يرجى تسجيل الدخول.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { registrationId, type, score, maxScore = 100, notes } = body;

    if (!registrationId || !type) {
      return NextResponse.json({ error: 'معرّف التسجيل ونوع التقييم مطلوبان' }, { status: 400 });
    }

    if (!['PRE', 'POST'].includes(type)) {
      return NextResponse.json({ error: 'نوع التقييم يجب أن يكون PRE أو POST' }, { status: 400 });
    }

    // IDOR Protection: Verify registration strictly belongs to this trainee
    const registration = await prisma.trainingRegistration.findFirst({
      where: {
        id: registrationId,
        OR: [
          { userId: session.userId },
          { email: session.email },
        ],
        status: { in: ['ACCEPTED', 'COMPLETED'] },
      },
      include: {
        course: { select: { id: true, titleAr: true } },
        evaluations: { where: { type } },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'التسجيل غير موجود أو غير معتمد، أو لا تملك صلاحية التقييم له' },
        { status: 403 }
      );
    }

    // Check if evaluation was already completed
    const existing = registration.evaluations[0];
    if (existing && existing.status === 'COMPLETED') {
      return NextResponse.json(
        { error: `تم إكمال التقييم الـ ${type === 'PRE' ? 'القبلي' : 'البعدي'} مسبقاً ولا يمكن إعادة تقديمه` },
        { status: 409 }
      );
    }

    const numericScore = typeof score === 'number' ? score : parseFloat(score);
    if (isNaN(numericScore) || numericScore < 0 || numericScore > maxScore) {
      return NextResponse.json(
        { error: `الدرجة يجب أن تكون رقماً بين 0 و ${maxScore}` },
        { status: 400 }
      );
    }

    const evaluation = await prisma.trainingEvaluation.upsert({
      where: {
        registrationId_type: {
          registrationId,
          type,
        },
      },
      update: {
        score: numericScore,
        maxScore,
        status: 'COMPLETED',
        notes: notes ? String(notes).trim() : null,
        evaluatedAt: new Date(),
      },
      create: {
        registrationId,
        type,
        score: numericScore,
        maxScore,
        status: 'COMPLETED',
        notes: notes ? String(notes).trim() : null,
        evaluatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, evaluation }, { status: 201 });
  } catch (error: any) {
    console.error('Submit evaluation error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

