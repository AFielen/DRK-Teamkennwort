export type Locale = 'de' | 'en';

// ── Gemeinsame Übersetzungen (in jeder DRK-App gleich) ──
const shared = {
  de: {
    'nav.impressum': 'Impressum',
    'nav.datenschutz': 'Datenschutz',
    'nav.hilfe': 'Hilfe',
    'nav.language': 'EN',
    'footer.copyright': '© {year} DRK Kreisverband StädteRegion Aachen e.V.',
    'footer.tagline': 'Open Source · Kostenlos · DSGVO-konform · Gebaut mit ❤️ für das Deutsche Rote Kreuz',
    'common.yes': 'Ja',
    'common.no': 'Nein',
    'common.save': 'Speichern',
    'common.cancel': 'Abbrechen',
    'common.back': 'Zurück',
    'common.next': 'Weiter',
    'common.close': 'Schließen',
    'common.loading': 'Laden...',
    'common.error': 'Fehler',
    'common.success': 'Erfolgreich',
    'error.notfound': 'Seite nicht gefunden',
    'error.notfound.desc': 'Die angeforderte Seite existiert nicht.',
    'error.notfound.back': 'Zurück zur Startseite',
  },
  en: {
    'nav.impressum': 'Legal Notice',
    'nav.datenschutz': 'Privacy Policy',
    'nav.hilfe': 'Help',
    'nav.language': 'DE',
    'footer.copyright': '© {year} German Red Cross, District Association StädteRegion Aachen',
    'footer.tagline': 'Open Source · Free · GDPR-compliant · Built with ❤️ for the German Red Cross',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.close': 'Close',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'error.notfound': 'Page not found',
    'error.notfound.desc': 'The requested page does not exist.',
    'error.notfound.back': 'Back to home',
  },
} as const;

// ── App-spezifische Übersetzungen (hier pro App erweitern) ──
const appTranslations = {
  de: {
    'app.title': 'DRK Kennwort',
    'app.subtitle': 'Sicheres Passwort-Management für Teams',
    'app.description': 'Mandantenfähige Passwort-Verwaltung mit Zero-Knowledge-Verschlüsselung für DRK-Gliederungen.',
    'app.login': 'Anmelden',
    'app.register': 'Registrieren',
    'app.logout': 'Abmelden',
    'app.vault': 'Tresor',
    'app.teams': 'Teams',
    'app.settings': 'Einstellungen',
    'app.masterPassword': 'Master-Passwort',
    'app.masterPassword.hint': 'Dieses Passwort entschlüsselt den Team-Tresor. Es wird nirgendwo gespeichert.',
    'app.entry.title': 'Titel',
    'app.entry.username': 'Benutzername',
    'app.entry.password': 'Passwort',
    'app.entry.url': 'URL',
    'app.entry.notes': 'Notizen',
    'app.entry.category': 'Kategorie',
    'app.zeroKnowledge': 'Zero-Knowledge-Verschlüsselung',
    'app.zeroKnowledge.desc': 'Alle Passwörter werden lokal im Browser verschlüsselt. Der Server sieht nie ein Klartext-Passwort.',
  },
  en: {
    'app.title': 'DRK Password',
    'app.subtitle': 'Secure Password Management for Teams',
    'app.description': 'Multi-tenant password management with zero-knowledge encryption for Red Cross organizations.',
    'app.login': 'Sign in',
    'app.register': 'Register',
    'app.logout': 'Sign out',
    'app.vault': 'Vault',
    'app.teams': 'Teams',
    'app.settings': 'Settings',
    'app.masterPassword': 'Master Password',
    'app.masterPassword.hint': 'This password decrypts the team vault. It is never stored anywhere.',
    'app.entry.title': 'Title',
    'app.entry.username': 'Username',
    'app.entry.password': 'Password',
    'app.entry.url': 'URL',
    'app.entry.notes': 'Notes',
    'app.entry.category': 'Category',
    'app.zeroKnowledge': 'Zero-Knowledge Encryption',
    'app.zeroKnowledge.desc': 'All passwords are encrypted locally in the browser. The server never sees a plaintext password.',
  },
} as const;

// ── Zusammengeführte Übersetzungen ──
type TranslationKey = keyof typeof shared['de'] | keyof typeof appTranslations['de'];

const translations: Record<Locale, Record<string, string>> = {
  de: { ...shared.de, ...appTranslations.de },
  en: { ...shared.en, ...appTranslations.en },
};

/**
 * Übersetzungsfunktion
 * @param key - Übersetzungsschlüssel
 * @param locale - Sprache (default: 'de')
 * @param params - Platzhalter-Werte, z.B. { year: '2026' }
 */
export function t(
  key: TranslationKey | string,
  locale: Locale = 'de',
  params?: Record<string, string>
): string {
  let text = translations[locale]?.[key] || translations['de']?.[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });
  }
  return text;
}

/**
 * Alle Keys einer Kategorie holen (z.B. alle 'app.*' Keys)
 */
export function tGroup(prefix: string, locale: Locale = 'de'): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(translations[locale])) {
    if (key.startsWith(prefix)) {
      result[key] = value;
    }
  }
  return result;
}
