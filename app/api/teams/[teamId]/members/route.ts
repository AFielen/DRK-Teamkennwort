import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { withTenant } from '@/lib/db';
import { teamMembers, users } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/teams/[teamId]/members — List team members
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
  }

  const { teamId } = await params;

  const members = await withTenant(session.tenantId, async (db) => {
    // Verify user is member
    const [membership] = await db
      .select()
      .from(teamMembers)
      .where(
        and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, session.userId))
      )
      .limit(1);

    if (!membership) return null;

    return db
      .select({
        userId: users.id,
        name: users.name,
        email: users.email,
        role: teamMembers.role,
        joinedAt: teamMembers.joinedAt,
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, teamId));
  });

  if (members === null) {
    return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 });
  }

  return NextResponse.json({ members });
}
