import { NextResponse } from 'next/server';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { getSession } from '@/lib/session';

export async function POST() {
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
  }

  const secret = new OTPAuth.Secret({ size: 20 });

  const totp = new OTPAuth.TOTP({
    issuer: 'DRK Kennwort',
    label: session.email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  });

  const uri = totp.toString();
  const qrCodeUrl = await QRCode.toDataURL(uri);

  return NextResponse.json({
    qrCodeUrl,
    secret: secret.base32,
  });
}
