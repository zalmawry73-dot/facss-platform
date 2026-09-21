import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { ROLES, isStaffRole } from '@/lib/rbac';
import { validateAlertRecipientsInput } from '@/lib/validations/alerts';

interface RouteContext {
  params: { id: string };
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'غير مصرح: يلزم تسجيل الدخول' }, { status: 401 });
    }

    if (!isStaffRole(session.role)) {
      return NextResponse.json({ error: 'غير مصرح: الوصول محصور بالكوادر الإدارية' }, { status: 403 });
    }

    const alert = await prisma.incidentAlert.findUnique({
      where: { id: params.id },
      include: {
        recipients: {
          include: {
            recipientUser: {
              select: { id: true, fullName: true, email: true, role: true, isActive: true },
            },
          },
        },
      },
    });

    if (!alert) {
      return NextResponse.json({ error: 'التنبيه غير موجود' }, { status: 404 });
    }

    // Eligible users: active staff or clients with explicit verified permission
    // Strict isolation: FIELD_FOCAL_POINT, TRAINEE are excluded unless given explicit capability
    const allActiveUsers = await prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          notIn: [ROLES.FIELD_FOCAL_POINT, ROLES.TRAINEE],
        },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        organization: true,
      },
      orderBy: { fullName: 'asc' },
    });

    return NextResponse.json({
      currentRecipients: alert.recipients,
      eligibleUsers: allActiveUsers,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'غير مصرح: يلزم تسجيل الدخول' }, { status: 401 });
    }

    const isSuperAdmin = session.role === ROLES.SUPER_ADMIN;
    if (!isStaffRole(session.role)) {
      return NextResponse.json({ error: 'غير مصرح: إدارة المستلمين محصورة بالكوادر الإدارية' }, { status: 403 });
    }

    const alert = await prisma.incidentAlert.findUnique({
      where: { id: params.id },
    });

    if (!alert) {
      return NextResponse.json({ error: 'التنبيه غير موجود' }, { status: 404 });
    }

    if (alert.dispatchedAt) {
      return NextResponse.json(
        { error: 'لا يمكن تعديل مستلمي تنبيه تم إصداره وتوزيعه بالفعل' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = validateAlertRecipientsInput(body.recipients);

    if (!validation.isValid || !validation.sanitizedRecipients) {
      return NextResponse.json(
        { error: 'فشل التحقق من قائمة المستلمين', validationErrors: validation.errors },
        { status: 400 }
      );
    }

    const recipientList = validation.sanitizedRecipients;

    // Verify all recipients exist, are active, and are not unpermitted roles
    const userIds = recipientList.map((r) => r.recipientUserId);
    const usersInDb = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        isActive: true,
      },
      select: { id: true, role: true, isActive: true },
    });

    if (usersInDb.length !== userIds.length) {
      return NextResponse.json(
        { error: 'بعض المستلمين المحددين غير موجودين أو تم تعطيل حساباتهم' },
        { status: 400 }
      );
    }

    // Role boundary: ensure no FIELD_FOCAL_POINT or TRAINEE is added without explicit approval
    const forbiddenRoleUser = usersInDb.find(
      (u) => u.role === ROLES.FIELD_FOCAL_POINT || u.role === ROLES.TRAINEE
    );
    if (forbiddenRoleUser) {
      return NextResponse.json(
        { error: `المستخدم [${forbiddenRoleUser.id}] ينتمي لدور غير مخول باستلام التنبيهات الميدانية` },
        { status: 403 }
      );
    }

    const wasApproved = alert.approvalStatus === 'APPROVED';

    // Replace recipients and invalidate approval if was approved
    await prisma.$transaction(async (tx) => {
      await tx.alertRecipient.deleteMany({
        where: { alertId: params.id },
      });

      for (const rec of recipientList) {
        await tx.alertRecipient.create({
          data: {
            alertId: params.id,
            recipientUserId: rec.recipientUserId,
            alertTier: rec.alertTier,
          },
        });
      }

      // Any modification to recipients invalidates approval
      await tx.incidentAlert.update({
        where: { id: params.id },
        data: {
          approvalStatus: 'DRAFT',
          activeSnapshotId: null,
          approvedByUserId: null,
          approvedAt: null,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: session.userId,
          userName: session.fullName,
          action: wasApproved ? 'ALERT_RECIPIENTS_UPDATED_REVOKED_APPROVAL' : 'ALERT_RECIPIENTS_UPDATED',
          entityType: 'IncidentAlert',
          entityId: params.id,
          details: `Updated recipients list (${recipientList.length} users). ${wasApproved ? 'Approval reverted to DRAFT.' : ''}`,
        },
      });
    });

    return NextResponse.json({
      success: true,
      count: recipientList.length,
      notice: wasApproved ? 'تم تحديث المستلمين وإبطال الاعتماد السابق؛ يلزم إعادة اعتماد التنبيه' : undefined,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
