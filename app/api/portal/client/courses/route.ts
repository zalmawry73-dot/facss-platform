import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/portal/client/courses
 * Client Portal view of private courses conducted for the authenticated client.
 * Returns aggregated program details and completion status with strict privacy.
 */
export async function GET() {
  try {
    const session = await getCurrentUser(true);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: يجب تسجيل الدخول' }, { status: 401 });
    }

    const courses = await prisma.course.findMany({
      where: {
        clientId: session.userId,
        courseType: 'PRIVATE_CLIENT',
      },
      include: {
        category: { select: { titleAr: true, titleEn: true } },
        trainers: {
          include: {
            trainer: { select: { fullNameAr: true, professionalTitleAr: true } },
          },
        },
        registrations: {
          select: { id: true, status: true },
        },
        materials: {
          where: { isArchived: false, visibility: { in: ['ENROLLED_TRAINEES', 'PUBLIC'] } },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const serialized = courses.map((c) => {
      const totalParticipants = c.registrations.length;
      const completedCount = c.registrations.filter((r) => r.status === 'COMPLETED').length;
      const acceptedCount = c.registrations.filter((r) => r.status === 'ACCEPTED').length;

      return {
        id: c.id,
        titleAr: c.titleAr,
        titleEn: c.titleEn,
        status: c.status,
        categoryTitleAr: c.category.titleAr,
        startDate: c.startDate ? c.startDate.toISOString() : null,
        endDate: c.endDate ? c.endDate.toISOString() : null,
        duration: c.duration,
        location: c.location,
        deliveryMode: c.deliveryMode,
        capacity: c.capacity,
        trainers: c.trainers.map((t) => ({
          name: t.trainer.fullNameAr,
          title: t.trainer.professionalTitleAr,
          role: t.role,
        })),
        participantsSummary: {
          totalRegistered: totalParticipants,
          acceptedCount,
          completedCount,
          completionRate:
            totalParticipants > 0
              ? Math.round((completedCount / totalParticipants) * 100 * 10) / 10
              : null,
        },
        materialsCount: c.materials.length,
      };
    });

    return NextResponse.json({ success: true, courses: serialized });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
