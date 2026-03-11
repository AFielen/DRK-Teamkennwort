import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, invitations, teamMembers, tenants } from '@/lib/schema';
import { eq, and, isNull } from 'drizzle-orm';
import argon2 from 'argon2';
import { logAudit } from '@/lib/audit';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, name, password } = body as {
    token: string;
    name: string;
    password: string;
  };

  if (!token || !name || !password) {
    return NextResponse.json(
      { error: 'Fehlende Pflichtfelder' },
      { status: 400 }
    );
  }

  // Validate invitation token
  const [invitation] = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.token, token),
        isNull(invitations.usedAt)
      )
    )
    .limit(1);

  if (!invitation) {
    return NextResponse.json(
      { error: 'Ungültiger oder abgelaufener Einladungslink' },
      { status: 400 }
    );
  }

  if (new Date(invitation.expiresAt) < new Date()) {
    return NextResponse.json(
      { error: 'Einladungslink ist abgelaufen' },
      { status: 400 }
    );
  }

  // Check if email already exists
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, invitation.email))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: 'Diese E-Mail-Adresse ist bereits registriert' },
      { status: 409 }
    );
  }

  // Get tenant info
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, invitation.tenantId))
    .limit(1);

  if (!tenant || !tenant.isActive) {
    return NextResponse.json(
      { error: 'Mandant nicht gefunden oder deaktiviert' },
      { status: 400 }
    );
  }

  // Hash password with Argon2id
  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  // Create user
  const [newUser] = await db
    .insert(users)
    .values({
      tenantId: invitation.tenantId,
      email: invitation.email,
      name,
      passwordHash,
      isTenantAdmin: invitation.role === 'admin',
    })
    .returning();

  // Mark invitation as used
  await db
    .update(invitations)
    .set({ usedAt: new Date() })
    .where(eq(invitations.id, invitation.id));

  // If invitation is linked to a team, add as member
  if (invitation.teamId) {
    await db.insert(teamMembers).values({
      userId: newUser.id,
      teamId: invitation.teamId,
      role: invitation.role,
      invitedBy: invitation.invitedBy,
    });
  }

  // Create session
  const session = await getSession();
  session.userId = newUser.id;
  session.tenantId = newUser.tenantId;
  session.email = newUser.email;
  session.name = newUser.name;
  session.isTenantAdmin = newUser.isTenantAdmin;
  session.isPlatformAdmin = newUser.isPlatformAdmin;
  await session.save();

  // Audit log
  await logAudit({
    tenantId: newUser.tenantId,
    userId: newUser.id,
    action: 'login',
    metadata: { method: 'registration' },
  });

  return NextResponse.json({
    success: true,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    },
  });
}
