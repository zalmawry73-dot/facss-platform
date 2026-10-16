import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getCurrentUser, TOKEN_COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  const isHttps = process.env.APP_URL?.startsWith('https://') ?? false;
  const isProduction = process.env.NODE_ENV === 'production';

  const clearCookie = () => {
    cookies().set(TOKEN_COOKIE_NAME, '', {
      httpOnly: true,
      secure: isProduction || isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  };

  try {
    // Read session without DB check first to obtain userId and tokenVersion
    const session = await getCurrentUser(false);

    if (session && session.userId && typeof session.tokenVersion === 'number') {
      try {
        // Requirement 3: Optimistic conditional increment to prevent stale logouts from killing newer sessions
        // Only increment if DB version matches this token's version
        await prisma.user.updateMany({
          where: {
            id: session.userId,
            tokenVersion: session.tokenVersion,
          },
          data: {
            tokenVersion: { increment: 1 },
          },
        });
      } catch (dbError: any) {
        console.error('[AUTH_LOGOUT_REVOCATION_FAILURE] Database update failed:', dbError);
        // Requirement 4: Clear client cookie defensively
        clearCookie();
        // Fail-closed: Return HTTP 500 with explicit error code instead of false success
        return NextResponse.json(
          {
            success: false,
            error: 'فشل إبطال الجلسة على الخادم. تعذر تحديث حالة الجلسة في قاعدة البيانات.',
            code: 'SERVER_REVOCATION_FAILED'
          },
          { status: 500 }
        );
      }
    }

    clearCookie();
    return NextResponse.json({ success: true, message: 'تم تسجيل الخروج وإبطال الجلسة بنجاح' });
  } catch (error: any) {
    clearCookie();
    return NextResponse.json(
      { success: false, error: 'حدث خطأ غير متوقع أثناء تسجيل الخروج', code: 'LOGOUT_ERROR' },
      { status: 500 }
    );
  }
}
