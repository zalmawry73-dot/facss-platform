import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getCurrentUser, comparePassword, hashPassword, TOKEN_COOKIE_NAME } from '@/lib/auth';
import { checkRateLimit, rateLimitResponse, LIMITERS, getClientIp } from '@/lib/rateLimit';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const PASSWORD_MIN_LENGTH = 10;
const HAS_UPPERCASE = /[A-Z]/;
const HAS_LOWERCASE = /[a-z]/;
const HAS_NUMBER = /[0-9]/;
const HAS_SPECIAL = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting: 5 attempts per 15 minutes per IP
    const rateCheck = checkRateLimit(request, 'PASSWORD_CHANGE', LIMITERS.PASSWORD_CHANGE);
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.resetTime);
    }

    // 2. Strict Authentication check with DB verification (fail-closed)
    const session = await getCurrentUser(true);
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: 'غير مصرح لك بتنفيذ هذه العملية. يرجى تسجيل الدخول مجدداً.' },
        { status: 401 }
      );
    }

    // 3. Payload Extraction & Structural Validation
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'بيانات الطلب غير صالحة.' },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword, confirmPassword } = body || {};

    if (!currentPassword || typeof currentPassword !== 'string') {
      return NextResponse.json(
        { error: 'يرجى إدخال كلمة المرور الحالية.' },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json(
        { error: 'يرجى إدخال كلمة المرور الجديدة.' },
        { status: 400 }
      );
    }

    if (!confirmPassword || typeof confirmPassword !== 'string') {
      return NextResponse.json(
        { error: 'يرجى تأكيد كلمة المرور الجديدة.' },
        { status: 400 }
      );
    }

    // 4. Confirmation Match Check
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'كلمة المرور الجديدة وتأكيدها غير متطابقين.' },
        { status: 400 }
      );
    }

    // 5. Strong Password Policy Enforcement
    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      return NextResponse.json(
        { error: `يجب ألا تقل كلمة المرور الجديدة عن ${PASSWORD_MIN_LENGTH} أحرف.` },
        { status: 400 }
      );
    }

    if (!HAS_UPPERCASE.test(newPassword)) {
      return NextResponse.json(
        { error: 'يجب أن تحتوي كلمة المرور الجديدة على حرف كبير واحد على الأقل (A-Z).' },
        { status: 400 }
      );
    }

    if (!HAS_LOWERCASE.test(newPassword)) {
      return NextResponse.json(
        { error: 'يجب أن تحتوي كلمة المرور الجديدة على حرف صغير واحد على الأقل (a-z).' },
        { status: 400 }
      );
    }

    if (!HAS_NUMBER.test(newPassword)) {
      return NextResponse.json(
        { error: 'يجب أن تحتوي كلمة المرور الجديدة على رقم واحد على الأقل (0-9).' },
        { status: 400 }
      );
    }

    if (!HAS_SPECIAL.test(newPassword)) {
      return NextResponse.json(
        { error: 'يجب أن تحتوي كلمة المرور الجديدة على رمز خاص واحد على الأقل (مثل @, #, $, %, !).' },
        { status: 400 }
      );
    }

    // 6. Database User Lookup
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        passwordHash: true,
        isActive: true,
        tokenVersion: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'الحساب غير موجود أو تم تعطيله.' },
        { status: 401 }
      );
    }

    // 7. Verify Current Password
    const isCurrentValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      // Record failed security event in ActivityLog without recording passwords
      await logActivity({
        userId: user.id,
        userName: user.fullName,
        action: 'PASSWORD_CHANGE_FAILED',
        entityType: 'User',
        entityId: user.id,
        details: 'فشل تغيير كلمة المرور: تم إدخال كلمة مرور حالية غير صحيحة.',
        ipAddress: getClientIp(request),
      });

      return NextResponse.json(
        { error: 'كلمة المرور الحالية غير صحيحة.' },
        { status: 400 }
      );
    }

    // 8. Prevent Reuse of Current Password
    const isSameAsCurrent = await comparePassword(newPassword, user.passwordHash);
    if (isSameAsCurrent) {
      return NextResponse.json(
        { error: 'لا يمكن إعادة استخدام كلمة المرور الحالية. يرجى اختيار كلمة مرور جديدة ومختلفة تماماً.' },
        { status: 400 }
      );
    }

    // 9. Hash New Password with standard bcrypt (10 rounds)
    const newPasswordHash = await hashPassword(newPassword);

    // 10. Atomic Database Update: update hash AND increment tokenVersion
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        tokenVersion: { increment: 1 },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        tokenVersion: true,
      },
    });

    // 11. Clear current session cookie on the browser
    const isHttps = process.env.APP_URL?.startsWith('https://') ?? false;
    const isProduction = process.env.NODE_ENV === 'production';
    cookies().set(TOKEN_COOKIE_NAME, '', {
      httpOnly: true,
      secure: isProduction || isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    // 12. Security Audit Log (clean, no credentials or tokens)
    await logActivity({
      userId: user.id,
      userName: user.fullName,
      action: 'PASSWORD_CHANGE_SUCCESS',
      entityType: 'User',
      entityId: user.id,
      details: `تم تغيير كلمة المرور بنجاح للمستخدم [${user.email}]. تم رفع إصدار الجلسة وإبطال كافة الرموز السابقة.`,
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح. تم إنهاء كافة الجلسات النشطة لضمان الأمان، يرجى تسجيل الدخول مجدداً بكلمة المرور الجديدة.',
      previousTokenVersion: user.tokenVersion,
      newTokenVersion: updatedUser.tokenVersion,
    });
  } catch (error: any) {
    console.error('Password change API error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم أثناء معالجة تغيير كلمة المرور.' },
      { status: 500 }
    );
  }
}
