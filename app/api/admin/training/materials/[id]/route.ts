import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { LocalStorageDriver } from '@/lib/storage';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

/**
 * PATCH /api/admin/training/materials/[id]
 * Update training material metadata (title, description, visibility, sortOrder, isArchived)
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const existing = await prisma.trainingMaterial.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'المادة التدريبية غير موجودة' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const updateData: any = {};

    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim().length < 2) {
        return NextResponse.json({ error: 'العنوان يجب أن يكون حرفين على الأقل' }, { status: 400 });
      }
      updateData.title = body.title.trim();
    }

    if (body.description !== undefined) {
      updateData.description = body.description ? String(body.description).trim() : null;
    }

    if (body.visibility !== undefined) {
      const valid = ['INTERNAL', 'ENROLLED_TRAINEES', 'PUBLIC'];
      if (!valid.includes(body.visibility)) {
        return NextResponse.json({ error: 'مستوى الرؤية غير صالح' }, { status: 400 });
      }
      updateData.visibility = body.visibility;
    }

    if (body.sortOrder !== undefined) {
      updateData.sortOrder = Number(body.sortOrder) || 0;
    }

    if (body.isArchived !== undefined) {
      updateData.isArchived = Boolean(body.isArchived);
    }

    const updated = await prisma.trainingMaterial.update({
      where: { id: params.id },
      data: updateData,
    });

    await logActivity({
      userId: session!.userId,
      userName: session!.fullName,
      action: 'UPDATE_TRAINING_MATERIAL',
      entityType: 'TrainingMaterial',
      entityId: updated.id,
      details: `تحديث بيانات المادة التدريبية: [${updated.title}]`,
    });

    return NextResponse.json({ success: true, material: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/training/materials/[id]
 * Delete training material record and underlying file from storage
 */
export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const existing = await prisma.trainingMaterial.findUnique({
      where: { id: params.id },
      include: { course: { select: { titleAr: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'المادة التدريبية غير موجودة' }, { status: 404 });
    }

    // Delete file from local storage driver
    const storage = new LocalStorageDriver();
    try {
      await storage.delete(existing.fileKey);
    } catch (err) {
      console.warn(`Could not delete storage file ${existing.fileKey}:`, err);
    }

    await prisma.trainingMaterial.delete({
      where: { id: params.id },
    });

    await logActivity({
      userId: session!.userId,
      userName: session!.fullName,
      action: 'DELETE_TRAINING_MATERIAL',
      entityType: 'TrainingMaterial',
      entityId: params.id,
      details: `حذف المادة التدريبية [${existing.title}] من الدورة [${existing.course.titleAr}]`,
    });

    return NextResponse.json({ success: true, message: 'تم حذف المادة التدريبية بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
