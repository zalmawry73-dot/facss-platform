import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/training/available-courses
 * Public/Trainee: List courses available for registration (status = OPEN).
 * Includes active registration count for capacity display.
 */
export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      where: { status: 'OPEN', courseType: 'PUBLIC' },
      include: {
        category: { select: { id: true, titleAr: true, titleEn: true } },
        registrations: {
          where: {
            status: { in: ['PENDING', 'REVIEWING', 'ACCEPTED'] },
          },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const serialized = courses.map((c) => ({
      id: c.id,
      titleAr: c.titleAr,
      titleEn: c.titleEn,
      descriptionAr: c.descriptionAr,
      descriptionEn: c.descriptionEn,
      duration: c.duration,
      location: c.location,
      capacity: c.capacity,
      status: c.status,
      trainerName: c.trainerName,
      startDate: c.startDate ? c.startDate.toISOString() : null,
      endDate: c.endDate ? c.endDate.toISOString() : null,
      hasCertificate: c.hasCertificate,
      category: c.category,
      activeRegistrations: c.registrations.length,
    }));

    return NextResponse.json({ success: true, courses: serialized });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
