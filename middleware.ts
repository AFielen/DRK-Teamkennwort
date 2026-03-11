import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import type { SessionData } from '@/lib/session';

const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET || 'CHANGE_ME_min_32_chars_random_string_for_dev',
  cookieName: 'drk-kennwort-session',
};

const PROTECTED_ROUTES = ['/tresor', '/verwaltung', '/totp-setup'];
const ADMIN_ROUTES = ['/verwaltung'];
const PLATFORM_ADMIN_ROUTES = ['/admin'];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Check if route needs protection
  const isProtected = PROTECTED_ROUTES.some((r) => path.startsWith(r));
  const isAdmin = ADMIN_ROUTES.some((r) => path.startsWith(r));
  const isPlatformAdmin = PLATFORM_ADMIN_ROUTES.some((r) => path.startsWith(r));

  if (!isProtected && !isAdmin && !isPlatformAdmin) {
    return NextResponse.next();
  }

  // Get session from cookie
  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(req, res, SESSION_OPTIONS);

  if (!session.userId) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Check TOTP pending
  if (session.pendingTotpVerification && !path.startsWith('/login/totp')) {
    return NextResponse.redirect(new URL('/login/totp', req.url));
  }

  // Admin routes require isTenantAdmin
  if (isAdmin && !session.isTenantAdmin && !session.isPlatformAdmin) {
    return NextResponse.redirect(new URL('/tresor', req.url));
  }

  // Platform admin routes - return 404 instead of 403
  if (isPlatformAdmin && !session.isPlatformAdmin) {
    return NextResponse.rewrite(new URL('/not-found', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/tresor/:path*', '/verwaltung/:path*', '/admin/:path*', '/totp-setup/:path*'],
};
