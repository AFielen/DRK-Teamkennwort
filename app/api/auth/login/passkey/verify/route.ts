import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/session';
import { logAudit } from '@/lib/audit';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';

const RP_ID = process.env.NEXT_PUBLIC_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
  : 'localhost';
const ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface StoredCredential {
  id: string;
  publicKey: string;
  counter: number;
  transports?: AuthenticatorTransport[];
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, response, challenge } = body as {
    userId: string;
    response: unknown;
    challenge: string;
  };

  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const ua = req.headers.get('user-agent') || '';
  const rateCheck = checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Zu viele Versuche. Bitte warten.' },
      { status: 429 }
    );
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || !user.isActive) {
    await logAudit({
      tenantId: 'unknown',
      action: 'login.failed',
      ipAddress: ip,
      userAgent: ua,
      metadata: { reason: 'user_not_found', userId },
    });
    return NextResponse.json(
      { error: 'Zugangsdaten ungültig' },
      { status: 401 }
    );
  }

  const credentials = (user.passkeyCredentials as StoredCredential[]) || [];
  const credential = credentials.find(
    (c) => c.id === (response as { id: string }).id
  );

  if (!credential) {
    await logAudit({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'login.failed',
      ipAddress: ip,
      userAgent: ua,
      metadata: { reason: 'credential_not_found' },
    });
    return NextResponse.json(
      { error: 'Zugangsdaten ungültig' },
      { status: 401 }
    );
  }

  try {
    const verification = await verifyAuthenticationResponse({
      response: response as Parameters<typeof verifyAuthenticationResponse>[0]['response'],
      expectedChallenge: challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: credential.id,
        publicKey: new Uint8Array(Buffer.from(credential.publicKey, 'base64')),
        counter: credential.counter,
        transports: credential.transports,
      },
    });

    if (!verification.verified) {
      await logAudit({
        tenantId: user.tenantId,
        userId: user.id,
        action: 'login.failed',
        ipAddress: ip,
        userAgent: ua,
        metadata: { reason: 'verification_failed' },
      });
      return NextResponse.json(
        { error: 'Zugangsdaten ungültig' },
        { status: 401 }
      );
    }

    // Update counter
    const updatedCredentials = credentials.map((c) =>
      c.id === credential.id
        ? { ...c, counter: verification.authenticationInfo.newCounter }
        : c
    );
    await db
      .update(users)
      .set({
        passkeyCredentials: updatedCredentials,
        lastLoginAt: new Date(),
      })
      .where(eq(users.id, user.id));

    resetRateLimit(`login:${ip}`);

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

      return NextResponse.json({ requireTotp: true });
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
      metadata: { method: 'passkey' },
    });

    return NextResponse.json({ success: true });
  } catch {
    await logAudit({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'login.failed',
      ipAddress: ip,
      userAgent: ua,
      metadata: { reason: 'verification_error' },
    });
    return NextResponse.json(
      { error: 'Zugangsdaten ungültig' },
      { status: 401 }
    );
  }
}
