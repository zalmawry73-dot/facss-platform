import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { comparePassword, signToken, TOKEN_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { clientProfile: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'بيانات الدخول غير صحيحة أو الحساب غير مفعل' },
        { status: 401 }
      );
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: 'بيانات الدخول غير صحيحة' },
        { status: 401 }
      );
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      organization: user.organization,
    });

    const isHttps = process.env.APP_URL?.startsWith('https://') ?? false;

    // Set HTTP-only cookie
    cookies().set(TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        userName: user.fullName,
        action: 'USER_LOGIN',
        entityType: 'User',
        entityId: user.id,
        details: `تسجيل دخول ناجح للمستخدم [${user.email}] برتبة [${user.role}]`,
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        organization: user.organization,
      }
    });
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم أثناء تسجيل الدخول' },
      { status: 500 }
    );
  }
}
