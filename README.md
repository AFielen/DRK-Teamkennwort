# 🔐 DRK Kennwort

**Sicheres Passwort-Management für DRK-Teams.**

Open Source · Kostenlos · DSGVO-konform

---

## Was ist das?

DRK Kennwort ist eine mandantenfähige Passwort-Verwaltung für DRK-Kreisverbände. Teams teilen sich einen verschlüsselten Tresor mit eigenem Master-Passwort – wie KeePass, aber als Web-Anwendung. Zero-Knowledge-Architektur: Der Server sieht nie ein Klartext-Passwort.

## Features

### Web-App
- **Zero-Knowledge-Verschlüsselung** — AES-256-GCM im Browser, Server speichert nur Ciphertext
- **Zwei-Türen-Prinzip** — Account-Login (Passkey/TOTP) + Team-Master-Passwort
- **Mandantenfähig** — Strikt isolierte Kreisverbände via PostgreSQL Row-Level Security
- **Team-Tresore** — Jedes Team hat eigenen Tresor mit eigenem Master-Passwort
- **Passkey-Unterstützung** — Moderne, passwortlose Anmeldung
- **TOTP (2FA)** — Zeitbasierte Einmalcodes als Alternative
- **Audit-Log** — Lückenlose Protokollierung aller Zugriffe
- **Recovery-Key** — Notfall-Wiederherstellung bei verlorenem Master-Passwort
- **Zweisprachig (DE/EN)** — Internationalisierung von Tag 1

### REST-API
- Team-Verwaltung, Tresor-CRUD, Einladungssystem
- Mandanten-isolierte Endpunkte
- Session-basierte Authentifizierung

## Installation

### Docker (empfohlen)

```bash
git clone https://github.com/AFielen/DRK-Teamkennwort.git
cd DRK-Teamkennwort
cp .env.example .env
# .env anpassen (DB_PASSWORD, SESSION_SECRET etc.)
docker compose up -d
```

### Lokal entwickeln

```bash
git clone https://github.com/AFielen/DRK-Teamkennwort.git
cd DRK-Teamkennwort
npm install
npm run dev
```

## Tech-Stack

| Technologie | Version | Zweck |
|---|---|---|
| [Next.js](https://nextjs.org/) | 16 | App-Framework (App Router) |
| [React](https://react.dev/) | 19 | UI-Library |
| [TypeScript](https://www.typescriptlang.org/) | strict | Typisierung |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | Styling |
| [Drizzle ORM](https://orm.drizzle.team/) | - | Datenbank-ORM |
| [PostgreSQL](https://www.postgresql.org/) | 16 | Datenbank |
| [SimpleWebAuthn](https://simplewebauthn.dev/) | - | Passkey-Authentifizierung |

## Projektstruktur

```
DRK-Teamkennwort/
├── app/
│   ├── layout.tsx              # Root-Layout: DRK-Header + Footer
│   ├── page.tsx                # Startseite
│   ├── globals.css             # DRK CSS-Variablen + Basis-Styles
│   ├── not-found.tsx           # Custom 404
│   ├── impressum/page.tsx      # Impressum (Pflicht)
│   ├── datenschutz/page.tsx    # Datenschutz (Pflicht)
│   ├── hilfe/page.tsx          # Hilfe & FAQ (Pflicht)
│   ├── spenden/page.tsx        # Spenden (Pflicht)
│   └── api/                    # API-Routes
├── components/                 # React-Komponenten
├── lib/
│   ├── types.ts                # TypeScript-Typen
│   ├── i18n.ts                 # Übersetzungen (DE/EN)
│   └── version.ts              # Versionierung
├── public/                     # Statische Assets
├── Dockerfile                  # Multi-Stage Docker Build
├── docker-compose.yml          # App + PostgreSQL
├── CLAUDE.md                   # Konventionen für Claude Code
├── INFRASTRUCTURE.md           # DSGVO-Goldstandard Infrastruktur
└── DRK-KENNWORT-ROADMAP.md     # Entwicklungs-Roadmap
```

## Datenschutz & Sicherheit

- **Zero-Knowledge** — Passwörter werden clientseitig verschlüsselt, Server sieht nur Ciphertext
- **Hosting in Deutschland** — Hetzner Cloud, kein US-Anbieter in der Kette
- **Keine Cookies** — Session-basiert ohne Cookies
- **Keine Tracker** — Keine Analytics, keine externen Dienste
- **Open Source** — Vollständig transparenter Quellcode
- **E-Mail über Mailjet (EU)** — SMTP-Relay, Server in Frankreich, AVV vorhanden

## Beitragen

1. Fork erstellen
2. Feature-Branch anlegen (`git checkout -b feat/mein-feature`)
3. Änderungen committen (`git commit -m 'feat: Beschreibung'`)
4. Branch pushen (`git push origin feat/mein-feature`)
5. Pull Request erstellen

## Lizenz

MIT — Frei verwendbar für alle DRK-Gliederungen und darüber hinaus.

## Über

Ein Projekt des [DRK Kreisverband StädteRegion Aachen e.V.](https://www.drk-aachen.de/)

---

*Gebaut mit ❤️ für das Deutsche Rote Kreuz*
