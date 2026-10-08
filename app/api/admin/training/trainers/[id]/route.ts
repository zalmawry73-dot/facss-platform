import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/admin/training/trainers/[id]
 * Get detailed trainer profile with course assignments and documents
 */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const trainer = await prisma.trainer.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
        courseAssignments: {
          include: {
            course: {
              select: {
                id: true,
                titleAr: true,
                titleEn: true,
                status: true,
                startDate: true,
                endDate: true,
                courseType: true,
              },
            },
          },
        },
        documents: {
          select: {
            id: true,
            title: true,
            documentType: true,
            issuingBody: true,
            issueDate: true,
            expiryDate: true,
            verificationStatus: true,
            fileName: true,
            fileSize: true,
            createdAt: true,
          },
        },
      },
    });

    if (!trainer) {
      return NextResponse.json({ error: 'المدرب غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ success: true, trainer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/training/trainers/[id]
 * Update trainer information or toggle active status
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const existing = await prisma.trainer.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'المدرب غير موجود' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const updateData: any = {};

    if (body.fullNameAr !== undefined) {
      if (!body.fullNameAr || body.fullNameAr.trim().length < 3) {
        return NextResponse.json({ error: 'الاسم بالعربية يجب أن يكون 3 أحرف على الأقل' }, { status: 400 });
      }
      updateData.fullNameAr = body.fullNameAr.trim();
    }

    if (body.fullNameEn !== undefined) updateData.fullNameEn = body.fullNameEn ? body.fullNameEn.trim() : null;
    if (body.professionalTitleAr !== undefined) updateData.professionalTitleAr = body.professionalTitleAr.trim();
    if (body.professionalTitleEn !== undefined) updateData.professionalTitleEn = body.professionalTitleEn ? body.professionalTitleEn.trim() : null;
    if (body.specializations !== undefined) updateData.specializations = body.specializations ? String(body.specializations).trim() : null;
    if (body.bioAr !== undefined) updateData.bioAr = body.bioAr ? String(body.bioAr).trim() : null;
    if (body.bioEn !== undefined) updateData.bioEn = body.bioEn ? String(body.bioEn).trim() : null;
    if (body.qualifications !== undefined) updateData.qualifications = body.qualifications ? String(body.qualifications).trim() : null;
    if (body.certifications !== undefined) updateData.certifications = body.certifications ? String(body.certifications).trim() : null;
    if (body.email !== undefined) updateData.email = body.email ? String(body.email).trim() : null;
    if (body.phone !== undefined) updateData.phone = body.phone ? String(body.phone).trim() : null;
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);

    const updated = await prisma.trainer.update({
      where: { id: params.id },
      data: updateData,
    });

    await logActivity({
      userId: session!.userId,
      userName: session!.fullName,
      action: 'UPDATE_TRAINER',
      entityType: 'Trainer',
      entityId: updated.id,
      details: `تحديث بيانات المدرب: [${updated.fullNameAr}] - الحالة: [${updated.isActive ? 'نشط' : 'معطل'}]`,
    });

    return NextResponse.json({ success: true, trainer: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/training/trainers/[id]
 * Deactivate trainer safely without deleting historical course records
 */
export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const existing = await prisma.trainer.findUnique({
      where: { id: params.id },
      include: { courseAssignments: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'المدرب غير موجود' }, { status: 404 });
    }

    // If trainer has historical course assignments, deactivate without deleting
    if (existing.courseAssignments.length > 0) {
      const deactivated = await prisma.trainer.update({
        where: { id: params.id },
        data: { isActive: false },
      });

      await logActivity({
        userId: session!.userId,
        userName: session!.fullName,
        action: 'DEACTIVATE_TRAINER',
        entityType: 'Trainer',
        entityId: params.id,
        details: `تعطيل المدرب [${existing.fullNameAr}] مع الحفاظ على الارتباطات التاريخية بالدورات`,
      });

      return NextResponse.json({
        success: true,
        message: 'تم تعطيل المدرب بنجاح مع الحفاظ على سجلاته التاريخية',
        trainer: deactivated,
      });
    }

    // Otherwise, can safely delete
    await prisma.trainer.delete({
      where: { id: params.id },
    });

    await logActivity({
      userId: session!.userId,
      userName: session!.fullName,
      action: 'DELETE_TRAINER',
      entityType: 'Trainer',
      entityId: params.id,
      details: `حذف سجل المدرب [${existing.fullNameAr}]`,
    });

    return NextResponse.json({ success: true, message: 'تم حذف المدرب بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
