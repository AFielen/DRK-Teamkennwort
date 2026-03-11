/** Audit action types (shared between client and server) */
export type AuditAction =
  | 'login' | 'login.failed' | 'logout'
  | 'entry.view' | 'entry.create' | 'entry.update' | 'entry.delete'
  | 'team.create' | 'team.unlock' | 'team.unlock.failed' | 'team.lock'
  | 'team.master_changed' | 'team.recovery'
  | 'member.invite' | 'member.remove' | 'member.role_changed'
  | 'user.deactivated' | 'user.profile_updated'
  | 'admin.tenant.create' | 'admin.tenant.update' | 'admin.tenant.deactivate';

/** Human-readable labels for audit actions (DE) */
export const AUDIT_LABELS: Record<AuditAction, string> = {
  'login': 'hat sich angemeldet',
  'login.failed': 'Fehlgeschlagener Login-Versuch',
  'logout': 'hat sich abgemeldet',
  'entry.view': 'hat Eintrag angesehen',
  'entry.create': 'hat Eintrag erstellt',
  'entry.update': 'hat Eintrag bearbeitet',
  'entry.delete': 'hat Eintrag gelöscht',
  'team.create': 'hat Team erstellt',
  'team.unlock': 'hat Tresor entsperrt',
  'team.unlock.failed': 'Fehlgeschlagener Tresor-Entsperrversuch',
  'team.lock': 'hat Tresor gesperrt',
  'team.master_changed': 'hat Master-Passwort geändert',
  'team.recovery': 'hat Recovery-Key verwendet',
  'member.invite': 'hat Mitglied eingeladen',
  'member.remove': 'hat Mitglied entfernt',
  'member.role_changed': 'hat Rolle geändert',
  'user.deactivated': 'Account wurde deaktiviert',
  'user.profile_updated': 'hat Profil aktualisiert',
  'admin.tenant.create': 'hat Mandant erstellt',
  'admin.tenant.update': 'hat Mandant bearbeitet',
  'admin.tenant.deactivate': 'hat Mandant deaktiviert',
};
