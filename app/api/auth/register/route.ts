import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { hashPassword, signToken, TOKEN_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName, phone, organization, role, companySector } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'الاسم الكامل، البريد الإلكتروني، وكلمة المرور حقول إلزامية' },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مسجل مسبقاً، يرجى تسجيل الدخول' },
        { status: 409 }
      );
    }

    const assignedRole = role === 'TRAINEE' ? 'TRAINEE' : 'CLIENT';
    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        passwordHash,
        fullName: fullName.trim(),
        phone: phone ? phone.trim() : null,
        organization: organization ? organization.trim() : null,
        role: assignedRole,
        isActive: true,
        ...(assignedRole === 'CLIENT' && organization ? {
          clientProfile: {
            create: {
              companyName: organization.trim(),
              sector: companySector || 'منشأة تجارية / خاصة',
            }
          }
        } : {})
      }
    });

    const token = await signToken({
      userId: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      organization: newUser.organization,
    });

    const isHttps = process.env.APP_URL?.startsWith('https://') ?? false;

    cookies().set(TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    await prisma.activityLog.create({
      data: {
        userId: newUser.id,
        userName: newUser.fullName,
        action: 'USER_REGISTER',
        entityType: 'User',
        entityId: newUser.id,
        details: `تسجيل حساب جديد [${newUser.email}] برتبة [${newUser.role}]`,
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
      }
    });
  } catch (error: any) {
    console.error('Register API error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء الحساب' },
      { status: 500 }
    );
  }
}
