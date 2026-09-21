import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ROLES, CAPABILITIES, getUserCapabilities } from '@/lib/rbac';
import { validateAssignmentInput } from '@/lib/validations/incidents';
import { logActivity } from '@/lib/audit';

interface RouteContext {
  params: { id: string };
}

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    if (!session || session.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'غير مصرح: إسناد مهام التحقق والتحليل الميداني محصور بالإدارة العليا (SUPER_ADMIN) حصراً' },
        { status: 403 }
      );
    }

    const incident = await prisma.incident.findUnique({
      where: { id: params.id },
      select: { id: true, incidentNumber: true, status: true },
    });

    if (!incident) {
      return NextResponse.json({ error: 'البلاغ الميداني غير موجود' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const validation = validateAssignmentInput(body);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات الإسناد غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const input = validation.data;

    // Check target user
    const targetUser = await prisma.user.findUnique({
      where: { id: input.assignedToUserId },
      select: { id: true, fullName: true, email: true, role: true, isActive: true },
    });

    if (!targetUser || !targetUser.isActive) {
      return NextResponse.json({ error: 'المستخدم المطلوب إسناد المهمة إليه غير موجود أو معطل' }, { status: 400 });
    }

    // Check target user has appropriate capability
    const targetCaps = await getUserCapabilities(targetUser.id, targetUser.role);
    const hasRequiredCap =
      targetCaps.includes(CAPABILITIES.VERIFY_INCIDENT) ||
      targetCaps.includes(CAPABILITIES.ANALYZE_INCIDENT);

    if (!hasRequiredCap && targetUser.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        {
          error: `المستخدم [${targetUser.fullName}] لا يملك صلاحية التحقق (verify_incident) أو التحليل (analyze_incident). يرجى منح الصلاحية أولاً.`,
        },
        { status: 400 }
      );
    }

    // Check if user is already actively assigned to this incident
    const existing = await prisma.incidentAssignment.findFirst({
      where: {
        incidentId: params.id,
        assignedToUserId: input.assignedToUserId,
        isActive: true,
        revokedAt: null,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `المستخدم [${targetUser.fullName}] مكلف بالفعل بهذا البلاغ حالياً` },
        { status: 409 }
      );
    }

    const assignment = await prisma.$transaction(async (tx) => {
      const created = await tx.incidentAssignment.create({
        data: {
          incidentId: params.id,
          assignedToUserId: input.assignedToUserId,
          assignedByUserId: session.userId,
          roleScope: input.roleScope,
          instructions: input.instructions,
          isActive: true,
        },
        include: {
          assignedTo: { select: { id: true, fullName: true, email: true, role: true } },
        },
      });

      // Update incident status to ASSIGNED if currently RECEIVED, TRIAGED, or REDACTED
      if (['RECEIVED', 'TRIAGED', 'REDACTED'].includes(incident.status)) {
        await tx.incident.update({
          where: { id: params.id },
          data: { status: 'ASSIGNED' },
        });
      }

      return created;
    });

    await logActivity({
      userId: session.userId,
      userName: session.fullName,
      action: 'ASSIGN_INCIDENT_TASK',
      entityType: 'IncidentAssignment',
      entityId: assignment.id,
      details: `إسناد مهمة [${input.roleScope}] للبلاغ [${incident.incidentNumber}] إلى الموظف [${targetUser.fullName}]`,
    });

    return NextResponse.json(
      {
        success: true,
        message: `تم إسناد المهمة للموظف [${targetUser.fullName}] بنجاح، ومُنح حق الاطلاع على النسخة المنقحة المعتمدة.`,
        assignment,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    if (!session || session.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'إلغاء وسحب إسناد المهام محصور بالإدارة العليا (SUPER_ADMIN) حصراً' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');

    if (!assignmentId) {
      return NextResponse.json({ error: 'معلمة assignmentId مطلوبة' }, { status: 400 });
    }

    const assignment = await prisma.incidentAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        assignedTo: { select: { id: true, fullName: true } },
        incident: { select: { id: true, incidentNumber: true } },
      },
    });

    if (!assignment || assignment.incidentId !== params.id) {
      return NextResponse.json({ error: 'سجل الإسناد غير موجود' }, { status: 404 });
    }

    // Revoke assignment immediately
    const updated = await prisma.incidentAssignment.update({
      where: { id: assignmentId },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    });

    await logActivity({
      userId: session.userId,
      userName: session.fullName,
      action: 'REVOKE_INCIDENT_TASK',
      entityType: 'IncidentAssignment',
      entityId: assignment.id,
      details: `سحب وإلغاء إسناد البلاغ [${assignment.incident.incidentNumber}] من الموظف [${assignment.assignedTo.fullName}] (حجب الوصول الفوري)`,
    });

    return NextResponse.json({
      success: true,
      message: `تم سحب التكليف من الموظف [${assignment.assignedTo.fullName}]، وحُجب وصوله عن البلاغ فورياً.`,
      assignment: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
