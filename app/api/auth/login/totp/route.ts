import { NextRequest, NextResponse } from 'next/server';
import * as OTPAuth from 'otpauth';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { logAudit } from '@/lib/audit';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const { code } = (await req.json()) as { code: string };
  const session = await getSession();

  if (!session.userId || !session.pendingTotpVerification) {
    return NextResponse.json(
      { error: 'Keine ausstehende TOTP-Verifizierung' },
      { status: 400 }
    );
  }

  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const ua = req.headers.get('user-agent') || '';

  const rateCheck = checkRateLimit(`totp:${session.userId}`, 5, 15 * 60 * 1000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Zu viele Versuche. Bitte warten.' },
      { status: 429 }
    );
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user || !user.totpSecret) {
    return NextResponse.json(
      { error: 'TOTP nicht eingerichtet' },
      { status: 400 }
    );
  }

  const totp = new OTPAuth.TOTP({
    issuer: 'DRK Kennwort',
    label: user.email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: user.totpSecret,
  });

  const delta = totp.validate({ token: code, window: 1 });

  if (delta === null) {
    await logAudit({
      tenantId: session.tenantId,
      userId: session.userId,
      action: 'login.failed',
      ipAddress: ip,
      userAgent: ua,
      metadata: { reason: 'invalid_totp' },
    });
    return NextResponse.json(
      { error: 'Ungültiger Code' },
      { status: 401 }
    );
  }

  // TOTP verified - remove pending flag
  session.pendingTotpVerification = undefined;
  await session.save();

  await logAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    action: 'login',
    ipAddress: ip,
    userAgent: ua,
    metadata: { method: 'passkey+totp' },
  });

  return NextResponse.json({ success: true });
}
