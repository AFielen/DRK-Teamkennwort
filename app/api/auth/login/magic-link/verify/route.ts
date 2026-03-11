import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, invitations } from '@/lib/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { getSession } from '@/lib/session';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=invalid_token', req.url));
  }

  const [invitation] = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.token, token),
        isNull(invitations.usedAt)
      )
    )
    .limit(1);

  if (!invitation || new Date(invitation.expiresAt) < new Date()) {
    return NextResponse.redirect(new URL('/login?error=expired_token', req.url));
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, invitation.email))
    .limit(1);

  if (!user || !user.isActive) {
    return NextResponse.redirect(new URL('/login?error=invalid_token', req.url));
  }

  // Mark token as used
  await db
    .update(invitations)
    .set({ usedAt: new Date() })
    .where(eq(invitations.id, invitation.id));

  // Update last login
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));

  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const ua = req.headers.get('user-agent') || '';

  // Check if TOTP is required
  if (user.totpEnabled) {
    const session = await getSession();
    session.userId = user.id;
    session.tenantId = user.tenantId;
    session.email = user.email;
    session.name = user.name;
    session.isTenantAdmin = user.isTenantAdmin;
    session.isPlatformAdmin = user.isPlatformAdmin;
    session.pendingTotpVerification = true;
    await session.save();

    return NextResponse.redirect(new URL('/login/totp', req.url));
  }

  // Create full session
  const session = await getSession();
  session.userId = user.id;
  session.tenantId = user.tenantId;
  session.email = user.email;
  session.name = user.name;
  session.isTenantAdmin = user.isTenantAdmin;
  session.isPlatformAdmin = user.isPlatformAdmin;
  await session.save();

  await logAudit({
    tenantId: user.tenantId,
    userId: user.id,
    action: 'login',
    ipAddress: ip,
    userAgent: ua,
    metadata: { method: 'magic-link' },
  });

  return NextResponse.redirect(new URL('/tresor', req.url));
}
