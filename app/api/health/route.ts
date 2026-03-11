import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

const startTime = Date.now();

export async function GET() {
  let dbStatus: 'ok' | 'error' = 'error';

  try {
    await db.execute(sql`SELECT 1`);
    dbStatus = 'ok';
  } catch {
    // DB connection failed
  }

  const uptime = Math.floor((Date.now() - startTime) / 1000);

  return NextResponse.json({
    status: dbStatus === 'ok' ? 'ok' : 'down',
    db: dbStatus,
    uptime,
  });
}
