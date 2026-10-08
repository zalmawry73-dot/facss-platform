import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { validateSessionInput } from '@/lib/validations/admin';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string; sessionId: string };
}

/**
 * GET /api/admin/training/[id]/sessions/[sessionId]
 * Get details of a single session with attendances.
 */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const { id: courseId, sessionId } = params;

    const trainingSession = await prisma.trainingSession.findFirst({
      where: { id: sessionId, courseId },
      include: {
        attendances: {
          include: {
            registration: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!trainingSession) {
      return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 });
    }

    return NextResponse.json({ success: true, session: trainingSession });
  } catch (error: any) {
    console.error('Fetch session detail error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/training/[id]/sessions/[sessionId]
 * Update a session.
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const { id: courseId, sessionId } = params;

    const existingSession = await prisma.trainingSession.findFirst({
      where: { id: sessionId, courseId },
      include: { course: { select: { titleAr: true } } },
    });

    if (!existingSession) {
      return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const validation = validateSessionInput(body, true);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات الجلسة غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (body.sessionNumber !== undefined) updateData.sessionNumber = validation.data.sessionNumber;
    if (body.title !== undefined) updateData.title = validation.data.title;
    if (body.sessionDate !== undefined) updateData.sessionDate = new Date(validation.data.sessionDate);
    if (body.startTime !== undefined) updateData.startTime = validation.data.startTime;
    if (body.endTime !== undefined) updateData.endTime = validation.data.endTime;
    if (body.notes !== undefined) updateData.notes = validation.data.notes;

    // Check if new sessionNumber collides with another session in same course
    if (updateData.sessionNumber && updateData.sessionNumber !== existingSession.sessionNumber) {
      const collision = await prisma.trainingSession.findUnique({
        where: {
          courseId_sessionNumber: {
            courseId,
            sessionNumber: updateData.sessionNumber,
          },
        },
      });
      if (collision) {
        return NextResponse.json(
          { error: `الجلسة رقم (${updateData.sessionNumber}) مسجلة مسبقاً في هذه الدورة` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.trainingSession.update({
      where: { id: sessionId },
      data: updateData,
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'UPDATE_TRAINING_SESSION',
      entityType: 'TrainingSession',
      entityId: sessionId,
      details: `تعديل الجلسة رقم [${updated.sessionNumber}] في دورة [${existingSession.course.titleAr}]`,
    });

    return NextResponse.json({
      success: true,
      message: 'تم تحديث الجلسة بنجاح',
      session: updated,
    });
  } catch (error: any) {
    console.error('Update session error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/training/[id]/sessions/[sessionId]
 * Delete a session.
 */
export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const { id: courseId, sessionId } = params;

    const existingSession = await prisma.trainingSession.findFirst({
      where: { id: sessionId, courseId },
      include: { course: { select: { titleAr: true } } },
    });

    if (!existingSession) {
      return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 });
    }

    await prisma.trainingSession.delete({
      where: { id: sessionId },
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'DELETE_TRAINING_SESSION',
      entityType: 'TrainingSession',
      entityId: sessionId,
      details: `حذف الجلسة رقم [${existingSession.sessionNumber}] - [${existingSession.title}] من دورة [${existingSession.course.titleAr}]`,
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف الجلسة بنجاح',
    });
  } catch (error: any) {
    console.error('Delete session error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
