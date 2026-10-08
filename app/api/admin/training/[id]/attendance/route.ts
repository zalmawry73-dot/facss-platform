import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import {
  validateAttendanceInput,
  validateBatchAttendanceInput,
  VALID_ATTENDANCE_STATUSES,
} from '@/lib/validations/admin';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/admin/training/[id]/attendance
 * Get attendance records / sheet / statistics for a course.
 */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const courseId = params.id;
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const registrationId = searchParams.get('registrationId');

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        titleAr: true,
        titleEn: true,
        minAttendancePct: true,
        sessions: {
          orderBy: { sessionNumber: 'asc' },
          select: { id: true, sessionNumber: true, title: true, sessionDate: true },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'الدورة التدريبية غير موجودة' }, { status: 404 });
    }

    // Case 1: Specific session attendance roster
    if (sessionId) {
      const trainingSession = await prisma.trainingSession.findFirst({
        where: { id: sessionId, courseId },
      });

      if (!trainingSession) {
        return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 });
      }

      // Fetch all eligible registrations for the course (ACCEPTED or COMPLETED)
      const registrations = await prisma.trainingRegistration.findMany({
        where: {
          courseId,
          status: { in: ['ACCEPTED', 'COMPLETED'] },
        },
        include: {
          attendanceRecords: {
            where: { sessionId },
          },
        },
        orderBy: { fullName: 'asc' },
      });

      const roster = registrations.map((reg) => {
        const attendance = reg.attendanceRecords[0] || null;
        return {
          registrationId: reg.id,
          fullName: reg.fullName,
          email: reg.email,
          phone: reg.phone,
          registrationStatus: reg.status,
          attendanceId: attendance?.id || null,
          status: attendance?.status || null,
          notes: attendance?.notes || null,
          sessionDate: attendance?.sessionDate || trainingSession.sessionDate,
          modifiedById: attendance?.modifiedById || null,
          modifiedAt: attendance?.modifiedAt || null,
          modifiedReason: attendance?.modifiedReason || null,
        };
      });

      return NextResponse.json({
        success: true,
        course: { id: course.id, titleAr: course.titleAr },
        session: trainingSession,
        roster,
      });
    }

    // Case 2: Specific registration attendance history
    if (registrationId) {
      const records = await prisma.attendanceRecord.findMany({
        where: {
          registrationId,
          registration: { courseId },
        },
        include: {
          session: {
            select: { id: true, sessionNumber: true, title: true, sessionDate: true },
          },
        },
        orderBy: { sessionDate: 'asc' },
      });

      return NextResponse.json({
        success: true,
        records,
      });
    }

    // Case 3: Overall attendance summary across all registrations in course
    const totalSessions = course.sessions.length;

    const registrations = await prisma.trainingRegistration.findMany({
      where: {
        courseId,
        status: { in: ['ACCEPTED', 'COMPLETED'] },
      },
      include: {
        attendanceRecords: {
          where: {
            OR: [
              { sessionId: { in: course.sessions.map((s) => s.id) } },
              { sessionId: null },
            ],
          },
        },
      },
      orderBy: { fullName: 'asc' },
    });

    const summary = registrations.map((reg) => {
      const records = reg.attendanceRecords;
      const presentCount = records.filter((r: { status: string }) => r.status === 'PRESENT').length;
      const excusedCount = records.filter((r: { status: string }) => r.status === 'EXCUSED').length;
      const absentCount = records.filter((r: { status: string }) => r.status === 'ABSENT').length;

      // Attendance percentage calculation:
      // If totalSessions > 0, percentage = (presentCount / totalSessions) * 100
      const attendancePct = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100;
      const isEligible = attendancePct >= course.minAttendancePct;

      return {
        registrationId: reg.id,
        fullName: reg.fullName,
        email: reg.email,
        phone: reg.phone,
        registrationStatus: reg.status,
        totalSessions,
        recordedSessions: records.length,
        presentCount,
        excusedCount,
        absentCount,
        attendancePct,
        minRequiredPct: course.minAttendancePct,
        isEligible,
      };
    });

    return NextResponse.json({
      success: true,
      course,
      totalSessions,
      summary,
    });
  } catch (error: any) {
    console.error('Fetch attendance error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/training/[id]/attendance
 * Record or bulk record attendance for a session.
 */
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const courseId = params.id;
    const body = await request.json().catch(() => ({}));

    // Check if batch or single
    if (Array.isArray(body.records)) {
      const batchValidation = validateBatchAttendanceInput(body);
      if (!batchValidation.success || !batchValidation.data) {
        return NextResponse.json(
          { error: 'بيانات الحضور الجماعي غير صالحة', errors: batchValidation.errors },
          { status: 400 }
        );
      }

      const { sessionId, records, sessionDate } = batchValidation.data;

      const trainingSession = await prisma.trainingSession.findFirst({
        where: { id: sessionId, courseId },
      });

      if (!trainingSession) {
        return NextResponse.json({ error: 'الجلسة التدريبية غير موجودة' }, { status: 404 });
      }

      const effectiveDate = sessionDate ? new Date(sessionDate) : trainingSession.sessionDate;

      // Perform upsert for each record
      const results = [];
      for (const rec of records) {
        const upserted = await prisma.attendanceRecord.upsert({
          where: {
            registrationId_sessionId: {
              registrationId: rec.registrationId,
              sessionId,
            },
          },
          update: {
            status: rec.status,
            notes: rec.notes,
            sessionDate: effectiveDate,
          },
          create: {
            registrationId: rec.registrationId,
            sessionId,
            status: rec.status,
            notes: rec.notes,
            sessionDate: effectiveDate,
          },
        });
        results.push(upserted);
      }

      await logActivity({
        userId: session?.userId,
        userName: session?.fullName,
        action: 'BATCH_RECORD_ATTENDANCE',
        entityType: 'AttendanceRecord',
        entityId: sessionId,
        details: `تسجيل حضور جماعي للجلسة رقم [${trainingSession.sessionNumber}] - [${trainingSession.title}] لعدد [${records.length}] متدرب`,
      });

      return NextResponse.json({
        success: true,
        message: `تم تسجيل الحضور بنجاح لـ ${records.length} متدرب`,
        count: results.length,
      });
    }

    // Single record mode
    const validation = validateAttendanceInput(body);
    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات الحضور غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const { registrationId, sessionId, status, notes, sessionDate } = validation.data;

    let effectiveDate = new Date();
    if (sessionId) {
      const trainingSession = await prisma.trainingSession.findFirst({
        where: { id: sessionId, courseId },
      });
      if (!trainingSession) {
        return NextResponse.json({ error: 'الجلسة التدريبية غير موجودة' }, { status: 404 });
      }
      effectiveDate = sessionDate ? new Date(sessionDate) : trainingSession.sessionDate;
    } else if (sessionDate) {
      effectiveDate = new Date(sessionDate);
    }

    let record;
    if (sessionId) {
      record = await prisma.attendanceRecord.upsert({
        where: {
          registrationId_sessionId: {
            registrationId,
            sessionId,
          },
        },
        update: {
          status,
          notes,
          sessionDate: effectiveDate,
        },
        create: {
          registrationId,
          sessionId,
          status,
          notes,
          sessionDate: effectiveDate,
        },
      });
    } else {
      record = await prisma.attendanceRecord.create({
        data: {
          registrationId,
          status,
          notes,
          sessionDate: effectiveDate,
        },
      });
    }

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'RECORD_ATTENDANCE',
      entityType: 'AttendanceRecord',
      entityId: record.id,
      details: `تسجيل حضور للمتدرب [${registrationId}] بحالة [${status}]`,
    });

    return NextResponse.json({
      success: true,
      message: 'تم تسجيل الحضور بنجاح',
      record,
    });
  } catch (error: any) {
    console.error('Save attendance error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/training/[id]/attendance
 * Correct an attendance record with mandatory audit trail and justification.
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const body = await request.json().catch(() => ({}));
    const { attendanceId, status, notes, modifiedReason } = body;

    if (!attendanceId || typeof attendanceId !== 'string') {
      return NextResponse.json({ error: 'معرف سجل الحضور مطلوب' }, { status: 400 });
    }

    if (!status || !VALID_ATTENDANCE_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `حالة الحضور غير صالحة. الحالات: ${VALID_ATTENDANCE_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    if (!modifiedReason || typeof modifiedReason !== 'string' || modifiedReason.trim().length < 3) {
      return NextResponse.json(
        { error: 'مبرر وسبب تصحيح الحضور مطلوب لتوثيق مسار التدقيق (3 أحرف على الأقل)' },
        { status: 400 }
      );
    }

    const existing = await prisma.attendanceRecord.findUnique({
      where: { id: attendanceId },
      include: {
        registration: { select: { fullName: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'سجل الحضور غير موجود' }, { status: 404 });
    }

    const updated = await prisma.attendanceRecord.update({
      where: { id: attendanceId },
      data: {
        status,
        notes: notes !== undefined ? (notes ? String(notes).trim() : null) : existing.notes,
        modifiedById: session?.userId,
        modifiedAt: new Date(),
        modifiedReason: modifiedReason.trim(),
      },
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'CORRECT_ATTENDANCE',
      entityType: 'AttendanceRecord',
      entityId: attendanceId,
      details: `تصحيح سجل حضور للمتدرب [${existing.registration.fullName}] من [${existing.status}] إلى [${status}]. السبب: ${modifiedReason.trim()}`,
    });

    return NextResponse.json({
      success: true,
      message: 'تم تصحيح سجل الحضور وتوثيق السبب بنجاح',
      record: updated,
    });
  } catch (error: any) {
    console.error('Correct attendance error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
