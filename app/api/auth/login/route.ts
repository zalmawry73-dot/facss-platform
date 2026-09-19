import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { comparePassword, signToken, TOKEN_COOKIE_NAME } from '@/lib/auth';
import { checkRateLimit, rateLimitResponse, LIMITERS } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    // Rate Limiting: 5 attempts per minute per IP (Brute-Force protection)
    const rateCheck = checkRateLimit(request, 'LOGIN', LIMITERS.LOGIN);
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.resetTime);
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
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
    const isProduction = process.env.NODE_ENV === 'production';

    // Set secure HTTP-only cookie
    cookies().set(TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction || isHttps,
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
