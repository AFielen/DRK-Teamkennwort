import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { withTenant } from '@/lib/db';
import { vaultEntries, teamMembers } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { logAudit } from '@/lib/audit';

// PUT /api/entries/[id] — Update entry
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { encryptedData, iv, recoveryEncryptedData, recoveryIv, category } =
    body as {
      encryptedData: string;
      iv: string;
      recoveryEncryptedData?: string;
      recoveryIv?: string;
      category?: string;
    };

  const result = await withTenant(session.tenantId, async (db) => {
    const [entry] = await db
      .select()
      .from(vaultEntries)
      .where(eq(vaultEntries.id, id))
      .limit(1);

    if (!entry) return { error: 'not_found' };

    // Verify membership (not readonly)
    const [membership] = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, entry.teamId),
          eq(teamMembers.userId, session.userId)
        )
      )
      .limit(1);

    if (!membership || membership.role === 'readonly') {
      return { error: 'forbidden' };
    }

    const [updated] = await db
      .update(vaultEntries)
      .set({
        encryptedData,
        iv,
        recoveryEncryptedData,
        recoveryIv,
        category: category || entry.category,
        updatedBy: session.userId,
        updatedAt: new Date(),
      })
      .where(eq(vaultEntries.id, id))
      .returning();

    return { entry: updated };
  });

  if ('error' in result) {
    const status = result.error === 'not_found' ? 404 : 403;
    return NextResponse.json({ error: result.error }, { status });
  }

  await logAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    teamId: result.entry.teamId,
    entryId: id,
    action: 'entry.update',
  });

  return NextResponse.json({ success: true });
}

// DELETE /api/entries/[id] — Delete entry
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
  }

  const { id } = await params;

  const result = await withTenant(session.tenantId, async (db) => {
    const [entry] = await db
      .select()
      .from(vaultEntries)
      .where(eq(vaultEntries.id, id))
      .limit(1);

    if (!entry) return { error: 'not_found' };

    // Only admin or member can delete
    const [membership] = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, entry.teamId),
          eq(teamMembers.userId, session.userId)
        )
      )
      .limit(1);

    if (!membership || membership.role === 'readonly') {
      return { error: 'forbidden' };
    }

    await db.delete(vaultEntries).where(eq(vaultEntries.id, id));
    return { teamId: entry.teamId };
  });

  if ('error' in result) {
    const status = result.error === 'not_found' ? 404 : 403;
    return NextResponse.json({ error: result.error }, { status });
  }

  await logAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    teamId: result.teamId,
    entryId: id,
    action: 'entry.delete',
  });

  return NextResponse.json({ success: true });
}
