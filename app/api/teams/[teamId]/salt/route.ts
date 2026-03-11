import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { withTenant } from '@/lib/db';
import { teams, teamMembers } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
  }

  const { teamId } = await params;

  const result = await withTenant(session.tenantId, async (db) => {
    // Verify user is member of this team
    const [membership] = await db
      .select()
      .from(teamMembers)
      .where(
        and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, session.userId))
      )
      .limit(1);

    if (!membership) return null;

    const [team] = await db
      .select({ keySalt: teams.keySalt })
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    return team;
  });

  if (!result) {
    return NextResponse.json({ error: 'Team nicht gefunden' }, { status: 404 });
  }

  return NextResponse.json({ salt: result.keySalt });
}
