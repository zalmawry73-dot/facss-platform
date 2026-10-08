import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/portal/client/courses/[id]
 * Detail view of a private client training course with aggregated training report.
 * Strictly isolates courses by clientId.
 */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: يجب تسجيل الدخول' }, { status: 401 });
    }

    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        category: { select: { titleAr: true, titleEn: true } },
        trainers: {
          include: {
            trainer: { select: { fullNameAr: true, professionalTitleAr: true } },
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
          },
        },
        materials: {
          where: { isArchived: false, visibility: { in: ['ENROLLED_TRAINEES', 'PUBLIC'] } },
          select: {
            id: true,
            title: true,
            description: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
            createdAt: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'الدورة التدريبية غير موجودة' }, { status: 404 });
    }

    // Client isolation check:
    if (course.courseType === 'PRIVATE_CLIENT' && course.clientId !== session.userId) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول إلى بيانات هذه الدورة التدريبية الخاصة' },
        { status: 403 }
      );
    }

    // Aggregate statistics
    const registrations = course.registrations;
    const totalParticipants = registrations.length;
    const completedCount = registrations.filter((r) => r.status === 'COMPLETED').length;
    const certificatesIssued = registrations.filter((r) => r.certificate && !r.certificate.isRevoked).length;

    let totalAttendance = 0;
    let attendedCount = 0;
    for (const r of registrations) {
      for (const a of r.attendanceRecords) {
        totalAttendance++;
        if (a.status === 'PRESENT') attendedCount++;
      }
    }
    const attendanceRate =
      totalAttendance > 0 ? Math.round((attendedCount / totalAttendance) * 100 * 10) / 10 : null;

    // PRE / POST improvement rate calculation
    let preCount = 0;
    let postCount = 0;
    let validPairs = 0;
    let totalGain = 0;
    for (const r of registrations) {
      const pre = r.evaluations.find((e) => e.type === 'PRE' && e.status === 'COMPLETED' && e.score !== null);
      const post = r.evaluations.find((e) => e.type === 'POST' && e.status === 'COMPLETED' && e.score !== null);
      if (pre) preCount++;
      if (post) postCount++;
      if (pre && post && pre.maxScore > 0 && post.maxScore > 0) {
        validPairs++;
        const prePct = (pre.score! / pre.maxScore) * 100;
        const postPct = (post.score! / post.maxScore) * 100;
        const gain = ((postPct - prePct) / Math.max(1, 100 - prePct)) * 100;
        totalGain += gain;
      }
    }
    const improvementRate = validPairs > 0 ? Math.round((totalGain / validPairs) * 10) / 10 : null;

    return NextResponse.json({
      success: true,
      course: {
        id: course.id,
        titleAr: course.titleAr,
        titleEn: course.titleEn,
        status: course.status,
        categoryTitleAr: course.category.titleAr,
        startDate: course.startDate,
        endDate: course.endDate,
        duration: course.duration,
        location: course.location,
        deliveryMode: course.deliveryMode,
        objectivesAr: course.objectivesAr,
        targetAudienceAr: course.targetAudienceAr,
        trainers: course.trainers.map((t) => ({
          name: t.trainer.fullNameAr,
          title: t.trainer.professionalTitleAr,
          role: t.role,
        })),
        sessionsCount: course.sessions.length,
        materials: course.materials,
        aggregatedReport: {
          totalParticipants,
          completedCount,
          completionRate:
            totalParticipants > 0 ? Math.round((completedCount / totalParticipants) * 100 * 10) / 10 : null,
          attendanceRate,
          preEvaluationsCount: preCount,
          postEvaluationsCount: postCount,
          improvementRate,
          certificatesIssued,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
