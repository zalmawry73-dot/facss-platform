import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { validateCourseInput } from '@/lib/validations/admin';
import { logActivity } from '@/lib/audit';

interface RouteContext {
  params: { id: string };
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        registrations: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'الدورة التدريبية غير موجودة' }, { status: 404 });
    }

    return NextResponse.json({ success: true, course });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const existing = await prisma.course.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'الدورة التدريبية غير موجودة' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const validation = validateCourseInput(body, true);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات التحديث غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const updatePayload: any = {};
    const d = validation.data;

    if (body.titleAr !== undefined) updatePayload.titleAr = d.titleAr;
    if (body.titleEn !== undefined) updatePayload.titleEn = d.titleEn;
    if (body.descriptionAr !== undefined) updatePayload.descriptionAr = d.descriptionAr;
    if (body.descriptionEn !== undefined) updatePayload.descriptionEn = d.descriptionEn;
    if (body.trainerName !== undefined) updatePayload.trainerName = d.trainerName;
    if (body.duration !== undefined) updatePayload.duration = d.duration;
    if (body.location !== undefined) updatePayload.location = d.location;
    if (body.capacity !== undefined) updatePayload.capacity = d.capacity;
    if (body.status !== undefined) updatePayload.status = d.status;
    if (body.requirementsAr !== undefined) updatePayload.requirementsAr = d.requirementsAr;
    if (body.requirementsEn !== undefined) updatePayload.requirementsEn = d.requirementsEn;
    if (body.hasCertificate !== undefined) updatePayload.hasCertificate = d.hasCertificate;

    if (body.startDate !== undefined) {
      updatePayload.startDate = d.startDate ? new Date(d.startDate) : null;
    }
    if (body.endDate !== undefined) {
      updatePayload.endDate = d.endDate ? new Date(d.endDate) : null;
    }

    if (body.categoryId !== undefined) {
      const categoryExists = await prisma.courseCategory.findUnique({
        where: { id: d.categoryId },
      });
      if (!categoryExists) {
        return NextResponse.json({ error: 'تصنيف الدورة غير موجود' }, { status: 400 });
      }
      updatePayload.categoryId = d.categoryId;
    }

    const updated = await prisma.course.update({
      where: { id: params.id },
      data: updatePayload,
      include: { category: true },
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'UPDATE_TRAINING_COURSE',
      entityType: 'Course',
      entityId: params.id,
      details: `تحديث الدورة [${updated.titleAr}]: الحالة [${updated.status}]`,
    });

    return NextResponse.json({ success: true, course: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: { registrations: true },
    });

    if (!course) {
      return NextResponse.json({ error: 'الدورة التدريبية غير موجودة' }, { status: 404 });
    }

    // Non-destructive: if course has registrations, cancel it rather than breaking foreign keys
    if (course.registrations.length > 0) {
      const cancelled = await prisma.course.update({
        where: { id: params.id },
        data: { status: 'CANCELLED' },
      });

      await logActivity({
        userId: session?.userId,
        userName: session?.fullName,
        action: 'CANCEL_TRAINING_COURSE',
        entityType: 'Course',
        entityId: params.id,
        details: `إلغاء الدورة [${course.titleAr}] لوجود ${course.registrations.length} متدربين مسجلين مسبقاً`,
      });

      return NextResponse.json({
        success: true,
        message: 'تم تغيير حالة الدورة إلى ملغاة (CANCELLED) نظراً لوجود متدربين مسجلين',
        course: cancelled,
      });
    }

    // If no registrations, safe delete
    await prisma.course.delete({
      where: { id: params.id },
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'DELETE_TRAINING_COURSE',
      entityType: 'Course',
      entityId: params.id,
      details: `حذف دورة فارغة [${course.titleAr}] نهائياً`,
    });

    return NextResponse.json({ success: true, message: 'تم حذف الدورة بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
