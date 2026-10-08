import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hasCapability, CAPABILITIES } from '@/lib/rbac';
import { LocalStorageDriver } from '@/lib/storage';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/training/materials/[id]/download
 * Secure streaming download for training materials.
 * Defeats IDOR through strict authorization checks on course, client, and enrollment.
 */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);

    const material = await prisma.trainingMaterial.findUnique({
      where: { id: params.id },
      include: {
        course: {
          select: {
            id: true,
            courseType: true,
            clientId: true,
            status: true,
          },
        },
      },
    });

    if (!material) {
      return NextResponse.json({ error: 'المادة التدريبية غير موجودة' }, { status: 404 });
    }

    const course = material.course;

    // Staff check
    let isStaff = false;
    if (session) {
      isStaff = await hasCapability(session, CAPABILITIES.MANAGE_TRAINING);
    }

    // Enrolled trainee check
    let isEnrolled = false;
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
      if (reg) isEnrolled = true;
    }

    // Client check
    const isCourseClient = Boolean(session && course.clientId && course.clientId === session.userId);

    // Private Course Isolation:
    if (course.courseType === 'PRIVATE_CLIENT' && !isStaff && !isEnrolled && !isCourseClient) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول إلى مادة تابعة لدورة خاصة' },
        { status: 403 }
      );
    }

    // Material Visibility Authorization:
    if (material.visibility === 'INTERNAL' && !isStaff) {
      return NextResponse.json(
        { error: 'هذه المادة مخصصة للاستخدام الداخلي للمدربين فقط' },
        { status: 403 }
      );
    }

    if (material.visibility === 'ENROLLED_TRAINEES' && !isStaff && !isEnrolled && !isCourseClient) {
      return NextResponse.json(
        { error: 'المادة التدريبية متاحة فقط للمتدربين المسجلين في هذه الدورة' },
        { status: 403 }
      );
    }

    // Fetch file from storage
    const storage = new LocalStorageDriver();
    const fileResult = await storage.get(material.fileKey);

    if (!fileResult) {
      return NextResponse.json({ error: 'الملف غير موجود في خادم التخزين' }, { status: 404 });
    }

    const { buffer, mimeType } = fileResult;

    // Sanitize filename for download header
    const encodedFileName = encodeURIComponent(material.fileName || 'training-material');

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': material.mimeType || mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
