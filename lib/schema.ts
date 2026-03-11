import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
  inet,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ── Mandanten ──

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  allowedEmailDomains: text('allowed_email_domains').array().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── Users ──

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  passkeyCredentials: jsonb('passkey_credentials').default(sql`'[]'::jsonb`).notNull(),
  totpSecret: text('totp_secret'),
  totpEnabled: boolean('totp_enabled').default(false).notNull(),
  isTenantAdmin: boolean('is_tenant_admin').default(false).notNull(),
  isPlatformAdmin: boolean('is_platform_admin').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
}, (table) => [
  index('idx_users_email').on(table.email),
  index('idx_users_tenant').on(table.tenantId),
]);

// ── Teams ──

export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  verificationHash: text('verification_hash').notNull(),
  keySalt: text('key_salt').notNull(),
  recoveryKeyHash: text('recovery_key_hash'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('idx_teams_tenant_name').on(table.tenantId, table.name),
]);

// ── Team-Mitgliedschaften ──

export const teamMembers = pgTable('team_members', {
  userId: uuid('user_id').references(() => users.id).notNull(),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  role: text('role', { enum: ['admin', 'member', 'readonly'] }).notNull(),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  invitedBy: uuid('invited_by').references(() => users.id),
}, (table) => [
  primaryKey({ columns: [table.userId, table.teamId] }),
]);

// ── Tresor-Einträge ──

export const vaultEntries = pgTable('vault_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  encryptedData: text('encrypted_data').notNull(),
  iv: text('iv').notNull(),
  recoveryEncryptedData: text('recovery_encrypted_data'),
  recoveryIv: text('recovery_iv'),
  category: text('category').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_vault_entries_team').on(table.teamId),
  index('idx_vault_entries_tenant').on(table.tenantId),
]);

// ── Audit-Log (append-only) ──

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  teamId: uuid('team_id').references(() => teams.id),
  userId: uuid('user_id').references(() => users.id),
  entryId: uuid('entry_id'),
  action: text('action').notNull(),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_audit_tenant_time').on(table.tenantId, table.createdAt),
  index('idx_audit_user').on(table.userId, table.createdAt),
]);

// ── Einladungen ──

export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  email: text('email').notNull(),
  role: text('role', { enum: ['admin', 'member', 'readonly'] }).notNull(),
  teamId: uuid('team_id').references(() => teams.id),
  invitedBy: uuid('invited_by').references(() => users.id),
  token: text('token').unique().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_invitations_token').on(table.token),
  index('idx_invitations_tenant').on(table.tenantId),
]);

// ── Type Exports ──

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type VaultEntry = typeof vaultEntries.$inferSelect;
export type NewVaultEntry = typeof vaultEntries.$inferInsert;
export type AuditLogEntry = typeof auditLog.$inferSelect;
export type NewAuditLogEntry = typeof auditLog.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
