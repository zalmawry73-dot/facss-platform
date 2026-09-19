import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { validateRegistrationStatusUpdate } from '@/lib/validations/admin';
import { logActivity } from '@/lib/audit';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/admin/training/registrations/[id]
 * Admin: Get single registration details.
 */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const registration = await prisma.trainingRegistration.findUnique({
      where: { id: params.id },
      include: {
        course: true,
        certificate: true,
        user: {
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
    });

    if (!registration) {
      return NextResponse.json({ error: 'طلب التسجيل غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ success: true, registration });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/training/registrations/[id]
 * Admin: Update registration status (Accept/Reject/Waitlist/Complete).
 * Enforces: status transition matrix, capacity re-check on ACCEPTED.
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const existing = await prisma.trainingRegistration.findUnique({
      where: { id: params.id },
      include: {
        course: {
          include: {
            registrations: {
              where: { status: 'ACCEPTED' },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'طلب التسجيل غير موجود' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const validation = validateRegistrationStatusUpdate(body, existing.status);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات التحديث غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const { status: newStatus, adminNotes } = validation.data;

    // Capacity re-check when accepting
    if (newStatus === 'ACCEPTED') {
      const acceptedCount = existing.course.registrations.length;
      if (acceptedCount >= existing.course.capacity) {
        return NextResponse.json(
          {
            error: `لا يمكن قبول هذا التسجيل — السعة المتاحة ممتلئة (${acceptedCount}/${existing.course.capacity} مقعد مقبول)`,
          },
          { status: 409 }
        );
      }
    }

    // Build update payload
    const updateData: any = { status: newStatus };
    if (adminNotes !== undefined && adminNotes !== null) {
      updateData.adminNotes = adminNotes;
    }

    const updated = await prisma.trainingRegistration.update({
      where: { id: params.id },
      data: updateData,
      include: {
        course: { select: { id: true, titleAr: true } },
      },
    });

    // Send notification to trainee on status change
    if (existing.userId && existing.status !== newStatus) {
      let titleAr = 'تحديث في حالة طلب التدريب';
      let titleEn = 'Training Application Status Updated';
      let messageAr = `تم تحديث حالة طلبك في دورة [${existing.course.titleAr}] إلى: ${newStatus}`;
      let messageEn = `Your application status for [${existing.course.titleAr}] has been updated to: ${newStatus}`;
      let notifType: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT' = 'INFO';

      if (newStatus === 'ACCEPTED') {
        titleAr = 'تهانينا! تم قبول طلبك في الدورة التدريبية';
        titleEn = 'Congratulations! Application Accepted';
        messageAr = `تم قبول تسجيلك رسمياً في دورة [${existing.course.titleAr}]. يرجى مراجعة تفاصيل البرنامج.`;
        messageEn = `You have been officially accepted into [${existing.course.titleAr}].`;
        notifType = 'SUCCESS';
      } else if (newStatus === 'REJECTED') {
        titleAr = 'إشعار بخصوص طلب التدريب';
        titleEn = 'Training Application Notice';
        messageAr = `نعتذر عن عدم قبول طلب تسجيلك في دورة [${existing.course.titleAr}].`;
        messageEn = `We regret to inform you that your application for [${existing.course.titleAr}] was not accepted.`;
        notifType = 'WARNING';
      } else if (newStatus === 'WAITLIST') {
        titleAr = 'تم إدراجك في قائمة الانتظار';
        titleEn = 'Placed on Waitlist';
        messageAr = `تم إدراجك في قائمة الانتظار لدورة [${existing.course.titleAr}].`;
        messageEn = `You have been placed on the waitlist for [${existing.course.titleAr}].`;
        notifType = 'INFO';
      }

      await prisma.notification.create({
        data: {
          userId: existing.userId,
          titleAr,
          titleEn,
          messageAr,
          messageEn,
          type: notifType,
          link: '/portal/trainee/courses',
        },
      }).catch(err => console.error('Notification error on reg status update:', err));
    }

    // Audit log
    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'UPDATE_REGISTRATION_STATUS',
      entityType: 'TrainingRegistration',
      entityId: params.id,
      details: `تحديث حالة تسجيل المتدرب [${existing.fullName}] في دورة [${existing.course.titleAr}]: [${existing.status}] → [${newStatus}]${adminNotes ? ` | ملاحظة: ${adminNotes}` : ''}`,
    });

    return NextResponse.json({
      success: true,
      message: `تم تحديث حالة التسجيل إلى [${newStatus}]`,
      registration: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
