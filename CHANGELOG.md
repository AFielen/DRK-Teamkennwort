# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).

---

## [Unreleased]

## [1.0.0] – 2026-03-11

### Added
- **Phase 0.4 – Mandanten-Middleware:** next.config.ts Security Headers (CSP, HSTS, X-Frame-Options), Caddyfile für Reverse Proxy
- **Phase 1.1 – Krypto-Modul:** Zero-Knowledge clientseitige Verschlüsselung (AES-256-GCM, PBKDF2 600k Iterationen), Passwort-Generator, Stärkemessung, Recovery-Key-Generierung
- **Phase 1.2 – Team-Verwaltung:** API-Routes für Teams (CRUD), Team-Erstellung mit Master-Passwort + Salt + Verification Key, Recovery Key Flow, Team-Entsperrung, Team-Übersicht
- **Phase 1.3 – Tresor (CRUD):** API-Routes für verschlüsselte Einträge (GET/POST/PUT/DELETE), Tresor-Ansicht mit Suche & Kategorie-Filter, Neuer-Eintrag-Formular mit Passwort-Generator, Inline-Bearbeitung & Löschen
- **Phase 1.4 – Mitglieder-Verwaltung:** Einladungssystem per E-Mail, Mitglieder-Liste mit Rollen (Admin/Mitglied), Team-Mitglieder API
- **Phase 1.5 – Plattform-Admin:** Admin-Dashboard mit Statistiken, Mandanten-Verwaltung (CRUD), System-Status Seite, Admin-API-Routes
- **Phase 1.6 – Audit-Log:** Audit-Log API mit Mandanten-Isolation, Audit-Ansicht in Verwaltung und Admin, Client-sichere Audit-Labels (lib/audit-labels.ts)
- **Phase 2.1 – Security:** Rate Limiting (lib/rate-limit.ts), Security Headers in next.config.ts und Caddyfile
- **Phase 2.2 – E-Mail-System:** Mailjet SMTP Integration (lib/mail.ts), DRK-gebrandete HTML-Templates für Einladungen und Magic Links
- **Phase 2.3 – UX:** Responsive Tresor-Ansicht, Passwort-Stärke-Anzeige, Kategorie-Icons
- **Phase 3.2 – Deployment:** Dockerfile (Multi-Stage), docker-compose.yml, Caddyfile, GitHub Actions CI/CD (.github/workflows/deploy.yml)
- Kategorien-System (lib/categories.ts): 7 Kategorien (WLAN, Gebäude, System, Social Media, E-Mail, Dienstleister, Sonstige)
- Domain-Validierung (lib/domain-check.ts) für Einladungen
- Health-Check API (/api/health)

### Changed
- lib/audit.ts: Server-only Modul, re-exportiert Labels aus audit-labels.ts
- next.config.ts: Security Headers hinzugefügt (CSP, X-Frame-Options, HSTS)

## [0.3.0] – 2026-03-11

### Added
- Auth-System: Passkey-Login (WebAuthn), TOTP (2FA), Magic Link
- Login-Seite, TOTP-Verifizierung, Registrierung, TOTP-Setup
- Session-Management (iron-session, 8h, HttpOnly, Secure)
- Middleware für Route Protection (/tresor, /verwaltung, /admin)
- Auth API-Routes: me, logout, register, passkey (options/verify), totp, magic-link (send/verify), invitation/validate, totp/setup+verify

## [0.2.0] – 2026-03-11

### Added
- Drizzle ORM Schema (lib/schema.ts): tenants, users, teams, teamMembers, vaultEntries, auditLog, invitations
- Datenbankverbindung (lib/db.ts) mit Tenant-Isolation (withTenant)
- RLS-Policies SQL (drizzle/0001_rls_policies.sql)
- Seed-Script (scripts/seed.ts)
- drizzle.config.ts

## [0.1.0] – 2026-03-11

### Added
- Projekt von DRK App-Template auf DRK Kennwort umgestellt
- Deployment auf Server-Variante (`output: 'standalone'`) umgestellt
- Dockerfile (Multi-Stage Build) und docker-compose.yml (App + PostgreSQL 16) erstellt
- `.env.example` mit allen erforderlichen Umgebungsvariablen
- Dependencies installiert: drizzle-orm, drizzle-kit, @simplewebauthn/server, @simplewebauthn/browser, otpauth, argon2, iron-session, nodemailer, nanoid, qrcode, postgres
- Startseite mit Features-Übersicht (Zero-Knowledge, Team-Tresore, Mandantenfähigkeit) und Zwei-Türen-Prinzip
- Datenschutzerklärung für Server-Variante: Hetzner Hosting, Mailjet E-Mail, PostgreSQL, Zero-Knowledge-Verschlüsselung, Betroffenenrechte
- Hilfe-Seite mit FAQ zu Verschlüsselung, Master-Passwort, Passkeys, TOTP, DSGVO
- i18n-Übersetzungen für Kennwort-App (Login, Tresor, Teams, Master-Passwort, Zero-Knowledge)
- README.md nach DRK-Pflichtformat (Features, Installation, Tech-Stack, Projektstruktur, Sicherheit)

### Changed
- `next.config.ts`: `output` von `'export'` auf `'standalone'` geändert
- Layout: APP_TITEL → "DRK Kennwort", APP_UNTERTITEL → "Sicheres Passwort-Management für Teams"
- `lib/version.ts`: Version auf 0.1.0, Name auf "DRK Kennwort"
- Startseite nutzt jetzt konsequent CSS-Variablen und Inline-SVGs statt Emojis und Tailwind-Hardcoded-Farben

---

### Template-Basis (vor v0.1.0)

### Added
- Print-Styles: Header, Footer und Buttons werden beim Drucken ausgeblendet, Cards brechen nicht um
- Bottom-Sheet-Animationen (`.drk-sheet-enter`, `.drk-backdrop-enter`) als Template-Pattern
- Accessibility: `focus-visible`-Outline für `<details>`/`<summary>` Elemente
- `favicon.svg` (Rotes Kreuz auf rotem Hintergrund) in `public/`
- `CHANGELOG.md` erstellt

### Changed
- Alle Pflichtseiten (Impressum, Datenschutz, Hilfe, Spenden, 404) nutzen jetzt konsequent CSS-Variablen statt Tailwind-Hardcoded-Farben (`bg-gray-50`, `text-gray-900` etc.)
- Impressum vervollständigt: Telefonnummer, Vorstandsname, Umsatzsteuer-ID, Registernummer, Haftungsausschluss
- Datenschutzerklärung erweitert auf 9 nummerierte Abschnitte (Hosting-Platzhalter, Änderungshinweis etc.)
- Hilfe-Seite: Kontakt-E-Mail auf `digitalisierung@drk-aachen.de` aktualisiert, erweiterte Kontaktbox
- Header-Subtitle responsive: Langversion ab `sm:`, Kurzversion auf Mobile
- `tsconfig.json`: `jsx` auf `react-jsx` aktualisiert, `.next/dev/types/**/*.ts` in `include` ergänzt

---

## [1.0.0] – 2026-03-03

### Added
- Initiales DRK App-Template mit Next.js 16, React 19, TypeScript strict, Tailwind CSS 4
- DRK Design-System: CSS-Variablen, Utility-Klassen (`.drk-card`, `.drk-btn-primary` etc.)
- Pflichtseiten: Impressum, Datenschutz, Hilfe, Spenden, 404
- i18n-System (DE/EN) mit shared + app-spezifischen Übersetzungen
- Root-Layout mit DRK-Header (rot) und Footer (hell)
- Animationen: `.drk-fade-in`, `.drk-slide-up`
- Status-Badges: `.drk-badge-success`, `.drk-badge-warning`, `.drk-badge-error`
