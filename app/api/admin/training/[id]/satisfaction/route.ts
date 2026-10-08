import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/admin/training/[id]/satisfaction
 * Admin view of aggregated course satisfaction analytics
 */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const evals = await prisma.courseSatisfactionEvaluation.findMany({
      where: { courseId: params.id },
      include: {
        registration: { select: { fullName: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    const totalResponses = evals.length;

    if (totalResponses === 0) {
      return NextResponse.json({
        success: true,
        summary: {
          totalResponses: 0,
          averageOverall: null,
          averageContent: null,
          averageTrainer: null,
          averageOrganization: null,
          averageUsefulness: null,
          hasSufficientData: false,
        },
        evaluations: [],
      });
    }

    const round1 = (num: number) => Math.round(num * 10) / 10;
    const avgOverall = round1(evals.reduce((sum, e) => sum + e.overallRating, 0) / totalResponses);
    const avgContent = round1(evals.reduce((sum, e) => sum + e.contentRating, 0) / totalResponses);
    const avgTrainer = round1(evals.reduce((sum, e) => sum + e.trainerRating, 0) / totalResponses);
    const avgOrg = round1(evals.reduce((sum, e) => sum + e.organizationRating, 0) / totalResponses);
    const avgUsefulness = round1(evals.reduce((sum, e) => sum + e.usefulnessRating, 0) / totalResponses);

    return NextResponse.json({
      success: true,
      summary: {
        totalResponses,
        averageOverall: avgOverall,
        averageContent: avgContent,
        averageTrainer: avgTrainer,
        averageOrganization: avgOrg,
        averageUsefulness: avgUsefulness,
        hasSufficientData: totalResponses >= 3,
      },
      evaluations: evals.map((e) => ({
        id: e.id,
        studentName: e.registration.fullName,
        overallRating: e.overallRating,
        contentRating: e.contentRating,
        trainerRating: e.trainerRating,
        organizationRating: e.organizationRating,
        usefulnessRating: e.usefulnessRating,
        comment: e.comment,
        submittedAt: e.submittedAt,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
