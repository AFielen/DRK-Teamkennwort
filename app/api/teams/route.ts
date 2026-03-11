import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { withTenant } from '@/lib/db';
import { teams, teamMembers } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';
import argon2 from 'argon2';
import { logAudit } from '@/lib/audit';

// GET /api/teams — List teams for current user
export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
  }

  const result = await withTenant(session.tenantId, async (db) => {
    return db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        role: teamMembers.role,
        createdAt: teams.createdAt,
        memberCount: sql<number>`(SELECT count(*) FROM team_members WHERE team_id = ${teams.id})`,
        entryCount: sql<number>`(SELECT count(*) FROM vault_entries WHERE team_id = ${teams.id})`,
      })
      .from(teams)
      .innerJoin(teamMembers, eq(teams.id, teamMembers.teamId))
      .where(eq(teamMembers.userId, session.userId));
  });

  return NextResponse.json({ teams: result });
}

// POST /api/teams — Create new team (KV-Admin only)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
  }
  if (!session.isTenantAdmin && !session.isPlatformAdmin) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
  }

  const { name, description, verificationKey, salt, recoveryKeyHash } =
    (await req.json()) as {
      name: string;
      description?: string;
      verificationKey: string;
      salt: string;
      recoveryKeyHash: string;
    };

  if (!name || !verificationKey || !salt || !recoveryKeyHash) {
    return NextResponse.json({ error: 'Fehlende Pflichtfelder' }, { status: 400 });
  }

  // Hash the verification key server-side with Argon2id
  const verificationHash = await argon2.hash(verificationKey, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const result = await withTenant(session.tenantId, async (db) => {
    const [team] = await db
      .insert(teams)
      .values({
        tenantId: session.tenantId,
        name,
        description,
        verificationHash,
        keySalt: salt,
        recoveryKeyHash,
        createdBy: session.userId,
      })
      .returning();

    // Auto-add creator as admin
    await db.insert(teamMembers).values({
      userId: session.userId,
      teamId: team.id,
      role: 'admin',
    });

    return team;
  });

  await logAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    teamId: result.id,
    action: 'team.create',
  });

  return NextResponse.json({ team: { id: result.id, name: result.name } });
}
