import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, ROLES, assertApiCapability } from '@/lib/rbac';
import { validateCapabilityAssignment } from '@/lib/validations/admin';
import { logActivity } from '@/lib/audit';

interface RouteContext {
  params: { id: string };
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_USERS);
    if (!gate.authorized) return gate.response!;

    const userCaps = await prisma.userCapability.findMany({
      where: { userId: params.id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ success: true, capabilities: userCaps });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_USERS);
    if (!gate.authorized) return gate.response!;

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, fullName: true, role: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    // Security Gate 1: Non-super-admins cannot assign capabilities to themselves (Privilege Escalation protection)
    if (session?.userId === targetUser.id && session?.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'منع تصعيد الصلاحيات: لا يمكن للمستخدم منح صلاحيات جديدة لنفسه' },
        { status: 403 }
      );
    }

    // Security Gate 2: Non-super-admins cannot modify SUPER_ADMIN capabilities
    if (targetUser.role === ROLES.SUPER_ADMIN && session?.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'غير مصرح: لا يمكن تعديل صلاحيات حسابات الإدارة العليا' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validation = validateCapabilityAssignment(body);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'الصلاحية المطلوبة غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const { capability } = validation.data;

    // Security Gate 3: An ADMIN cannot assign 'manage_users' or 'manage_settings' unless they are SUPER_ADMIN
    if (
      (capability === CAPABILITIES.MANAGE_USERS || capability === CAPABILITIES.MANAGE_SETTINGS) &&
      session?.role !== ROLES.SUPER_ADMIN
    ) {
      return NextResponse.json(
        { error: 'منح صلاحيات إدارة المستخدمين أو إعدادات النظام محصور بمسؤولي الإدارة العليا حصراً' },
        { status: 403 }
      );
    }

    // Upsert capability
    const userCap = await prisma.userCapability.upsert({
      where: {
        userId_capability: {
          userId: params.id,
          capability,
        },
      },
      create: {
        userId: params.id,
        capability,
      },
      update: {},
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'ASSIGN_USER_CAPABILITY',
      entityType: 'UserCapability',
      entityId: userCap.id,
      details: `منح الصلاحية [${capability}] للمستخدم [${targetUser.fullName} (${targetUser.email})]`,
    });

    return NextResponse.json({ success: true, capability: userCap }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_USERS);
    if (!gate.authorized) return gate.response!;

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, fullName: true, role: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    if (targetUser.role === ROLES.SUPER_ADMIN && session?.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'غير مصرح: لا يمكن تعديل صلاحيات حسابات الإدارة العليا' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const capability = searchParams.get('capability');

    if (!capability) {
      return NextResponse.json({ error: 'معلمة الصلاحية (capability) مطلوبة في الرابط' }, { status: 400 });
    }

    await prisma.userCapability.deleteMany({
      where: {
        userId: params.id,
        capability,
      },
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'REVOKE_USER_CAPABILITY',
      entityType: 'UserCapability',
      entityId: `${params.id}:${capability}`,
      details: `سحب الصلاحية [${capability}] من المستخدم [${targetUser.fullName} (${targetUser.email})]`,
    });

    return NextResponse.json({ success: true, message: `تم سحب الصلاحية [${capability}] بنجاح` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
