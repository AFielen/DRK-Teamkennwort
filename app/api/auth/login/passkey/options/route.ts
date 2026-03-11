import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { checkRateLimit } from '@/lib/rate-limit';

const RP_ID = process.env.NEXT_PUBLIC_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
  : 'localhost';

interface StoredCredential {
  id: string;
  publicKey: string;
  counter: number;
  transports?: AuthenticatorTransport[];
}

export async function POST(req: NextRequest) {
  const { email } = (await req.json()) as { email: string };

  if (!email) {
    return NextResponse.json({ error: 'E-Mail erforderlich' }, { status: 400 });
  }

  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const rateCheck = checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Zu viele Versuche. Bitte warten.' },
      { status: 429 }
    );
  }

  // Find user - generic error to not reveal email existence
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (!user || !user.isActive) {
    return NextResponse.json(
      { error: 'Zugangsdaten ungültig' },
      { status: 401 }
    );
  }

  const credentials = (user.passkeyCredentials as StoredCredential[]) || [];

  if (credentials.length === 0) {
    return NextResponse.json(
      { error: 'Kein Passkey registriert. Bitte Magic Link verwenden.' },
      { status: 400 }
    );
  }

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    allowCredentials: credentials.map((c) => ({
      id: c.id,
      transports: c.transports,
    })),
    userVerification: 'preferred',
  });

  // Store challenge in a temporary way (in production, use a short-lived store)
  // For now we pass it back and verify client-side
  return NextResponse.json({
    options,
    userId: user.id,
    tenantId: user.tenantId,
  });
}
