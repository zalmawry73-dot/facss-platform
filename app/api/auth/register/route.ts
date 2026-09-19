import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { hashPassword, signToken, TOKEN_COOKIE_NAME } from '@/lib/auth';
import { checkRateLimit, rateLimitResponse, LIMITERS } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    // Rate Limiting: 3 registrations per hour per IP (anti-spam / mass account creation)
    const rateCheck = checkRateLimit(request, 'REGISTER', LIMITERS.REGISTER);
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.resetTime);
    }

    const body = await request.json();
    const { email, password, fullName, phone, organization, role, companySector } = body;

    // Strict Input Validation
    if (!email || !password || !fullName || typeof email !== 'string' || typeof password !== 'string' || typeof fullName !== 'string') {
      return NextResponse.json(
        { error: 'الاسم الكامل، البريد الإلكتروني، وكلمة المرور حقول إلزامية' },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'صيغة البريد الإلكتروني غير صالحة' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'يجب أن تتكون كلمة المرور من 8 خانات على الأقل لضمان أمان الحساب' },
        { status: 400 }
      );
    }

    // Role whitelisting: NEVER allow self-registering as ADMIN or STAFF (Privilege Escalation protection)
    const assignedRole = role === 'TRAINEE' ? 'TRAINEE' : 'CLIENT';

    const existing = await prisma.user.findUnique({
      where: { email: sanitizedEmail }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مسجل مسبقاً، يرجى تسجيل الدخول' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Unvetted public client accounts are created with accountStatus: 'PENDING_VERIFICATION'
    const newUser = await prisma.user.create({
      data: {
        email: sanitizedEmail,
        passwordHash,
        fullName: fullName.trim(),
        phone: phone ? String(phone).trim() : null,
        organization: organization ? String(organization).trim() : null,
        role: assignedRole,
        isActive: true,
        ...(assignedRole === 'CLIENT' ? {
          clientProfile: {
            create: {
              companyName: organization ? String(organization).trim() : fullName.trim(),
              sector: companySector ? String(companySector).trim() : 'منشأة تجارية / خاصة',
              accountStatus: 'PENDING_VERIFICATION', // Requires administrative verification for corporate access
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
    const isProduction = process.env.NODE_ENV === 'production';

    cookies().set(TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction || isHttps,
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
        details: `تسجيل حساب ذاتي جديد [${newUser.email}] برتبة [${newUser.role}] - حالة الاعتماد: ${assignedRole === 'CLIENT' ? 'قيد التحقق' : 'مباشر'}`,
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
