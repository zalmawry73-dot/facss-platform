import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hasCapability, CAPABILITIES } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/training/courses/[id]/materials
 * Consumer view of course materials.
 * Enforces course isolation, trainee enrollment, and material visibility.
 */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);

    const course = await prisma.course.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        titleAr: true,
        courseType: true,
        clientId: true,
        status: true,
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'الدورة التدريبية غير موجودة' }, { status: 404 });
    }

    // Check Admin / Staff privilege
    let isStaff = false;
    if (session) {
      isStaff = await hasCapability(session, CAPABILITIES.MANAGE_TRAINING);
    }

    // Check if enrolled trainee
    let isEnrolledTrainee = false;
    if (session) {
      const reg = await prisma.trainingRegistration.findFirst({
        where: {
          courseId: course.id,
          OR: [
            { userId: session.userId },
            { email: session.email },
          ],
          status: { notIn: ['REJECTED'] },
        },
      });
      if (reg) isEnrolledTrainee = true;
    }

    // Check if private course client
    const isCourseClient = Boolean(session && course.clientId && course.clientId === session.userId);

    // Private Course Isolation Check:
    // If course is private, ONLY staff, enrolled participants, or the assigned client can view it.
    if (course.courseType === 'PRIVATE_CLIENT' && !isStaff && !isEnrolledTrainee && !isCourseClient) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول إلى هذه الدورة التدريبية الخاصة' },
        { status: 403 }
      );
    }

    // Determine allowed visibilities
    let allowedVisibilities: string[] = ['PUBLIC'];
    if (isStaff) {
      allowedVisibilities = ['INTERNAL', 'ENROLLED_TRAINEES', 'PUBLIC'];
    } else if (isEnrolledTrainee || isCourseClient) {
      allowedVisibilities = ['ENROLLED_TRAINEES', 'PUBLIC'];
    }

    const materials = await prisma.trainingMaterial.findMany({
      where: {
        courseId: course.id,
        isArchived: false,
        visibility: { in: allowedVisibilities },
      },
      select: {
        id: true,
        title: true,
        description: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        visibility: true,
        sortOrder: true,
        createdAt: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({
      success: true,
      course: {
        id: course.id,
        titleAr: course.titleAr,
        courseType: course.courseType,
      },
      materials,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
