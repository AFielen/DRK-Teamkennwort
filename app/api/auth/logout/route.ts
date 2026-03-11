import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { logAudit } from '@/lib/audit';

export async function POST() {
  const session = await getSession();

  if (session.userId) {
    await logAudit({
      tenantId: session.tenantId,
      userId: session.userId,
      action: 'logout',
    });
  }

  session.destroy();
  return NextResponse.json({ success: true });
}
