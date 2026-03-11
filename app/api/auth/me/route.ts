import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();

  if (!session.userId) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      userId: session.userId,
      tenantId: session.tenantId,
      email: session.email,
      name: session.name,
      isTenantAdmin: session.isTenantAdmin,
      isPlatformAdmin: session.isPlatformAdmin,
    },
  });
}
