import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { withTenant } from '@/lib/db';
import { teamMembers } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { logAudit } from '@/lib/audit';

// PUT /api/teams/[teamId]/members/[userId] — Change role
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string; userId: string }> }
) {
  const session = await getSession();
  if (!session.userId || !session.isTenantAdmin) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
  }

  const { teamId, userId } = await params;
  const { role } = (await req.json()) as { role: 'admin' | 'member' | 'readonly' };

  await withTenant(session.tenantId, async (db) => {
    await db
      .update(teamMembers)
      .set({ role })
      .where(
        and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId))
      );
  });

  await logAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    teamId,
    action: 'member.role_changed',
    metadata: { targetUserId: userId, newRole: role },
  });

  return NextResponse.json({ success: true });
}

// DELETE /api/teams/[teamId]/members/[userId] — Remove member
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string; userId: string }> }
) {
  const session = await getSession();
  if (!session.userId || !session.isTenantAdmin) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
  }

  const { teamId, userId } = await params;

  await withTenant(session.tenantId, async (db) => {
    await db
      .delete(teamMembers)
      .where(
        and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId))
      );
  });

  await logAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    teamId,
    action: 'member.remove',
    metadata: { removedUserId: userId },
  });

  return NextResponse.json({ success: true });
}
