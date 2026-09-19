import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const TOKEN_COOKIE_NAME = 'facss_session_token';

const STAFF_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'STAFF',
  'CONTENT_MANAGER',
  'SERVICE_MANAGER',
  'TRAINING_MANAGER',
  'RESEARCH_MANAGER',
  'EMPLOYEE',
];

async function verifyEdgeToken(token: string) {
  try {
    const secret = process.env.AUTH_SECRET;
    if (!secret || secret.trim().length < 32) {
      return null;
    }
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload as { userId?: string; role?: string; email?: string };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Security Headers applied to all responses
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Route: /admin/:path*
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyEdgeToken(token);
    if (!payload || !payload.role || !STAFF_ROLES.includes(payload.role)) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(loginUrl);
    }
  }

  // Route: /portal/client/:path*
  if (pathname.startsWith('/portal/client')) {
    const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyEdgeToken(token);
    if (!payload || !payload.role) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Explicitly block trainees from client portal
    if (payload.role === 'TRAINEE') {
      return NextResponse.redirect(new URL('/portal/trainee', request.url));
    }
  }

  // Route: /portal/trainee/:path*
  if (pathname.startsWith('/portal/trainee')) {
    const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value;
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyEdgeToken(token);
    if (!payload || !payload.role) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Explicitly redirect pure clients to client portal
    if (payload.role === 'CLIENT') {
      return NextResponse.redirect(new URL('/portal/client', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/portal/:path*',
    '/((?!_next/static|_next/image|favicon.ico|images/).*)',
  ],
};
