/**
 * Seed-Script: Erstellt Testdaten für die Entwicklung.
 * Ausführung: npx tsx scripts/seed.ts
 *
 * Voraussetzung: PostgreSQL läuft (docker compose up db)
 * und DATABASE_URL ist gesetzt.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../lib/schema';

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL nicht gesetzt');
    process.exit(1);
  }

  const client = postgres(url);
  const db = drizzle(client, { schema });

  console.log('Seeding database...');

  // 1. Mandant: KV StädteRegion Aachen
  const [aachen] = await db.insert(schema.tenants).values({
    name: 'KV StädteRegion Aachen',
    slug: 'aachen',
    allowedEmailDomains: ['drk-aachen.de'],
  }).returning();
  console.log('  Mandant erstellt:', aachen.name);

  // 2. Platform-Admin
  const [platformAdmin] = await db.insert(schema.users).values({
    tenantId: aachen.id,
    email: 'admin@drk-kennwort.de',
    name: 'Platform Admin',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$PLACEHOLDER_HASH',
    isPlatformAdmin: true,
    isTenantAdmin: true,
  }).returning();
  console.log('  Platform-Admin erstellt:', platformAdmin.email);

  // 3. KV-Admin
  const [kvAdmin] = await db.insert(schema.users).values({
    tenantId: aachen.id,
    email: 'admin@drk-aachen.de',
    name: 'Max Mustermann',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$PLACEHOLDER_HASH',
    isTenantAdmin: true,
  }).returning();
  console.log('  KV-Admin erstellt:', kvAdmin.email);

  // 4. Normale Mitglieder
  const [member1] = await db.insert(schema.users).values({
    tenantId: aachen.id,
    email: 'erika@drk-aachen.de',
    name: 'Erika Musterfrau',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$PLACEHOLDER_HASH',
  }).returning();

  const [member2] = await db.insert(schema.users).values({
    tenantId: aachen.id,
    email: 'thomas@drk-aachen.de',
    name: 'Thomas Helfer',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$PLACEHOLDER_HASH',
  }).returning();

  console.log('  Mitglieder erstellt:', member1.email, member2.email);

  // 5. Teams
  const [teamRd] = await db.insert(schema.teams).values({
    tenantId: aachen.id,
    name: 'Rettungsdienst',
    description: 'Zugangsdaten für den Rettungsdienst',
    verificationHash: '$argon2id$v=19$m=65536,t=3,p=4$PLACEHOLDER_VERIFICATION',
    keySalt: 'dGVzdC1zYWx0LWJhc2U2NA==',
    recoveryKeyHash: '$argon2id$v=19$m=65536,t=3,p=4$PLACEHOLDER_RECOVERY',
    createdBy: kvAdmin.id,
  }).returning();

  const [teamVw] = await db.insert(schema.teams).values({
    tenantId: aachen.id,
    name: 'Verwaltung',
    description: 'Zugangsdaten für die Verwaltung',
    verificationHash: '$argon2id$v=19$m=65536,t=3,p=4$PLACEHOLDER_VERIFICATION',
    keySalt: 'dGVzdC1zYWx0LWJhc2U2NA==',
    recoveryKeyHash: '$argon2id$v=19$m=65536,t=3,p=4$PLACEHOLDER_RECOVERY',
    createdBy: kvAdmin.id,
  }).returning();

  console.log('  Teams erstellt:', teamRd.name, teamVw.name);

  // 6. Team-Mitgliedschaften
  await db.insert(schema.teamMembers).values([
    { userId: kvAdmin.id, teamId: teamRd.id, role: 'admin' },
    { userId: kvAdmin.id, teamId: teamVw.id, role: 'admin' },
    { userId: member1.id, teamId: teamRd.id, role: 'member', invitedBy: kvAdmin.id },
    { userId: member2.id, teamId: teamRd.id, role: 'readonly', invitedBy: kvAdmin.id },
    { userId: member2.id, teamId: teamVw.id, role: 'member', invitedBy: kvAdmin.id },
  ]);
  console.log('  Team-Mitgliedschaften erstellt');

  // 7. Beispiel-Tresor-Einträge (encrypted with placeholder data)
  const sampleEntries = [
    { category: 'wifi', title: 'Büro WLAN' },
    { category: 'wifi', title: 'Gast-WLAN' },
    { category: 'building', title: 'Haupteingang Alarm' },
    { category: 'building', title: 'Serverraum PIN' },
    { category: 'system', title: 'NINA Portal' },
    { category: 'system', title: 'DRK-Server Admin' },
    { category: 'social', title: 'Instagram @drkaachen' },
    { category: 'email', title: 'info@drk-aachen.de' },
    { category: 'vendor', title: 'Hosting-Provider Login' },
    { category: 'other', title: 'Fahrzeugschlüssel-Tresor' },
  ];

  for (const entry of sampleEntries) {
    await db.insert(schema.vaultEntries).values({
      tenantId: aachen.id,
      teamId: teamRd.id,
      encryptedData: Buffer.from(JSON.stringify({ title: entry.title, username: 'test', password: 'encrypted' })).toString('base64'),
      iv: Buffer.from('test-iv-placeholder').toString('base64'),
      category: entry.category,
      createdBy: kvAdmin.id,
      updatedBy: kvAdmin.id,
    });
  }
  console.log('  10 Tresor-Einträge erstellt');

  // 8. Audit-Log-Einträge
  await db.insert(schema.auditLog).values([
    { tenantId: aachen.id, userId: kvAdmin.id, action: 'login', metadata: { method: 'passkey' } },
    { tenantId: aachen.id, userId: kvAdmin.id, teamId: teamRd.id, action: 'team.create' },
    { tenantId: aachen.id, userId: kvAdmin.id, teamId: teamVw.id, action: 'team.create' },
    { tenantId: aachen.id, userId: kvAdmin.id, teamId: teamRd.id, action: 'team.unlock' },
    { tenantId: aachen.id, userId: member1.id, action: 'login', metadata: { method: 'magic-link' } },
  ]);
  console.log('  Audit-Log-Einträge erstellt');

  console.log('\nSeed abgeschlossen!');
  await client.end();
}

seed().catch((err) => {
  console.error('Seed-Fehler:', err);
  process.exit(1);
});
