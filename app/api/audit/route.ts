import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { withTenant } from '@/lib/db';
import { auditLog, users } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
  }
  if (!session.isTenantAdmin && !session.isPlatformAdmin) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
  }

  const limit = Number(req.nextUrl.searchParams.get('limit') || '50');

  const entries = await withTenant(session.tenantId, async (db) => {
    return db
      .select({
        id: auditLog.id,
        action: auditLog.action,
        userId: auditLog.userId,
        userName: users.name,
        teamId: auditLog.teamId,
        entryId: auditLog.entryId,
        ipAddress: auditLog.ipAddress,
        metadata: auditLog.metadata,
        createdAt: auditLog.createdAt,
      })
      .from(auditLog)
      .leftJoin(users, eq(auditLog.userId, users.id))
      .orderBy(desc(auditLog.createdAt))
      .limit(limit);
  });

  return NextResponse.json({ entries });
}
