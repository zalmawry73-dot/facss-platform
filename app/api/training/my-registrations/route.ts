import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ROLES } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

/**
 * GET /api/training/my-registrations
 * Returns authenticated trainee's own registrations.
 * IDOR-safe: always filters by session.userId.
 */
export async function GET() {
  try {
    const session = await getCurrentUser(true);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role gate
    const allowedRoles = [ROLES.TRAINEE, ROLES.ADMIN, ROLES.SUPER_ADMIN];
    if (!allowedRoles.includes(session.role as any)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const registrations = await prisma.trainingRegistration.findMany({
      where: { userId: session.userId },
      include: {
        course: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            duration: true,
            location: true,
            status: true,
            startDate: true,
            endDate: true,
            trainerName: true,
            hasCertificate: true,
            courseType: true,
            deliveryMode: true,
            requiresPreEval: true,
            requiresPostEval: true,
            minAttendancePct: true,
          },
        },
        certificate: {
          select: {
            id: true,
            certificateNumber: true,
            verificationCode: true,
            issueDate: true,
            grade: true,
            isRevoked: true,
          },
        },
        evaluations: {
          select: {
            id: true,
            type: true,
            score: true,
            maxScore: true,
            status: true,
          },
        },
        attendanceRecords: {
          select: {
            id: true,
            sessionDate: true,
            status: true,
          },
        },
        satisfactionEvaluation: {
          select: {
            id: true,
            overallRating: true,
            submittedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, registrations });
  } catch (error: any) {
    console.error('my-registrations error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
