import { NextRequest, NextResponse } from 'next/server';
import * as OTPAuth from 'otpauth';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
  }

  const { code, secret } = (await req.json()) as { code: string; secret: string };

  if (!code || !secret) {
    return NextResponse.json({ error: 'Code und Secret erforderlich' }, { status: 400 });
  }

  const totp = new OTPAuth.TOTP({
    issuer: 'DRK Kennwort',
    label: session.email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  });

  const delta = totp.validate({ token: code, window: 1 });

  if (delta === null) {
    return NextResponse.json({ error: 'Ungültiger Code' }, { status: 400 });
  }

  // Save TOTP secret and enable
  await db
    .update(users)
    .set({
      totpSecret: secret,
      totpEnabled: true,
    })
    .where(eq(users.id, session.userId));

  return NextResponse.json({ success: true });
}
