import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { tenants, users, teams, vaultEntries, auditLog } from '@/lib/schema';
import { sql, eq, desc } from 'drizzle-orm';

export async function GET() {
  const session = await getSession();
  if (!session.userId || !session.isPlatformAdmin) {
    return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 404 });
  }

  const [tenantCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(tenants)
    .where(eq(tenants.isActive, true));

  const [userCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.isActive, true));

  const [teamCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(teams);

  const [entryCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(vaultEntries);

  const recentActivity = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      userName: users.name,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .leftJoin(users, eq(auditLog.userId, users.id))
    .orderBy(desc(auditLog.createdAt))
    .limit(20);

  return NextResponse.json({
    stats: {
      tenants: tenantCount.count,
      users: userCount.count,
      teams: teamCount.count,
      entries: entryCount.count,
    },
    recentActivity,
  });
}
