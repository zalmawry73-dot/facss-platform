import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import {
  validateEvaluationInput,
  VALID_EVALUATION_TYPES,
  VALID_EVALUATION_STATUSES,
} from '@/lib/validations/admin';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/admin/training/[id]/evaluations
 * Fetch pre/post evaluations for course registrations.
 */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const courseId = params.id;
    const { searchParams } = new URL(request.url);
    const registrationId = searchParams.get('registrationId');
    const typeParam = searchParams.get('type') as any;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        titleAr: true,
        titleEn: true,
        requiresPreEval: true,
        requiresPostEval: true,
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'الدورة التدريبية غير موجودة' }, { status: 404 });
    }

    const whereClause: any = {
      courseId,
      status: { in: ['ACCEPTED', 'COMPLETED'] },
    };
    if (registrationId) {
      whereClause.id = registrationId;
    }

    const registrations = await prisma.trainingRegistration.findMany({
      where: whereClause,
      include: {
        evaluations: typeParam ? { where: { type: typeParam } } : true,
      },
      orderBy: { fullName: 'asc' },
    });

    const evaluatedRoster = registrations.map((reg) => {
      const preEval = reg.evaluations.find((e) => e.type === 'PRE') || null;
      const postEval = reg.evaluations.find((e) => e.type === 'POST') || null;

      // Calculate progress / delta if both scores exist
      let deltaScore: number | null = null;
      if (preEval?.score !== null && preEval?.score !== undefined && postEval?.score !== null && postEval?.score !== undefined) {
        deltaScore = postEval.score - preEval.score;
      }

      return {
        registrationId: reg.id,
        fullName: reg.fullName,
        email: reg.email,
        phone: reg.phone,
        status: reg.status,
        preEvaluation: preEval,
        postEvaluation: postEval,
        deltaScore,
      };
    });

    return NextResponse.json({
      success: true,
      course,
      roster: evaluatedRoster,
    });
  } catch (error: any) {
    console.error('Fetch evaluations error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/training/[id]/evaluations
 * Record or update a PRE or POST evaluation for a trainee.
 */
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const courseId = params.id;
    const body = await request.json().catch(() => ({}));
    const validation = validateEvaluationInput(body);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات التقييم غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const { registrationId, type, score, maxScore, status, notes } = validation.data;

    // Verify registration belongs to this course
    const registration = await prisma.trainingRegistration.findFirst({
      where: { id: registrationId, courseId },
      include: { course: { select: { titleAr: true } } },
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'تسجيل المتدرب غير موجود أو لا ينتمي لهذه الدورة' },
        { status: 404 }
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
        score,
        maxScore: maxScore || 100,
        status: status || (score !== null ? 'COMPLETED' : 'NOT_TAKEN'),
        notes,
        evaluatedById: session?.userId,
        evaluatedAt: new Date(),
      },
      create: {
        registrationId,
        type,
        score,
        maxScore: maxScore || 100,
        status: status || (score !== null ? 'COMPLETED' : 'NOT_TAKEN'),
        notes,
        evaluatedById: session?.userId,
        evaluatedAt: new Date(),
      },
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'RECORD_TRAINING_EVALUATION',
      entityType: 'TrainingEvaluation',
      entityId: evaluation.id,
      details: `تسجيل نتيجة تقييم [${type === 'PRE' ? 'قبلي' : 'بعدي'}] للمتدرب [${registration.fullName}] بدرجة [${score ?? '-'}/${maxScore || 100}] لدورة [${registration.course.titleAr}]`,
    });

    return NextResponse.json({
      success: true,
      message: 'تم حفظ نتيجة التقييم بنجاح',
      evaluation,
    });
  } catch (error: any) {
    console.error('Save evaluation error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
