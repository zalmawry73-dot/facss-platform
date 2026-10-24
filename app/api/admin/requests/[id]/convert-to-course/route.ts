import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isStaffRole, ROLES, CAPABILITIES, hasCapability } from '@/lib/rbac';
import { logActivity } from '@/lib/audit';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * POST /api/admin/requests/[id]/convert-to-course
 * Seamlessly provisions a private Academy Course from a verified training Service Request.
 * Bridges the operational services pipeline with the Academy training engine.
 */
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    if (!session || !isStaffRole(session.role)) {
      return NextResponse.json({ error: 'Unauthorized: Staff authentication required' }, { status: 401 });
    }

    const canManage =
      session.role === ROLES.SUPER_ADMIN ||
      session.role === ROLES.ADMIN ||
      session.role === ROLES.SERVICE_MANAGER ||
      session.role === ROLES.TRAINING_MANAGER ||
      (await hasCapability(session, CAPABILITIES.MANAGE_REQUESTS)) ||
      (await hasCapability(session, CAPABILITIES.MANAGE_TRAINING));

    if (!canManage) {
      return NextResponse.json({ error: 'Forbidden: Missing capability to convert request to course' }, { status: 403 });
    }

    const requestId = params.id;
    const reqRecord = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: {
        service: true,
        user: { select: { id: true, fullName: true, organization: true } },
      },
    });

    if (!reqRecord) {
      return NextResponse.json({ error: 'طلب الخدمة غير موجود' }, { status: 404 });
    }

    // Find or create default course category
    let courseCategory = await prisma.courseCategory.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!courseCategory) {
      courseCategory = await prisma.courseCategory.create({
        data: {
          titleAr: 'دورات التدريب الأمني والتأهيل الميداني',
          titleEn: 'Field Security & Capacity Training',
          slug: 'field-security-training',
        },
      });
    }

    // Prepare course data
    const orgName = reqRecord.organization || reqRecord.contactName || 'الجهة المستفيدة';
    const srvTitle = reqRecord.service.titleAr;
    const courseTitleAr = `[دورة مخصصة] ${srvTitle} — ${orgName}`;
    const courseTitleEn = `[Private Training] ${reqRecord.service.titleEn || srvTitle} — ${orgName}`;

    // Unique slug generator
    const baseSlug = `private-training-${reqRecord.requestNumber.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.course.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    // Create Private Course
    const newCourse = await prisma.course.create({
      data: {
        categoryId: courseCategory.id,
        titleAr: courseTitleAr,
        titleEn: courseTitleEn,
        slug,
        descriptionAr: `دورة تدريبية متخصصة منبثقة عن طلب الخدمة الميدانية رقم [${reqRecord.requestNumber}] لصالح: ${orgName}.\n\nنطاق الاحتياج وملاحظات العميل:\n${reqRecord.description}`,
        descriptionEn: `Private tailored course generated from service request [${reqRecord.requestNumber}] for ${orgName}.`,
        courseType: 'PRIVATE_CLIENT',
        deliveryMode: 'IN_PERSON',
        clientId: reqRecord.userId || null,
        targetAudienceAr: orgName,
        targetAudienceEn: orgName,
        trainerName: 'يحدد لاحقاً من كادر المدربين المعتمدين',
        duration: 'حسب خطة التدريب الميدانية',
        location: 'العاصمة عدن / مقر الجهة الشريكة',
        capacity: 25,
        status: 'DRAFT',
      },
    });

    // Create Operational Note in Request
    await prisma.serviceRequestNote.create({
      data: {
        requestId,
        authorId: session.userId,
        authorName: session.fullName,
        note: `🎓 تم تحويل هذا الطلب واعتماد دورة تدريبية خاصة بالأكاديمية بنجاح بعنوان: "${newCourse.titleAr}" (المعرف: ${newCourse.slug}). الحالة التشغيلية للدورة الآن مسودة قيد التجهيز.`,
        isClientVisible: true,
      },
    });

    // Advance request status if it was NEW or UNDER_REVIEW
    if (['NEW', 'UNDER_REVIEW', 'CONTACTED'].includes(reqRecord.status)) {
      await prisma.serviceRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED' },
      });
    }

    // Audit Log
    await logActivity({
      userId: session.userId,
      userName: session.fullName,
      action: 'CONVERT_REQUEST_TO_COURSE',
      entityType: 'ServiceRequest',
      entityId: requestId,
      details: `تحويل طلب الخدمة [${reqRecord.requestNumber}] إلى دورة تدريبية خاصة للأكاديمية [${newCourse.titleAr}]`,
    });

    return NextResponse.json({
      success: true,
      courseId: newCourse.id,
      courseSlug: newCourse.slug,
      courseTitle: newCourse.titleAr,
      message: `تم تحويل الطلب وإنشاء الدورة التدريبية الخاصة [${newCourse.titleAr}] بنجاح بالأكاديمية.`,
    });
  } catch (error: any) {
    console.error('convert-to-course error:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ أثناء تحويل الطلب لدورة' }, { status: 500 });
  }
}
