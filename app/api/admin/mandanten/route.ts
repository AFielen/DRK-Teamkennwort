import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { tenants, users, invitations } from '@/lib/schema';
import { nanoid } from 'nanoid';
import argon2 from 'argon2';
import { logAudit } from '@/lib/audit';
import { sendInvitationEmail } from '@/lib/mail';

// GET /api/admin/mandanten — List all tenants
export async function GET() {
  const session = await getSession();
  if (!session.userId || !session.isPlatformAdmin) {
    return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 404 });
  }

  const result = await db.select().from(tenants);
  return NextResponse.json({ tenants: result });
}

// POST /api/admin/mandanten — Create new tenant
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId || !session.isPlatformAdmin) {
    return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 404 });
  }

  const { name, slug, allowedEmailDomains, adminEmail, adminName } =
    (await req.json()) as {
      name: string;
      slug: string;
      allowedEmailDomains: string[];
      adminEmail: string;
      adminName: string;
    };

  if (!name || !slug || !allowedEmailDomains?.length || !adminEmail || !adminName) {
    return NextResponse.json({ error: 'Fehlende Pflichtfelder' }, { status: 400 });
  }

  // Create tenant
  const [tenant] = await db
    .insert(tenants)
    .values({ name, slug, allowedEmailDomains })
    .returning();

  // Create invitation for KV-Admin
  const token = nanoid(24);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await db.insert(invitations).values({
    tenantId: tenant.id,
    email: adminEmail.toLowerCase(),
    role: 'admin',
    invitedBy: session.userId,
    token,
    expiresAt,
  });

  // Send invitation email
  try {
    await sendInvitationEmail({
      to: adminEmail,
      inviterName: session.name,
      tenantName: name,
      token,
    });
  } catch {
    console.error('Admin invitation email failed');
  }

  await logAudit({
    tenantId: tenant.id,
    userId: session.userId,
    action: 'admin.tenant.create',
    metadata: { tenantName: name, slug, adminEmail },
  });

  return NextResponse.json({ tenant: { id: tenant.id, name: tenant.name } });
}
