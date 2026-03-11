import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { withTenant, db } from '@/lib/db';
import { invitations, users, tenants } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { logAudit } from '@/lib/audit';
import { validateEmailDomain } from '@/lib/domain-check';
import { sendInvitationEmail } from '@/lib/mail';

// POST /api/invitations — Invite a new member
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
  }
  if (!session.isTenantAdmin && !session.isPlatformAdmin) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
  }

  const { email, role, teamId } = (await req.json()) as {
    email: string;
    role: 'admin' | 'member' | 'readonly';
    teamId?: string;
  };

  if (!email || !role) {
    return NextResponse.json({ error: 'E-Mail und Rolle erforderlich' }, { status: 400 });
  }

  // Get tenant info for domain check
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, session.tenantId))
    .limit(1);

  if (!tenant) {
    return NextResponse.json({ error: 'Mandant nicht gefunden' }, { status: 400 });
  }

  // Domain check
  if (!validateEmailDomain(email, tenant.allowedEmailDomains)) {
    const domains = tenant.allowedEmailDomains.join(', ');
    return NextResponse.json(
      { error: `Nur @${domains} Adressen können eingeladen werden.` },
      { status: 400 }
    );
  }

  // Check if email already exists (globally)
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: 'Diese E-Mail-Adresse ist bereits registriert.' },
      { status: 409 }
    );
  }

  const token = nanoid(24);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await withTenant(session.tenantId, async (db) => {
    await db.insert(invitations).values({
      tenantId: session.tenantId,
      email: email.toLowerCase(),
      role,
      teamId,
      invitedBy: session.userId,
      token,
      expiresAt,
    });
  });

  // Send invitation email
  try {
    await sendInvitationEmail({
      to: email,
      inviterName: session.name,
      tenantName: tenant.name,
      token,
    });
  } catch {
    console.error('Invitation email failed for', email);
  }

  await logAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    teamId,
    action: 'member.invite',
    metadata: { invitedEmail: email, role },
  });

  return NextResponse.json({ success: true });
}
