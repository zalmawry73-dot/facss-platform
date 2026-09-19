import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ROLES } from '@/lib/rbac';
import { validateRegistrationInput } from '@/lib/validations/admin';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/training/register
 * Trainee self-registration for a course.
 * Gate: Authenticated + TRAINEE role (or ADMIN/SUPER_ADMIN)
 * Enforces: capacity control, course status, duplicate prevention.
 */
export async function POST(request: Request) {
  try {
    const session = await getCurrentUser(true);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: يجب تسجيل الدخول أولاً' }, { status: 401 });
    }

    // Role gate: only TRAINEE, ADMIN, SUPER_ADMIN can register
    const allowedRoles = [ROLES.TRAINEE, ROLES.ADMIN, ROLES.SUPER_ADMIN];
    if (!allowedRoles.includes(session.role as any)) {
      return NextResponse.json(
        { error: 'Forbidden: التسجيل في الدورات متاح لحسابات المتدربين فقط' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));

    // Auto-fill from session when client sends minimal data (just courseId)
    if (!body.fullName || body.fullName.trim().length < 3) {
      body.fullName = session.fullName;
    }
    if (!body.email || body.email.trim().length < 3) {
      body.email = session.email;
    }
    if (!body.phone || body.phone.trim().length < 3) {
      body.phone = session.phone || '0000000000';
    }

    const validation = validateRegistrationInput(body);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات التسجيل غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const { courseId, fullName, nationalId, email, phone, qualification } = validation.data;

    // 1. Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        registrations: {
          where: {
            status: { in: ['PENDING', 'REVIEWING', 'ACCEPTED'] },
          },
          select: { id: true },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'الدورة التدريبية غير موجودة' }, { status: 404 });
    }

    // 2. Course must be OPEN for registration
    if (course.status !== 'OPEN') {
      return NextResponse.json(
        { error: `التسجيل غير متاح حالياً — حالة الدورة: ${course.status}` },
        { status: 400 }
      );
    }

    // 3. Capacity control
    const activeCount = course.registrations.length;
    if (activeCount >= course.capacity) {
      return NextResponse.json(
        { error: `عذراً، تم اكتمال سعة الدورة (${course.capacity} مقعد). لا يمكن قبول تسجيلات جديدة حالياً.` },
        { status: 409 }
      );
    }

    // 4. Duplicate prevention: same user + same course
    const existingRegistration = await prisma.trainingRegistration.findFirst({
      where: {
        courseId,
        userId: session.userId,
        status: { notIn: ['REJECTED'] },
      },
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'أنت مسجل بالفعل في هذه الدورة التدريبية. لا يمكن التسجيل مرة أخرى.' },
        { status: 409 }
      );
    }

    // 5. Create registration
    const registration = await prisma.trainingRegistration.create({
      data: {
        courseId,
        userId: session.userId,
        fullName,
        nationalId,
        email,
        phone,
        qualification,
        status: 'PENDING',
      },
      include: {
        course: { select: { id: true, titleAr: true, titleEn: true } },
      },
    });

    // 6. Send in-app notification to trainee
    await prisma.notification.create({
      data: {
        userId: session.userId,
        titleAr: 'تم استلام طلب التسجيل في الدورة',
        titleEn: 'Course Registration Submitted',
        messageAr: `تم استلام طلب تسجيلك في دورة [${course.titleAr}] بنجاح وهو قيد المراجعة.`,
        messageEn: `Your registration for [${course.titleEn || course.titleAr}] has been received and is under review.`,
        type: 'INFO',
        link: '/portal/trainee/courses',
      },
    }).catch(err => console.error('Notification error on registration:', err));

    // 7. Audit log
    await logActivity({
      userId: session.userId,
      userName: session.fullName,
      action: 'TRAINEE_COURSE_REGISTRATION',
      entityType: 'TrainingRegistration',
      entityId: registration.id,
      details: `تسجيل متدرب [${fullName}] في دورة [${course.titleAr}] — المقاعد المشغولة: ${activeCount + 1}/${course.capacity}`,
    });

    return NextResponse.json(
      {
        success: true,
        message: `تم تسجيلك بنجاح في دورة [${course.titleAr}]. طلبك قيد المراجعة.`,
        registration,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
