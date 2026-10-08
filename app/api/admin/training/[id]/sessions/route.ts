import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { validateSessionInput } from '@/lib/validations/admin';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/admin/training/[id]/sessions
 * List all sessions for a course, with attendance summary.
 */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const courseId = params.id;
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, titleAr: true, titleEn: true, minAttendancePct: true },
    });

    if (!course) {
      return NextResponse.json({ error: 'الدورة التدريبية غير موجودة' }, { status: 404 });
    }

    const sessions = await prisma.trainingSession.findMany({
      where: { courseId },
      orderBy: { sessionNumber: 'asc' },
      include: {
        _count: {
          select: { attendances: true },
        },
        attendances: {
          select: {
            status: true,
          },
        },
      },
    });

    // Compute presentation statistics for each session
    const formattedSessions = sessions.map((s) => {
      const presentCount = s.attendances.filter((a) => a.status === 'PRESENT').length;
      const absentCount = s.attendances.filter((a) => a.status === 'ABSENT').length;
      const excusedCount = s.attendances.filter((a) => a.status === 'EXCUSED').length;
      return {
        id: s.id,
        courseId: s.courseId,
        sessionNumber: s.sessionNumber,
        title: s.title,
        sessionDate: s.sessionDate,
        startTime: s.startTime,
        endTime: s.endTime,
        notes: s.notes,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        totalRecorded: s._count.attendances,
        presentCount,
        absentCount,
        excusedCount,
      };
    });

    return NextResponse.json({
      success: true,
      course,
      sessions: formattedSessions,
    });
  } catch (error: any) {
    console.error('Fetch sessions error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/training/[id]/sessions
 * Create a new training session for a course.
 */
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const courseId = params.id;
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, titleAr: true },
    });

    if (!course) {
      return NextResponse.json({ error: 'الدورة التدريبية غير موجودة' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const validation = validateSessionInput(body);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات الجلسة غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const { sessionNumber, title, sessionDate, startTime, endTime, notes } = validation.data;

    // Check duplicate sessionNumber
    const existing = await prisma.trainingSession.findUnique({
      where: {
        courseId_sessionNumber: {
          courseId,
          sessionNumber,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `الجلسة رقم (${sessionNumber}) مسجلة مسبقاً في هذه الدورة` },
        { status: 409 }
      );
    }

    const newSession = await prisma.trainingSession.create({
      data: {
        courseId,
        sessionNumber,
        title,
        sessionDate: new Date(sessionDate),
        startTime,
        endTime,
        notes,
      },
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'CREATE_TRAINING_SESSION',
      entityType: 'TrainingSession',
      entityId: newSession.id,
      details: `إنشاء الجلسة رقم [${sessionNumber}] بعنوان [${title}] لدورة [${course.titleAr}]`,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'تم إنشاء الجلسة بنجاح',
        session: newSession,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create session error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
