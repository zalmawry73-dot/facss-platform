import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, ALL_CAPABILITIES, assertApiCapability } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_USERS);
    if (!gate.authorized) return gate.response!;

    const users = await prisma.user.findMany({
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
          select: {
            capability: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      users: users.map((u) => ({
        ...u,
        assignedCapabilities: u.capabilities.map((c) => c.capability),
      })),
      availableCapabilities: ALL_CAPABILITIES,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser(true);
    
    // Security Gate 1: Only SUPER_ADMIN can create staff and focal point accounts
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'غير مصرح: إنشاء حسابات الموظفين ونقاط الاتصال الميدانية محصور بمسؤولي الإدارة العليا (SUPER_ADMIN) حصراً' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { validateCreateUserInput } = await import('@/lib/validations/admin');
    const { hashPassword } = await import('@/lib/auth');
    const { logActivity } = await import('@/lib/audit');

    const validation = validateCreateUserInput(body);
    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات الحساب غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const input = validation.data;

    // Security Gate 2: Privilege Escalation Prevention - Cannot create another SUPER_ADMIN via API
    if (input.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'منع تصعيد الصلاحيات: لا يمكن إنشاء حساب برتبة إدارة عليا (SUPER_ADMIN) عبر الواجهة البرمجية' },
        { status: 403 }
      );
    }

    // Security Gate 3: Check email uniqueness
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مسجل مسبقاً لمستخدم آخر في المنصة' },
        { status: 409 }
      );
    }

    // Security Gate 4: Focal points must NOT have any admin capabilities
    if (input.role === 'FIELD_FOCAL_POINT') {
      const nonSubmitCaps = input.capabilities?.filter((c) => c !== CAPABILITIES.SUBMIT_INCIDENT) || [];
      if (nonSubmitCaps.length > 0) {
        return NextResponse.json(
          { error: 'عزل أمني: نقطة الاتصال الميدانية محصورة بصلاحية تقديم البلاغ (submit_incident) ولا يمكن منحها صلاحيات إدارية' },
          { status: 403 }
        );
      }
    }

    const passwordHash = await hashPassword(input.password);

    // Format organization and functional area
    const organizationWithArea = input.organization
      ? (input.functionalArea ? `${input.organization} [${input.functionalArea}]` : input.organization)
      : (input.functionalArea ? `[${input.functionalArea}]` : null);

    const newUser = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: input.email,
          fullName: input.fullName,
          passwordHash,
          role: input.role as any,
          phone: input.phone || null,
          organization: organizationWithArea,
          isActive: true,
        },
      });

      if (input.capabilities && input.capabilities.length > 0) {
        await tx.userCapability.createMany({
          data: input.capabilities.map((cap) => ({
            userId: createdUser.id,
            capability: cap,
          })),
        });
      }

      return createdUser;
    });

    await logActivity({
      userId: session.userId,
      userName: session.fullName,
      action: 'CREATE_USER',
      entityType: 'User',
      entityId: newUser.id,
      details: `إنشاء حساب جديد [${newUser.fullName} (${newUser.email})] برتبة [${newUser.role}]${input.capabilities?.length ? ` بصلاحيات: [${input.capabilities.join(', ')}]` : ''}`,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'تم إنشاء المستخدم بنجاح',
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role,
          phone: newUser.phone,
          organization: newUser.organization,
          isActive: newUser.isActive,
          createdAt: newUser.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

