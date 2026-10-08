import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ROLES } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

/**
 * GET /api/portal/trainee/attendance
 * Return authenticated trainee's attendance records across all their courses.
 */
export async function GET() {
  try {
    const session = await getCurrentUser(true);
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'غير مصرح لك بالوصول. يرجى تسجيل الدخول.' }, { status: 401 });
    }

    // Trainee can only view their own records
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
            minAttendancePct: true,
            status: true,
            sessions: {
              orderBy: { sessionNumber: 'asc' },
              select: {
                id: true,
                sessionNumber: true,
                title: true,
                sessionDate: true,
                startTime: true,
                endTime: true,
              },
            },
          },
        },
        attendanceRecords: {
          include: {
            session: {
              select: {
                id: true,
                sessionNumber: true,
                title: true,
              },
            },
          },
          orderBy: { sessionDate: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const attendanceSummary = registrations.map((reg) => {
      const totalSessions = reg.course.sessions.length;
      const presentCount = reg.attendanceRecords.filter((a) => a.status === 'PRESENT').length;
      const excusedCount = reg.attendanceRecords.filter((a) => a.status === 'EXCUSED').length;
      const absentCount = reg.attendanceRecords.filter((a) => a.status === 'ABSENT').length;
      const attendancePct = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100;
      const minRequired = reg.course.minAttendancePct ?? 75;
      const isEligible = attendancePct >= minRequired;

      return {
        registrationId: reg.id,
        courseId: reg.course.id,
        courseTitleAr: reg.course.titleAr,
        courseTitleEn: reg.course.titleEn,
        registrationStatus: reg.status,
        totalSessions,
        recordedSessions: reg.attendanceRecords.length,
        presentCount,
        excusedCount,
        absentCount,
        attendancePct,
        minRequiredPct: minRequired,
        isEligible,
        sessions: reg.course.sessions,
        records: reg.attendanceRecords,
      };
    });

    return NextResponse.json({
      success: true,
      data: attendanceSummary,
    });
  } catch (error: any) {
    console.error('Trainee attendance API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
