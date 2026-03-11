import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { withTenant } from '@/lib/db';
import { vaultEntries, teamMembers } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { logAudit } from '@/lib/audit';

// GET /api/entries?teamId=xxx — Get all entries for a team
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
  }

  const teamId = req.nextUrl.searchParams.get('teamId');
  if (!teamId) {
    return NextResponse.json({ error: 'teamId erforderlich' }, { status: 400 });
  }

  const entries = await withTenant(session.tenantId, async (db) => {
    // Verify membership
    const [membership] = await db
      .select()
      .from(teamMembers)
      .where(
        and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, session.userId))
      )
      .limit(1);

    if (!membership) return null;

    return db
      .select()
      .from(vaultEntries)
      .where(eq(vaultEntries.teamId, teamId));
  });

  if (entries === null) {
    return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 });
  }

  return NextResponse.json({ entries });
}

// POST /api/entries — Create new entry
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
  }

  const body = await req.json();
  const { teamId, encryptedData, iv, recoveryEncryptedData, recoveryIv, category } =
    body as {
      teamId: string;
      encryptedData: string;
      iv: string;
      recoveryEncryptedData?: string;
      recoveryIv?: string;
      category: string;
    };

  if (!teamId || !encryptedData || !iv || !category) {
    return NextResponse.json({ error: 'Fehlende Pflichtfelder' }, { status: 400 });
  }

  const result = await withTenant(session.tenantId, async (db) => {
    // Verify membership (not readonly)
    const [membership] = await db
      .select()
      .from(teamMembers)
      .where(
        and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, session.userId))
      )
      .limit(1);

    if (!membership || membership.role === 'readonly') return null;

    const [entry] = await db
      .insert(vaultEntries)
      .values({
        tenantId: session.tenantId,
        teamId,
        encryptedData,
        iv,
        recoveryEncryptedData,
        recoveryIv,
        category,
        createdBy: session.userId,
        updatedBy: session.userId,
      })
      .returning();

    return entry;
  });

  if (!result) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
  }

  await logAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    teamId,
    entryId: result.id,
    action: 'entry.create',
  });

  return NextResponse.json({ entry: { id: result.id } });
}
