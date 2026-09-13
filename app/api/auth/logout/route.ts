import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { TOKEN_COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  const isHttps = process.env.APP_URL?.startsWith('https://') ?? false;

  cookies().set(TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return NextResponse.json({ success: true, message: 'Logged out' });
}
