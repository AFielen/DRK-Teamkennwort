import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { withTenant } from '@/lib/db';
import { teams, teamMembers } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import argon2 from 'argon2';
import { logAudit } from '@/lib/audit';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
  }

  const { teamId } = await params;
  const { verificationKey } = (await req.json()) as { verificationKey: string };

  // Rate limit: 5 attempts per 15 min per user per team
  const rateKey = `unlock:${session.userId}:${teamId}`;
  const rateCheck = checkRateLimit(rateKey, 5, 15 * 60 * 1000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Zu viele Versuche. Bitte warten.' },
      { status: 429 }
    );
  }

  const result = await withTenant(session.tenantId, async (db) => {
    // Verify membership
    const [membership] = await db
      .select()
      .from(teamMembers)
      .where(
        and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, session.userId))
      )
      .limit(1);

    if (!membership) return { error: 'not_member' };

    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (!team) return { error: 'not_found' };

    return { team };
  });

  if ('error' in result) {
    return NextResponse.json({ error: 'Team nicht gefunden' }, { status: 404 });
  }

  const { team } = result;
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const ua = req.headers.get('user-agent') || '';

  // Verify master password
  const isValid = await argon2.verify(team.verificationHash, verificationKey);

  if (!isValid) {
    await logAudit({
      tenantId: session.tenantId,
      userId: session.userId,
      teamId,
      action: 'team.unlock.failed',
      ipAddress: ip,
      userAgent: ua,
    });
    return NextResponse.json({ success: false, error: 'Falsches Master-Passwort' }, { status: 401 });
  }

  await logAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    teamId,
    action: 'team.unlock',
    ipAddress: ip,
    userAgent: ua,
  });

  return NextResponse.json({ success: true });
}
