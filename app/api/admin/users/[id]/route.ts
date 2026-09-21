import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, ROLES, assertApiCapability } from '@/lib/rbac';
import { logActivity } from '@/lib/audit';

interface RouteContext {
  params: { id: string };
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_USERS);
    if (!gate.authorized) return gate.response!;

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        organization: true,
        role: true,
        isActive: true,
        createdAt: true,
        capabilities: {
          select: { id: true, capability: true, createdAt: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_USERS);
    if (!gate.authorized) return gate.response!;

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, role: true, isActive: true, fullName: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { isActive, role } = body;

    // Security Gate 1: Prevent self-deactivation (avoids admin lockout)
    if (isActive === false && targetUser.id === session?.userId) {
      return NextResponse.json(
        { error: 'لا يمكن للمسؤول تجميد أو تعطيل حسابه الشخصي' },
        { status: 400 }
      );
    }

    // Security Gate 2: Protecting SUPER_ADMIN accounts
    // Only a SUPER_ADMIN can modify another SUPER_ADMIN or deactivate them
    if (targetUser.role === ROLES.SUPER_ADMIN && session?.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'صلاحيات غير كافية: لا يمكن تعديل حساب الإدارة العليا إلا من قبل مسؤول إدارة عليا آخر' },
        { status: 403 }
      );
    }

    const updatePayload: any = {};

    // Handle isActive toggle
    if (typeof isActive === 'boolean') {
      updatePayload.isActive = isActive;
    }

    // Handle Role Changes (Strict Security Rules)
    if (role !== undefined) {
      // Rule: Changing roles is strictly restricted to SUPER_ADMIN
      if (session?.role !== ROLES.SUPER_ADMIN) {
        return NextResponse.json(
          { error: 'تغيير الأدوار والرتب الإدارية محصور بصلاحيات الإدارة العليا (SUPER_ADMIN) حصراً' },
          { status: 403 }
        );
      }

      const validRoles = Object.values(ROLES);
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: `الرتبة المطلوبة غير صالحة. الرتب المعتمدة: ${validRoles.join(', ')}` },
          { status: 400 }
        );
      }

      updatePayload.role = role;

      // If user is changed to FIELD_FOCAL_POINT, strip any administrative capabilities immediately
      if (role === ROLES.FIELD_FOCAL_POINT) {
        await prisma.userCapability.deleteMany({
          where: {
            userId: params.id,
            capability: { not: CAPABILITIES.SUBMIT_INCIDENT },
          },
        });
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'لا توجد حقول صالحة للتعديل' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: updatePayload,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'UPDATE_USER_STATUS',
      entityType: 'User',
      entityId: params.id,
      details: `تحديث المستخدم [${targetUser.fullName} (${targetUser.email})]: الحالة [${updated.isActive ? 'مفعل' : 'معطل'}] - الرتبة [${updated.role}]`,
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
