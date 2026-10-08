import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { validateCourseInput } from '@/lib/validations/admin';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get('type');
    const clientFilter = searchParams.get('clientId');

    const where: any = {};
    if (typeFilter) {
      where.courseType = typeFilter;
    }
    if (clientFilter) {
      where.clientId = clientFilter;
    }

    const [courses, categories] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          category: { select: { id: true, titleAr: true, titleEn: true } },
          client: { select: { id: true, fullName: true, organization: true, email: true } },
          trainers: {
            include: {
              trainer: {
                select: { id: true, fullNameAr: true, fullNameEn: true, professionalTitleAr: true },
              },
            },
          },
          materials: { select: { id: true } },
          registrations: { select: { id: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.courseCategory.findMany({
        select: { id: true, titleAr: true, titleEn: true },
        orderBy: { titleAr: 'asc' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      courses: courses.map((c) => ({
        ...c,
        registrationsCount: c.registrations.length,
        materialsCount: c.materials.length,
      })),
      categories,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const body = await request.json().catch(() => ({}));
    const validation = validateCourseInput(body);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات الدورة غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const {
      titleAr,
      titleEn,
      descriptionAr,
      descriptionEn,
      trainerName,
      startDate,
      endDate,
      duration,
      location,
      capacity,
      status,
      categoryId,
      requirementsAr,
      requirementsEn,
      hasCertificate,
      requiresPreEval,
      requiresPostEval,
      minAttendancePct,
      courseType,
      deliveryMode,
      clientId,
      objectivesAr,
      objectivesEn,
      targetAudienceAr,
      targetAudienceEn,
    } = validation.data;

    // Verify category exists
    const categoryExists = await prisma.courseCategory.findUnique({
      where: { id: categoryId },
    });

    if (!categoryExists) {
      return NextResponse.json({ error: 'تصنيف الدورة التدريبية غير موجود' }, { status: 400 });
    }

    // If private client course, verify client exists if clientId provided
    if (courseType === 'PRIVATE_CLIENT' && clientId) {
      const clientExists = await prisma.user.findUnique({
        where: { id: clientId },
      });
      if (!clientExists) {
        return NextResponse.json({ error: 'العميل المحدد للدورة الخاصة غير موجود' }, { status: 400 });
      }
    }

    // Generate unique slug
    const baseSlug = (titleEn || titleAr)
      .toLowerCase()
      .replace(/[^a-z0-9\u0621-\u064A-]+/g, '-')
      .replace(/^-+|-+$/g, '') || `course-${Date.now()}`;
    let slug = baseSlug;
    let count = 1;
    while (await prisma.course.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${count++}`;
    }

    const course = await prisma.course.create({
      data: {
        titleAr,
        titleEn,
        slug,
        descriptionAr,
        descriptionEn,
        trainerName,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        duration,
        location,
        capacity,
        status,
        categoryId,
        requirementsAr,
        requirementsEn,
        hasCertificate,
        requiresPreEval: requiresPreEval ?? false,
        requiresPostEval: requiresPostEval ?? false,
        minAttendancePct: minAttendancePct ?? 75,
        courseType: courseType ?? 'PUBLIC',
        deliveryMode: deliveryMode ?? 'IN_PERSON',
        clientId: clientId || null,
        objectivesAr: objectivesAr || null,
        objectivesEn: objectivesEn || null,
        targetAudienceAr: targetAudienceAr || null,
        targetAudienceEn: targetAudienceEn || null,
      },
      include: {
        category: true,
        client: { select: { id: true, fullName: true, organization: true } },
      },
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: courseType === 'PRIVATE_CLIENT' ? 'CREATE_PRIVATE_COURSE' : 'CREATE_TRAINING_COURSE',
      entityType: 'Course',
      entityId: course.id,
      details: courseType === 'PRIVATE_CLIENT'
        ? `إنشاء دورة تدريبية خاصة لعميل: [${course.titleAr}]`
        : `إنشاء برنامج تدريبي جديد: [${course.titleAr}] بالحالة [${course.status}]`,
    });

    return NextResponse.json({ success: true, course }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
