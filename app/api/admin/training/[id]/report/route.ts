import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/admin/training/[id]/report
 * Generates an authentic Training Completion Report derived entirely from actual DB data.
 * Zero mock statistics: if data is absent, explicitly reports null / zero.
 */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        category: { select: { titleAr: true, titleEn: true } },
        client: { select: { id: true, fullName: true, organization: true, email: true } },
        trainers: {
          include: {
            trainer: {
              select: {
                id: true,
                fullNameAr: true,
                fullNameEn: true,
                professionalTitleAr: true,
              },
            },
          },
        },
        sessions: {
          orderBy: { sessionNumber: 'asc' },
        },
        registrations: {
          include: {
            attendanceRecords: true,
            evaluations: true,
            certificate: true,
            satisfactionEvaluation: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'الدورة التدريبية غير موجودة' }, { status: 404 });
    }

    const registrations = course.registrations;
    const totalRegistered = registrations.length;
    const completedCount = registrations.filter((r) => r.status === 'COMPLETED').length;
    const acceptedCount = registrations.filter((r) => r.status === 'ACCEPTED').length;

    // Attendance calculation
    let totalAttendanceRecords = 0;
    let attendedRecords = 0;
    for (const r of registrations) {
      for (const a of r.attendanceRecords) {
        totalAttendanceRecords++;
        if (a.status === 'PRESENT') {
          attendedRecords++;
        }
      }
    }
    const attendanceRate =
      totalAttendanceRecords > 0
        ? Math.round((attendedRecords / totalAttendanceRecords) * 100 * 10) / 10
        : null;

    // PRE / POST evaluations & Improvement calculation
    let preCount = 0;
    let postCount = 0;
    let validPairs = 0;
    let totalGainPct = 0;
    let zeroBaselinePairs = 0;

    for (const r of registrations) {
      const preEval = r.evaluations.find((e) => e.type === 'PRE' && e.status === 'COMPLETED' && e.score !== null);
      const postEval = r.evaluations.find((e) => e.type === 'POST' && e.status === 'COMPLETED' && e.score !== null);

      if (preEval) preCount++;
      if (postEval) postCount++;

      if (preEval && postEval && preEval.maxScore > 0 && postEval.maxScore > 0) {
        validPairs++;
        const prePct = (preEval.score! / preEval.maxScore) * 100;
        const postPct = (postEval.score! / postEval.maxScore) * 100;

        if (prePct === 0) zeroBaselinePairs++;

        const denom = Math.max(1, 100 - prePct);
        const gain = ((postPct - prePct) / denom) * 100;
        totalGainPct += gain;
      }
    }

    const averageImprovementRate =
      validPairs > 0 ? Math.round((totalGainPct / validPairs) * 10) / 10 : null;

    // Certificates issued
    const certificatesIssued = registrations.filter(
      (r) => r.certificate && !r.certificate.isRevoked
    ).length;

    // Satisfaction summary
    const satisfactionEvals = registrations
      .map((r) => r.satisfactionEvaluation)
      .filter((s): s is NonNullable<typeof s> => Boolean(s));

    const satisfactionCount = satisfactionEvals.length;
    let avgSatisfactionOverall: number | null = null;
    let avgSatisfactionContent: number | null = null;
    let avgSatisfactionTrainer: number | null = null;
    let avgSatisfactionOrg: number | null = null;
    let avgSatisfactionUsefulness: number | null = null;

    if (satisfactionCount > 0) {
      const round1 = (n: number) => Math.round(n * 10) / 10;
      avgSatisfactionOverall = round1(satisfactionEvals.reduce((s, e) => s + e.overallRating, 0) / satisfactionCount);
      avgSatisfactionContent = round1(satisfactionEvals.reduce((s, e) => s + e.contentRating, 0) / satisfactionCount);
      avgSatisfactionTrainer = round1(satisfactionEvals.reduce((s, e) => s + e.trainerRating, 0) / satisfactionCount);
      avgSatisfactionOrg = round1(satisfactionEvals.reduce((s, e) => s + e.organizationRating, 0) / satisfactionCount);
      avgSatisfactionUsefulness = round1(satisfactionEvals.reduce((s, e) => s + e.usefulnessRating, 0) / satisfactionCount);
    }

    const report = {
      courseId: course.id,
      courseTitleAr: course.titleAr,
      courseTitleEn: course.titleEn,
      courseType: course.courseType,
      categoryTitleAr: course.category.titleAr,
      status: course.status,
      startDate: course.startDate,
      endDate: course.endDate,
      duration: course.duration,
      location: course.location,
      capacity: course.capacity,
      client: course.client || null,
      trainers: course.trainers.map((ct) => ({
        id: ct.trainer.id,
        name: ct.trainer.fullNameAr,
        title: ct.trainer.professionalTitleAr,
        role: ct.role,
        isLead: ct.isLead,
      })),
      totalSessions: course.sessions.length,
      metrics: {
        totalRegistered,
        acceptedCount,
        completedCount,
        completionRate:
          totalRegistered > 0 ? Math.round((completedCount / totalRegistered) * 100 * 10) / 10 : null,
        attendanceRate,
        attendedSessionsTotal: attendedRecords,
        expectedAttendanceTotal: totalAttendanceRecords,
        preEvaluationsTaken: preCount,
        postEvaluationsTaken: postCount,
        evaluationPairsAnalyzed: validPairs,
        zeroBaselineCount: zeroBaselinePairs,
        averageImprovementRate,
        certificatesIssued,
        satisfactionResponseCount: satisfactionCount,
        averageSatisfactionOverall: avgSatisfactionOverall,
        averageSatisfactionContent: avgSatisfactionContent,
        averageSatisfactionTrainer: avgSatisfactionTrainer,
        averageSatisfactionOrganization: avgSatisfactionOrg,
        averageSatisfactionUsefulness: avgSatisfactionUsefulness,
      },
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
