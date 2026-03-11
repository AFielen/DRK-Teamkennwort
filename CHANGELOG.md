# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).

---

## [Unreleased]

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
