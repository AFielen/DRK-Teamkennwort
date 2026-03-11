import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, invitations } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { sendMagicLinkEmail } from '@/lib/mail';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const { email } = (await req.json()) as { email: string };

  if (!email) {
    return NextResponse.json({ error: 'E-Mail erforderlich' }, { status: 400 });
  }

  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const rateCheck = checkRateLimit(`magic-link:${ip}`, 3, 15 * 60 * 1000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Zu viele Versuche. Bitte warten.' },
      { status: 429 }
    );
  }

  // Always return success to not reveal email existence
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (user && user.isActive) {
    const token = nanoid(24);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await db.insert(invitations).values({
      tenantId: user.tenantId,
      email: user.email,
      role: 'member', // not relevant for magic link
      token,
      expiresAt,
      invitedBy: user.id,
    });

    try {
      await sendMagicLinkEmail({ to: user.email, token });
    } catch {
      // Log but don't expose email errors
      console.error('Magic link email failed for', user.email);
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Falls ein Account existiert, wurde ein Anmeldelink gesendet.',
  });
}
