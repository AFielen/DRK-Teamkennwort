# 🔐 DRK Kennwort — Development Roadmap
## Für die Abarbeitung mit Claude Code

**Repo:** github.com/AFielen/drk-kennwort
**Domain:** drk-kennwort.de (Checkdomain → Hetzner DNS)
**Ziel:** Produktionsreife mandantenfähige Passwort-Plattform
**Stack:** Next.js 16, React 19, TypeScript (strict), Tailwind CSS 4, Drizzle ORM, PostgreSQL 16, Hetzner
**Template:** github.com/AFielen/drk-app-template.git (CLAUDE.md + INFRASTRUCTURE.md lesen!)
**Auth-Referenz:** github.com/AFielen/kidood (Passkey + TOTP Pattern übernehmen)
**Design-Referenz:** github.com/AFielen/NIS2-Audit.git (DRK CSS-Variablen, Header/Footer)
**Methode:** Jeder Task = ein Claude-Code-Prompt

---

## Architektur-Überblick

```
drk-kennwort.de
│
├── Mandant: KV Aachen (@drk-aachen.de)
│   ├── Team "Rettungsdienst" [eigenes Master-PW]
│   ├── Team "Verwaltung"     [eigenes Master-PW]
│   └── Team "Social Media"   [eigenes Master-PW]
│
├── Mandant: KV Köln (@drk-koeln.de)
│   └── Team "IT"             [eigenes Master-PW]
│
└── ... (beliebig viele KVs, strikt isoliert)
```

**Zwei-Türen-Prinzip:**
- Tür 1: Account-Login (E-Mail + Passkey/TOTP) → identifiziert den User
- Tür 2: Team-Master-Passwort → entschlüsselt den Tresor (KeePass-Prinzip)

**Zero-Knowledge:** Server sieht nie ein Klartext-Passwort. Verschlüsselung = clientseitig (Web Crypto API).

**Mandanten-Isolation:** PostgreSQL Row-Level Security. Kein KV sieht den anderen. Kein User in 2 KVs. Nur erlaubte E-Mail-Domains.

---

## Phase 0 — Fundament (Woche 1–2)

### 0.1 Projekt aus Template erstellen + Anpassen

```
Prompt: "Klone das DRK App Template von github.com/AFielen/drk-app-template.git.
Lies CLAUDE.md und INFRASTRUCTURE.md vollständig — das sind die verbindlichen Konventionen.
Lies die CSS-Styles aus github.com/AFielen/NIS2-Audit.git als Design-Referenz.

Erstelle daraus das Projekt 'drk-kennwort':
- GitHub Repo: github.com/AFielen/drk-kennwort
- Deployment-Variante B (Server): output: 'standalone' in next.config.ts
- Docker + docker-compose Setup gemäß INFRASTRUCTURE.md Variante B

Anpassungen am Template:
- APP_TITEL → 'DRK Kennwort'
- APP_UNTERTITEL → 'Sicheres Passwort-Management für Teams'
- Alle Pflichtseiten anpassen (Impressum, Datenschutz, Hilfe, Spenden)
- Datenschutz: Hetzner, Mailjet als Verarbeiter auflisten
- i18n: DE + EN gemäß Template-Konvention (lib/i18n.ts)

Zusätzliche Packages installieren:
- drizzle-orm + drizzle-kit (DB)
- @simplewebauthn/server + @simplewebauthn/browser (Passkeys)
- otpauth (TOTP)
- argon2 (Passwort-Hashing)
- iron-session (Sessions)
- nodemailer (Email via Mailjet SMTP)
- nanoid (Token-Generierung)
- qrcode (QR-Code-Generierung)

docker-compose.yml:
services:
  app:
    build: .
    ports: ['3000:3000']
    environment:
      DATABASE_URL: postgresql://drk:\${DB_PASSWORD}@db:5432/kennwort
      SESSION_SECRET: \${SESSION_SECRET}
      MAILJET_API_KEY: \${MAILJET_API_KEY}
      MAILJET_SECRET_KEY: \${MAILJET_SECRET_KEY}
      MAIL_FROM: noreply@drk-kennwort.de
      NEXT_PUBLIC_APP_URL: https://drk-kennwort.de
    depends_on: [db]
    restart: unless-stopped
  db:
    image: postgres:16-alpine
    volumes: [pgdata:/var/lib/postgresql/data]
    environment:
      POSTGRES_USER: drk
      POSTGRES_PASSWORD: \${DB_PASSWORD}
      POSTGRES_DB: kennwort
    restart: unless-stopped
volumes:
  pgdata:

Git-Setup:
- .gitignore (node_modules, .env*, .next, dist)
- Initial Commit + Push auf main
- Branch: main (Production) + dev (Development)
- CHANGELOG.md anlegen (Keep a Changelog Format)
- Git-Tag: v0.0

Ergebnis: 'npm run dev' startet App + DB lokal.
Seite lädt unter localhost:3000 mit DRK-Header + Footer."
```

---

### 0.2 Datenbank-Schema

```
Prompt: "Erstelle das Drizzle ORM Schema in lib/schema.ts für folgende Entitäten.
WICHTIG: Lies zuerst INFRASTRUCTURE.md — PostgreSQL ist Goldstandard, kein anderer DB-Provider.

MANDANTEN:
- tenants (id UUID PK, name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL,
  allowedEmailDomains TEXT[] NOT NULL CHECK array_length > 0,
  isActive BOOLEAN DEFAULT true, createdAt TIMESTAMPTZ DEFAULT now())

USERS:
- users (id UUID PK, tenantId UUID FK tenants NOT NULL,
  email TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
  passwordHash TEXT NOT NULL — Argon2id für Account-Passwort,
  passkeyCredentials JSONB DEFAULT '[]' — WebAuthn Credentials Array,
  totpSecret TEXT nullable — TOTP Secret (encrypted),
  totpEnabled BOOLEAN DEFAULT false,
  isTenantAdmin BOOLEAN DEFAULT false,
  isPlatformAdmin BOOLEAN DEFAULT false,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMPTZ DEFAULT now(),
  lastLoginAt TIMESTAMPTZ)
- Index: idx_users_email ON users(email)

TEAMS:
- teams (id UUID PK, tenantId UUID FK NOT NULL,
  name TEXT NOT NULL, description TEXT,
  verificationHash TEXT NOT NULL — Argon2id(HKDF(PBKDF2(masterPw))),
  keySalt TEXT NOT NULL — PBKDF2 Salt Base64,
  recoveryKeyHash TEXT — Argon2id des Recovery Keys (für Notfall),
  createdBy UUID FK users,
  createdAt TIMESTAMPTZ DEFAULT now(),
  UNIQUE (tenantId, name))

TEAM-MITGLIEDSCHAFTEN:
- teamMembers (userId UUID FK NOT NULL, teamId UUID FK NOT NULL,
  role TEXT CHECK IN ('admin','member','readonly') NOT NULL,
  joinedAt TIMESTAMPTZ DEFAULT now(),
  invitedBy UUID FK users,
  PRIMARY KEY (userId, teamId))

TRESOR-EINTRÄGE:
- vaultEntries (id UUID PK, tenantId UUID FK NOT NULL,
  teamId UUID FK NOT NULL,
  encryptedData TEXT NOT NULL — AES-256-GCM Blob Base64,
  iv TEXT NOT NULL — Initialization Vector Base64,
  category TEXT NOT NULL,
  expiresAt TIMESTAMPTZ — optionales Ablaufdatum,
  createdBy UUID FK users, updatedBy UUID FK users,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ DEFAULT now())

AUDIT-LOG (append-only):
- auditLog (id UUID PK, tenantId UUID FK NOT NULL,
  teamId UUID FK, userId UUID FK, entryId UUID,
  action TEXT NOT NULL — 'entry.view','entry.create','entry.update',
    'entry.delete','team.unlock','team.lock','team.create',
    'member.invite','member.remove','login','login.failed',
    'admin.tenant.create','admin.tenant.update',
  ipAddress INET, userAgent TEXT, metadata JSONB,
  createdAt TIMESTAMPTZ DEFAULT now())
- Index: idx_audit_tenant_time ON auditLog(tenantId, createdAt DESC)
- Index: idx_audit_user ON auditLog(userId, createdAt DESC)

EINLADUNGEN:
- invitations (id UUID PK, tenantId UUID FK NOT NULL,
  email TEXT NOT NULL, role TEXT CHECK IN ('admin','member','readonly') NOT NULL,
  teamId UUID FK — optional: direkt einem Team zuordnen,
  invitedBy UUID FK users,
  token TEXT UNIQUE NOT NULL — nanoid für Registrierungslink,
  expiresAt TIMESTAMPTZ NOT NULL,
  usedAt TIMESTAMPTZ — NULL = noch nicht eingelöst,
  createdAt TIMESTAMPTZ DEFAULT now())

ROW-LEVEL SECURITY auf allen mandantenrelevanten Tabellen:
- ENABLE RLS auf: users, teams, teamMembers, vaultEntries, auditLog, invitations
- Policy 'tenant_isolation' auf jeder: USING (tenantId = current_setting('app.current_tenant')::uuid)
- REVOKE DELETE ON auditLog FROM app_user — Audit-Log ist append-only

Erstelle initiale Migration mit drizzle-kit.
Erstelle Seed-Script (npm run db:seed) mit:
- 1 Platform-Admin (admin@drk-kennwort.de, isPlatformAdmin: true)
- 1 Mandant 'KV StädteRegion Aachen' (slug: aachen, domain: drk-aachen.de)
- 1 KV-Admin (admin@drk-aachen.de, isTenantAdmin: true)
- 2 Teams: 'Rettungsdienst', 'Verwaltung'
- 3 Mitglieder mit verschiedenen Rollen
- 10 Beispiel-Tresor-Einträge (verschlüsselt mit Test-Master-PW 'Test1234!')
- Audit-Log-Einträge

Ergebnis: 'npm run db:migrate' + 'npm run db:seed' funktioniert.
Seed-Daten in DB sichtbar via Drizzle Studio ('npx drizzle-kit studio')."
```

---

### 0.3 Auth — Passkeys + TOTP + Magic Link

```
Prompt: "Implementiere die Authentifizierung. 
REFERENZ: Lies das Auth-Pattern aus github.com/AFielen/kidood — 
insbesondere Phase 0.4 (WebAuthn/Passkeys) und die TOTP-Implementierung im Admin.
Übernimm das Pattern und passe es an.

WebAuthn/Passkey-Registration:
1. User gibt E-Mail ein (aus Einladungslink vorausgefüllt)
2. Server generiert Challenge
3. Browser zeigt Passkey-Dialog (Face ID / Touch ID / Windows Hello)
4. Credential wird in users.passkeyCredentials gespeichert
Packages: @simplewebauthn/server + @simplewebauthn/browser

WebAuthn/Passkey-Login:
1. User tippt auf 'Anmelden'
2. Browser zeigt Passkey-Auswahl (Autofill)
3. Biometrische Bestätigung
4. Session wird erstellt

TOTP (Zwei-Faktor):
- Einrichtung: QR-Code mit TOTP-Secret generieren (otpauth Library)
- User scannt mit Authenticator-App (Google Auth, Authy etc.)
- Bestätigung: 6-stelliger Code
- totpSecret verschlüsselt in DB speichern
- totpEnabled = true
- Bei Login: Nach Passkey → TOTP-Code abfragen falls aktiviert
- PFLICHT für: Platform-Admins, KV-Admins
- OPTIONAL für: normale Mitglieder (empfohlen)

Magic-Link-Fallback (für Geräte ohne Passkey):
- User gibt E-Mail ein → Server sendet Link per Mailjet
- Link enthält einmaligen Token (nanoid, 15 Min gültig)
- Klick → Session wird erstellt
- Nach Login: Empfehlung Passkey einzurichten

Session-Management:
- Iron-Session in HttpOnly, Secure, SameSite=Strict Cookie
- Session enthält: userId, tenantId, email, role, isTenantAdmin, isPlatformAdmin
- Session-Dauer: 8 Stunden, kein Rolling
- Logout: Session serverseitig invalidieren
- Bei jedem API-Request: Middleware setzt SET LOCAL app.current_tenant = tenantId

Rate Limiting:
- Login-Versuche: max 5 pro Minute pro IP, dann 15 Min Sperre
- Progressive Delays: 0s, 1s, 2s, 4s, 8s nach Fehlversuchen
- Audit-Log: login + login.failed Events

Tenant-Erkennung beim Login:
- User gibt E-Mail ein → Server sucht User → kennt tenantId
- KEIN Dropdown 'Wähle deinen KV' — E-Mail bestimmt den Mandanten
- Wenn E-Mail nicht existiert: generische Fehlermeldung
  'Zugangsdaten ungültig' (NICHT verraten ob E-Mail existiert)

API-Routes:
- POST /api/auth/register (mit Einladungstoken)
- POST /api/auth/login/passkey/options (Challenge generieren)
- POST /api/auth/login/passkey/verify (Passkey verifizieren)
- POST /api/auth/login/totp (TOTP-Code prüfen)
- POST /api/auth/login/magic-link (Magic Link senden)
- GET  /api/auth/login/magic-link/verify?token=xxx
- POST /api/auth/logout
- GET  /api/auth/me (aktuelle Session)

Erstelle Seiten:
- /login — E-Mail-Eingabe, Passkey-Button, Magic-Link-Option
- /registrieren?token=xxx — Registrierung via Einladungslink
  (Name, E-Mail vorausgefüllt, Passkey erstellen, optional TOTP)
- /totp-setup — TOTP einrichten (QR-Code + Bestätigungscode)

Design: DRK-Konventionen aus CLAUDE.md (rote Header, weiße Cards, 
CSS-Variablen für Farben, System-Font-Stack, Touch-Targets 44px).
Kein KV-Name auf dem Login-Screen. Kein Hinweis welche KVs existieren.

Ergebnis: Passkey-Login funktioniert. TOTP funktioniert. 
Magic Link funktioniert. Session wird korrekt gesetzt."
```

---

### 0.4 Mandanten-Middleware + Isolation

```
Prompt: "Implementiere die Mandanten-Isolation als Middleware-Schicht.

Next.js Middleware (middleware.ts):
- Prüfe Session bei jedem Request auf geschützte Routes
- Extrahiere tenantId aus Session
- Wenn nicht eingeloggt: Redirect zu /login
- Wenn eingeloggt aber Route erfordert Admin: prüfe isTenantAdmin
- Wenn Platform-Admin-Route: prüfe isPlatformAdmin

DB-Middleware (lib/db.ts):
- Wrapper um jede DB-Query
- Setzt automatisch: SET LOCAL app.current_tenant = tenantId
- Beispiel:

async function withTenant<T>(tenantId: string, fn: (db: DB) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql\`SET LOCAL app.current_tenant = \${tenantId}\`);
    return fn(tx);
  });
}

API-Route-Handler Pattern:
- Jeder API-Endpoint extrahiert tenantId aus Session
- Nutzt withTenant() für alle DB-Operationen
- Niemals tenantId aus Request-Body oder URL-Parametern

Sicherheitstests (als Unit-Tests mit vitest):
1. User A (Mandant Aachen) kann eigene Teams sehen → ✅
2. User A kann Teams von Mandant Köln NICHT sehen → ✅ (leeres Ergebnis)
3. Direkter DB-Query ohne SET LOCAL → ✅ (RLS blockiert)
4. API-Call mit manipulierter tenantId im Body → ✅ (wird ignoriert, Session gewinnt)
5. User-Registrierung mit E-Mail eines anderen Mandanten → ✅ (Fehler)
6. Einladung mit E-Mail-Domain eines anderen Mandanten → ✅ (Fehler)

Domain-Validierung (lib/domain-check.ts):
function validateEmailDomain(email: string, allowedDomains: string[]): boolean
- Extrahiert Domain aus E-Mail
- Prüft gegen allowedDomains Array des Mandanten
- Case-insensitive
- Wird genutzt bei: Einladung senden, Registrierung

Ergebnis: Mandanten-Isolation ist wasserdicht auf DB-Ebene + API-Ebene.
Alle Sicherheitstests grün."
```

---

## Phase 1 — Kern-Features + Admin (Woche 3–5)

### 1.1 Krypto-Modul (clientseitig)

```
Prompt: "Erstelle das Krypto-Modul in lib/crypto.ts.
NUR Web Crypto API verwenden — kein custom Crypto, keine externen Krypto-Libraries.

Funktionen:

1. deriveKeys(masterPassword: string, salt: Uint8Array):
   - PBKDF2 mit SHA-256, 600.000 Iterationen
   - Erzeugt 512-bit Derived Key
   - Splittet in:
     a) encryptionKey (erste 256 bit) → AES-256-GCM
     b) verificationInput (letzte 256 bit) → wird an Server gesendet
   - Return: { encryptionKey: CryptoKey, verificationKey: string (Base64) }

2. encrypt(data: object, encryptionKey: CryptoKey):
   - JSON.stringify(data)
   - Zufälligen 96-bit IV generieren (crypto.getRandomValues)
   - AES-256-GCM Encrypt
   - Return: { encryptedData: string (Base64), iv: string (Base64) }

3. decrypt(encryptedData: string, iv: string, encryptionKey: CryptoKey):
   - AES-256-GCM Decrypt
   - JSON.parse
   - Return: object
   
4. generateSalt(): 
   - 128-bit zufälliger Salt
   - Return: string (Base64)

5. generateRecoveryKey():
   - 256-bit zufällige Bytes
   - Formatiert als 8 Gruppen à 4 Zeichen: XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
   - Nur Großbuchstaben + Zahlen (ohne verwechselbare: 0/O, 1/I, 8/B)
   - Return: { recoveryKey: string, hash: string (Argon2id Hash) }

6. generatePassword(options: { length, uppercase, lowercase, numbers, symbols }):
   - Kryptographisch sicherer Passwort-Generator
   - crypto.getRandomValues für Zufallszahlen
   - Return: string

7. calculateStrength(password: string):
   - Berechnet Passwort-Stärke (0-100)
   - Faktoren: Länge, Zeichenvielfalt, Patterns, Wörterbuch-Check (Top-1000)
   - Return: { score: number, label: 'schwach'|'mittel'|'stark'|'sehr stark', color: string }

KRITISCHE Regeln:
- encryptionKey existiert NUR als CryptoKey im Memory
- Wird NIEMALS serialisiert, NIEMALS in localStorage/sessionStorage
- Bei Lock/Logout: Referenz wird auf null gesetzt → Garbage Collection
- Master-Passwort wird nach deriveKeys() sofort aus dem Speicher gelöscht
- Alle Crypto-Operationen sind async (Web Crypto API ist Promise-basiert)

Unit-Tests (vitest):
- Encrypt → Decrypt roundtrip
- Falscher Key → Decrypt schlägt fehl (AES-GCM AuthTag)
- deriveKeys mit gleichem PW + Salt → gleicher Output (deterministisch)
- deriveKeys mit anderem PW → anderer Output
- generateRecoveryKey → korrektes Format, keine verwechselbaren Zeichen
- generatePassword → erfüllt Options-Constraints

Ergebnis: Krypto-Modul mit 100% Testabdeckung."
```

---

### 1.2 Team-Verwaltung + Master-Passwort + Recovery Key

```
Prompt: "Implementiere die Team-Verwaltung mit Master-Passwort und Notfall-Recovery-Key.

Team erstellen (KV-Admin):
POST /api/teams
1. Admin gibt Team-Name + Master-Passwort ein
2. CLIENT: 
   - salt = generateSalt()
   - { encryptionKey, verificationKey } = deriveKeys(masterPassword, salt)
   - { recoveryKey, hash: recoveryKeyHash } = generateRecoveryKey()
3. CLIENT sendet an Server: { name, verificationKey, salt, recoveryKeyHash }
4. SERVER:
   - verificationHash = Argon2id(verificationKey)
   - Speichert: team mit verificationHash, keySalt, recoveryKeyHash
   - Audit-Log: team.create
5. CLIENT zeigt Recovery-Key-Screen:
   - Großer Kasten mit Recovery Key im Format XXXX-XXXX-XXXX-...
   - ROTER WARNHINWEIS: 'Diesen Schlüssel JETZT ausdrucken oder sicher notieren!
     Er wird NIEMALS wieder angezeigt. Ohne ihn können verlorene 
     Master-Passwörter NICHT wiederhergestellt werden.'
   - [PDF herunterladen] Button → generiert A4-PDF mit:
     * DRK-Logo
     * 'NOTFALL-WIEDERHERSTELLUNGSSCHLÜSSEL'
     * Team-Name + Datum
     * Recovery Key groß + gut lesbar
     * Anweisung: 'Dieses Dokument ausdrucken und im physischen Tresor aufbewahren.'
   - [Ich habe den Schlüssel gesichert] Checkbox → erst dann 'Weiter' aktiv
6. Team ist erstellt, Admin ist automatisch Mitglied (Rolle: admin)

Tresor entsperren (KeePass-Prinzip):
POST /api/teams/[teamId]/unlock
1. User gibt Master-Passwort ein
2. CLIENT:
   - Holt keySalt vom Server (GET /api/teams/[teamId]/salt)
   - { encryptionKey, verificationKey } = deriveKeys(masterPassword, salt)
3. CLIENT sendet verificationKey an Server
4. SERVER:
   - Prüft Argon2id(verificationKey) gegen teams.verificationHash
   - Wenn korrekt: Return { success: true }
   - Wenn falsch: Return { success: false } + Audit-Log: team.unlock.failed
   - Rate Limiting: max 5 Versuche / 15 Min pro User pro Team
5. CLIENT: encryptionKey bleibt im Memory → Tresor ist offen
6. Auto-Lock-Timer startet (15 Min Inaktivität)

Auto-Lock:
- Timer läuft clientseitig (useEffect mit Interval)
- Bei Maus/Keyboard/Touch-Event: Timer reset
- Bei Ablauf: encryptionKey = null → Redirect zur Master-PW-Eingabe
- Manuell: 'Tresor sperren' Button im Header
- Bei Tab-Wechsel (visibilitychange hidden > 5 Min): Lock

Recovery-Flow (Notfall):
POST /api/teams/[teamId]/recovery
1. KV-Admin gibt Recovery Key ein
2. SERVER: Prüft Argon2id(recoveryKey) gegen teams.recoveryKeyHash
3. Wenn korrekt:
   - Alle Einträge des Teams werden vom Server als encrypted Blobs geliefert
   - Admin setzt NEUES Master-Passwort
   - CLIENT: Neuer Salt, neuer encryptionKey, neuer verificationKey
   - CLIENT: Entschlüsselt alle Einträge mit Recovery-abgeleitetem Key → 
     Re-encrypted mit neuem Key
   → ACHTUNG: Für Recovery brauchen wir einen Recovery-Encryption-Key.
     Bei Team-Erstellung: encryptionKey + recoveryEncryptionKey beide werden 
     benutzt um jeden Eintrag DOPPELT zu verschlüsseln:
     a) Normal: AES-256-GCM mit Master-PW-abgeleitetem Key
     b) Recovery: AES-256-GCM mit Recovery-Key-abgeleitetem Key
     Beide Blobs werden pro Eintrag gespeichert.
4. Neuer Recovery Key wird generiert (alter ist verbraucht)
5. Audit-Log: team.recovery

Erweitere vaultEntries Schema:
- recoveryEncryptedData TEXT — zweiter Blob, verschlüsselt mit Recovery Key
- recoveryIv TEXT

WICHTIG: Recovery Key ist One-Time-Use. Nach Nutzung wird ein neuer generiert.

Master-Passwort ändern (KV-Admin):
POST /api/teams/[teamId]/change-master
1. Admin gibt ALTES + NEUES Master-Passwort ein
2. CLIENT: Entschlüsselt alle Einträge mit altem Key
3. CLIENT: Verschlüsselt alle Einträge mit neuem Key (+ neuer Recovery-Key-Encryption)
4. SERVER: Batch-Update aller Einträge + neuer verificationHash + neuer Salt
5. Neuer Recovery Key wird generiert
6. Audit-Log: team.master_changed

Seiten:
- /tresor (nach Login) — Liste der Teams mit Lock-Icons
- /tresor/[teamId]/unlock — Master-Passwort eingeben
- /verwaltung/teams — Teams verwalten (KV-Admin)
- /verwaltung/teams/neu — Team erstellen + Recovery Key
- /verwaltung/teams/[teamId]/recovery — Recovery-Flow
- /verwaltung/teams/[teamId]/passwort-aendern — Master-PW ändern

Ergebnis: Team-Lifecycle komplett. Recovery Key funktioniert. Auto-Lock funktioniert."
```

---

### 1.3 Tresor — CRUD für verschlüsselte Einträge

```
Prompt: "Implementiere den Tresor mit verschlüsselten Einträgen.

Eintrag erstellen:
POST /api/entries
1. CLIENT: User füllt Formular aus (Titel, Benutzername, Passwort, URL, Notizen)
2. CLIENT: 
   - dataObject = { title, username, password, url, notes }
   - { encryptedData, iv } = encrypt(dataObject, encryptionKey)
   - { recoveryEncryptedData, recoveryIv } = encrypt(dataObject, recoveryEncryptionKey)
3. CLIENT sendet: { teamId, encryptedData, iv, recoveryEncryptedData, recoveryIv, category }
4. SERVER: Speichert. Setzt createdBy, tenantId automatisch aus Session
5. Audit-Log: entry.create

Eintrag anzeigen:
GET /api/entries?teamId=xxx
1. SERVER: Liefert alle encrypted Blobs für das Team
2. CLIENT: decrypt(encryptedData, iv, encryptionKey) für jeden Eintrag
3. Darstellung: Passwort ist standardmäßig maskiert (●●●●●●)
4. Audit-Log: entry.view (bei Klick auf einzelnen Eintrag)

Eintrag bearbeiten:
PUT /api/entries/[id]
1. CLIENT: Entschlüsselt, User ändert, verschlüsselt neu (neuer IV!)
2. SERVER: Update encryptedData, iv, recoveryEncryptedData, recoveryIv, updatedBy
3. Audit-Log: entry.update

Eintrag löschen:
DELETE /api/entries/[id]
1. Bestätigungs-Dialog: 'Eintrag "[Titel]" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.'
2. SERVER: Hard Delete (kein Soft-Delete — Zero-Knowledge, wir wollen keine Daten behalten)
3. Audit-Log: entry.delete (Eintrag-ID bleibt im Log, aber kein Inhalt)

Kategorien (vordefiniert, in lib/categories.ts):
const CATEGORIES = [
  { id: 'wifi', label: 'WiFi & Netzwerk', icon: '🌐' },
  { id: 'building', label: 'Gebäude & Räume', icon: '🏢' },
  { id: 'system', label: 'Systeme & Portale', icon: '🖥️' },
  { id: 'social', label: 'Social Media', icon: '📱' },
  { id: 'email', label: 'E-Mail-Konten', icon: '📧' },
  { id: 'vendor', label: 'Dienstleister', icon: '🔧' },
  { id: 'other', label: 'Sonstiges', icon: '📋' },
] as const;
// i18n: Labels über i18n-Keys, nicht hardcoded

Suche & Filter:
- Volltextsuche über entschlüsselte Titel + Benutzername (clientseitig!)
- Kategorie-Filter (Dropdown oder Toggle-Chips)
- Sortierung: Name A-Z, Zuletzt geändert, Kategorie
- Suche läuft IMMER clientseitig (Server kennt keine Klartexte)

Clipboard:
- 📋 Button kopiert Passwort in Zwischenablage
- navigator.clipboard.writeText(password)
- Toast: 'Passwort kopiert. Wird in 30 Sekunden gelöscht.'
- setTimeout 30s → navigator.clipboard.writeText('')
- Bei Seiten-Verlassen/Lock: sofort clearen

Passwort-Generator (Komponente):
- Slider: Länge (8–64, Default 20)
- Toggles: Großbuchstaben, Kleinbuchstaben, Zahlen, Sonderzeichen
- Live-Preview des generierten Passworts
- Stärke-Anzeige (Farbbalken: rot → gelb → grün)
- Button: 'Übernehmen' → füllt Passwort-Feld
- Button: 'Neu generieren' (🔄)
- Nutzt lib/crypto.ts generatePassword() + calculateStrength()

Passwort-Anzeige:
- Default: ●●●●●●●● (maskiert)
- 👁 Button: Zeigt Klartext für 10 Sekunden, dann automatisch maskiert
- Audit-Log: entry.view bei Passwort-Reveal

Seiten:
- /tresor/[teamId] — Dashboard: Einträge gruppiert nach Kategorie
- /tresor/[teamId]/neu — Neuer Eintrag (Formular + Passwort-Generator)
- /tresor/[teamId]/[entryId] — Eintrag-Detail (anzeigen + bearbeiten)

Design:
- DRK Card-Layout (.drk-card aus globals.css)
- Kategorien als farbige Badges
- 📋 und 👁 als primäre Aktionen pro Eintrag
- Touch-Targets 44px minimum
- Auto-Lock-Timer oben rechts sichtbar (Countdown oder 'Aktiv'-Indikator)

Ergebnis: Vollständiger verschlüsselter Tresor mit CRUD, Suche, Generator, Clipboard."
```

---

### 1.4 Mitglieder-Verwaltung + Einladungen

```
Prompt: "Implementiere die Mitglieder-Verwaltung für KV-Admins.

Mitglied einladen:
POST /api/invitations
1. KV-Admin gibt E-Mail + Rolle ein
2. SERVER:
   - Domain-Check: email.split('@')[1] in tenant.allowedEmailDomains?
     → Wenn nein: Fehler 'Nur @{domain} Adressen können eingeladen werden.'
   - Global-Unique-Check: Existiert E-Mail in users-Tabelle (irgendeinem Mandant)?
     → Wenn ja: 'Diese E-Mail ist bereits registriert.'
       (NICHT verraten in welchem Mandanten!)
   - Erstelle Invitation: token = nanoid(24), expiresAt = now() + 7 Tage
3. SERVER sendet Einladungsmail via Mailjet:
   - Betreff: 'Einladung zu DRK Kennwort'
   - Inhalt: '{Admin-Name} hat dich eingeladen, dem Passwort-Tresor 
     von {KV-Name} beizutreten. [Link: drk-kennwort.de/registrieren?token=xxx]'
   - Link gültig 7 Tage
4. Audit-Log: member.invite

Registrierung via Einladungslink:
GET /registrieren?token=xxx
1. SERVER: Token validieren (existiert, nicht abgelaufen, nicht eingelöst)
2. Formular: Name (E-Mail vorausgefüllt aus Invitation)
3. Passkey erstellen (WebAuthn)
4. Optional: TOTP einrichten
5. SERVER: User erstellen, Invitation als 'used' markieren
6. Wenn Invitation einem Team zugeordnet: User automatisch als Mitglied hinzufügen
7. Redirect: /tresor

Mitglieder-Liste:
GET /api/teams/[teamId]/members
- KV-Admin sieht: Name, E-Mail, Rolle, Beitrittsdatum
- Aktionen: Rolle ändern, Entfernen

Mitglied entfernen:
DELETE /api/teams/[teamId]/members/[userId]
1. Bestätigungs-Dialog: '{Name} aus Team {Team} entfernen?'
2. SERVER: team_members Eintrag löschen
3. EMPFEHLUNG anzeigen: 'Tipp: Ändere das Master-Passwort des Teams, 
   da {Name} es noch kennt.'
4. Audit-Log: member.remove

Rolle ändern:
PUT /api/teams/[teamId]/members/[userId]
- KV-Admin kann Rolle ändern: admin ↔ member ↔ readonly
- Letzer Admin kann nicht degradiert werden (Check)
- Audit-Log: member.role_changed

Account deaktivieren (KV-Admin-Ebene):
PUT /api/users/[userId]/deactivate
- User kann sich nicht mehr einloggen
- Bleibt in DB (Audit-Log-Integrität)
- Alle Team-Mitgliedschaften bleiben (für Nachvollziehbarkeit)
- Audit-Log: user.deactivated

Seiten:
- /verwaltung/mitglieder — Alle Mitglieder des KV
- /verwaltung/mitglieder/einladen — Einladungsformular
- /verwaltung/teams/[teamId]/mitglieder — Mitglieder eines Teams

Design: DRK-Tabellen-Style (kein DataTable-Overkill, einfache responsive Tabelle).
Domain-Hinweis prominent: 'Nur @drk-aachen.de Adressen erlaubt'.

Ergebnis: Einladung → Registrierung → Team-Zuordnung → Rollenmanagement funktioniert."
```

---

### 1.5 Plattform-Admin-Dashboard

```
Prompt: "Erstelle das Plattform-Admin-Dashboard.
WICHTIG: Öffentlich erreichbar (erstmal), aber mit Passkey + TOTP geschützt.
Nur users mit isPlatformAdmin = true haben Zugriff.

Auth-Guard:
- Middleware prüft isPlatformAdmin auf allen /admin/* Routes
- Wenn nicht: 404 (NICHT 403 — Existenz der Admin-Seite nicht verraten)
- Platform-Admin MUSS TOTP aktiviert haben (Pflicht)

/admin (Dashboard):
- Kennzahlen-Karten:
  * Aktive Mandanten (Anzahl)
  * Aktive User (Anzahl, über alle Mandanten)
  * Teams gesamt
  * Tresor-Einträge gesamt
- Letzte Aktivitäten (aus Audit-Log, mandantenübergreifend — 
  nur Platform-Admin darf das):
  * Letzte Logins
  * Fehlgeschlagene Login-Versuche
  * Neue Registrierungen
- System-Status:
  * DB-Connection: OK/ERROR
  * Letzte Migration
  * Disk-Usage (pg_database_size)

/admin/mandanten:
- Tabelle: Name, Slug, Domains, User-Anzahl, Teams, Einträge, Status, Erstellt am
- KEIN Zugriff auf Tresor-Inhalte (Zero-Knowledge!)
- Aktionen:
  * [Neuer Mandant] → Formular:
    - Name (z.B. 'KV Düren')
    - Slug (z.B. 'dueren', auto-generiert aus Name)
    - Erlaubte E-Mail-Domains (z.B. 'drk-dueren.de'), mehrere möglich
    - → Erstellt Mandant + ersten KV-Admin-Account
    - → Sendet Einladungsmail an KV-Admin
  * Mandant deaktivieren (mit Bestätigung)
  * Mandant reaktivieren
  * Domains bearbeiten
  * NICHT: Mandant löschen (zu gefährlich, nur deaktivieren)

/admin/mandanten/[id]:
- Detail-Ansicht: Stammdaten, Domains, Statistiken
- User-Liste (Name, E-Mail, Rolle, letzter Login) — aber NICHT deren Tresor-Inhalte
- Team-Liste (Name, Mitglieder-Anzahl, Einträge-Anzahl) — aber NICHT deren Inhalte
- Audit-Log des Mandanten

/admin/audit:
- Mandantenübergreifendes Audit-Log
- Filter: Mandant, User, Aktion, Zeitraum
- Besonders hervorgehoben: login.failed Events (Security-Monitoring)

/admin/system:
- DB-Info: Version, Größe, Connections
- Tabellen-Größen (pg_total_relation_size)
- RLS-Status: Alle Policies aktiv? (Query pg_policies)
- Backup-Status (manuell: letzter pg_dump Zeitstempel)
- Environment: Node-Version, Next.js-Version

Design:
- DRK-Konventionen (Header, Footer, CSS-Variablen)
- Desktop-optimiert (min-width 1024px)
- Einfache Tabellen, keine fancy DataTables
- Aktionen als DRK-Buttons (.drk-btn-primary, .drk-btn-secondary)

Sicherheit:
- Jede Admin-Aktion wird im Audit-Log protokolliert
- Platform-Admin kann NIEMALS:
  * Tresor-Inhalte lesen (Zero-Knowledge)
  * Master-Passwörter sehen oder zurücksetzen
  * Sich als User ausgeben (kein Impersonate)
  Er kann NUR:
  * Mandanten erstellen/deaktivieren
  * KV-Admin-Accounts erstellen
  * Audit-Logs lesen
  * System-Status prüfen

Ergebnis: Platform-Admin kann Mandanten verwalten, ohne je Tresor-Daten zu sehen."
```

---

### 1.6 Audit-Log

```
Prompt: "Implementiere das Audit-Log-System.

Server-seitig (lib/audit.ts):
async function logAudit(params: {
  tenantId: string;
  userId?: string;
  teamId?: string;
  entryId?: string;
  action: AuditAction;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
})

AuditAction Type:
type AuditAction = 
  | 'login' | 'login.failed' | 'logout'
  | 'entry.view' | 'entry.create' | 'entry.update' | 'entry.delete'
  | 'team.create' | 'team.unlock' | 'team.unlock.failed' | 'team.lock'
  | 'team.master_changed' | 'team.recovery'
  | 'member.invite' | 'member.remove' | 'member.role_changed'
  | 'user.deactivated' | 'user.profile_updated'
  | 'admin.tenant.create' | 'admin.tenant.update' | 'admin.tenant.deactivate';

Automatische Erfassung in API-Routes:
- ipAddress aus X-Forwarded-For oder Request
- userAgent aus Request Headers
- Wird bei JEDER schreibenden Aktion aufgerufen
- NIEMALS Klartext-Passwörter oder Tresor-Inhalte im Log

Audit-Log-Ansicht (KV-Admin):
/verwaltung/audit
- Zeitstrahl-Darstellung (neueste zuerst)
- Gruppiert nach Datum
- Pro Eintrag: Uhrzeit, User-Name, Aktion (menschenlesbar), Team
- Filter: User, Aktion, Team, Zeitraum
- Menschenlesbare Aktion-Labels:
  'entry.view' → 'hat Eintrag angesehen'
  'entry.create' → 'hat Eintrag erstellt'
  'team.unlock' → 'hat Tresor entsperrt'
  'login.failed' → '⚠ Fehlgeschlagener Login-Versuch'
  etc.
- Security-Hervorhebung: login.failed und team.unlock.failed in Rot

Sicherheit:
- REVOKE DELETE ON auditLog FROM app_user (in Migration)
- App-DB-User hat nur INSERT + SELECT auf audit_log
- Kein API-Endpoint zum Löschen von Audit-Einträgen

Ergebnis: Lückenloses Audit-Trail für alle sicherheitsrelevanten Aktionen."
```

---

## Phase 2 — Härtung + Polish (Woche 6–7)

### 2.1 Security Headers + CSP + HSTS

```
Prompt: "Implementiere alle Security-Maßnahmen.

Caddyfile (für Production):
drk-kennwort.de {
    reverse_proxy app:3000
    header {
        Strict-Transport-Security 'max-age=63072000; includeSubDomains; preload'
        X-Content-Type-Options 'nosniff'
        X-Frame-Options 'DENY'
        Referrer-Policy 'strict-origin-when-cross-origin'
        Permissions-Policy 'camera=(), microphone=(), geolocation=()'
        Content-Security-Policy \"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'\"
    }
}

Next.js Security Headers (next.config.ts für Development):
- Gleiche Headers wie Caddy, als Next.js headers() Config

Rate Limiting (lib/rate-limit.ts):
- In-Memory Store (Map mit TTL) — kein Redis nötig für MVP
- Login: 5 Versuche / 15 Min / IP
- Team-Unlock: 5 Versuche / 15 Min / User / Team
- API allgemein: 100 Requests / Min / User
- Progressive Delays bei Login-Fails: 0, 1s, 2s, 4s, 8s

Brute-Force-Schutz:
- Nach 10 fehlgeschlagenen Logins für eine E-Mail: Account temporär gesperrt (1h)
- Email an KV-Admin: 'Verdächtige Login-Versuche für {User}'
- Audit-Log: login.failed mit IP

Input-Validierung:
- Zod-Schemas für ALLE API-Inputs
- E-Mail-Format, UUID-Format, String-Längen
- SQL-Injection: Drizzle ORM parametrisiert automatisch
- XSS: React escaped standardmäßig + CSP

Ergebnis: OWASP Top-10 abgedeckt. Security Headers aktiv."
```

---

### 2.2 E-Mail-System (Mailjet)

```
Prompt: "Implementiere das E-Mail-System mit Mailjet.
WICHTIG: Gemäß INFRASTRUCTURE.md NUR Mailjet (EU, Frankreich). KEIN Resend, KEIN SendGrid.

Setup (lib/mail.ts):
import nodemailer from 'nodemailer';
const transporter = nodemailer.createTransport({
  host: 'in-v3.mailjet.com',
  port: 587,
  auth: {
    user: process.env.MAILJET_API_KEY,
    pass: process.env.MAILJET_SECRET_KEY,
  },
});

E-Mail-Templates (als TypeScript-Funktionen, kein Template-Engine):

1. Einladung:
   - Betreff: 'Einladung zu DRK Kennwort — {KV-Name}'
   - Inhalt: DRK-Branding, Einladungstext, großer Button zum Registrierungslink
   - Link gültig 7 Tage

2. Magic Link:
   - Betreff: 'Dein Anmeldelink für DRK Kennwort'
   - Inhalt: Button zum Login-Link, gültig 15 Min

3. Passwort-Ablauf-Erinnerung (für v1.1, Template vorbereiten):
   - Betreff: 'Passwort-Erinnerung: {Eintrag-Titel} läuft ab'

Jede E-Mail:
- HTML + Plain-Text Version
- DRK-Branding: Roter Header-Balken, Logo, Footer mit KV-Info
- Responsive (funktioniert in Outlook, Gmail, Apple Mail)
- In der Sprache des Empfängers (aus User-Profil, Default: DE)
- Absender: DRK Kennwort <noreply@drk-kennwort.de>

Ergebnis: Einladungs- und Magic-Link-Mails werden korrekt versendet."
```

---

### 2.3 UX-Feinschliff + Responsive

```
Prompt: "Füge UX-Polish hinzu. Design STRIKT nach DRK-Konventionen aus CLAUDE.md.

Loading States:
- Skeleton-Loader für Tresor-Liste (keine Spinner)
- Optimistic Updates beim Tresor-Entsperren

Error States:
- Toast-Notifications für Erfolg/Fehler
- Fehlermeldungen auf Deutsch (i18n)
- 404-Seite im DRK-Design
- 'Tresor gesperrt — bitte Master-Passwort eingeben' Screen

Empty States:
- Keine Teams: 'Noch keine Teams erstellt. [Team erstellen]'
- Keine Einträge: 'Tresor ist leer. [Ersten Eintrag anlegen]'
- Keine Mitglieder: 'Lade Teammitglieder ein.'

Responsive:
- Mobile: Bottom-Sheet für Eintrag-Details statt Modal
- Tablet: Side-Panel für Eintrag-Bearbeitung
- Desktop: Standard Card-Layout
- Touch-Targets: 44px minimum überall
- Safe-Area-Insets beachten

Keyboard-Shortcuts:
- Cmd/Ctrl+K: Suche öffnen
- Escape: Tresor sperren / Modal schließen

Auto-Lock-Timer-Anzeige:
- Oben rechts im Tresor-Layout
- Zeigt verbleibende Zeit oder 'Aktiv'
- Klick = sofort sperren
- Visuell: dezenter Countdown, wird rot unter 2 Min

DRK-Design-Checks:
- Header: Exakt wie in CLAUDE.md (rote Leiste, Logo 42x42, SVG-Icons)
- Footer: Hell, zentriert, 'made with ❤ for ✚'
- Cards: .drk-card (weiß, rounded-xl, shadow-lg)
- Buttons: .drk-btn-primary (rot), .drk-btn-secondary (grau)
- Farben: NUR CSS-Variablen aus globals.css (var(--drk), var(--text), etc.)
- Fonts: System-Stack, KEINE externen Fonts

Ergebnis: App sieht aus wie eine echte DRK-App und fühlt sich polished an."
```

---

## Phase 3 — Testing + Deployment (Woche 8–9)

### 3.1 Tests

```
Prompt: "Erstelle Tests für die kritischen Pfade.

Unit-Tests (vitest):
1. Krypto-Modul: Encrypt/Decrypt roundtrip, falscher Key, Salt-Determinismus
2. Domain-Validierung: erlaubte/verbotene Domains, Case-Insensitivity
3. Rate Limiting: Zähler, Sperre nach Limit, Reset nach TTL
4. Allergen... nein falsche App — 
   Kategorie-Konstanten: Alle IDs unique, alle Labels vorhanden

Integrations-Tests (vitest + Drizzle):
1. Mandanten-Isolation:
   - User A (Mandant Aachen) → sieht eigene Teams ✅
   - User A → sieht Teams von Mandant Köln NICHT ✅
   - Direct Query ohne SET LOCAL → RLS blockiert ✅
2. Einladung:
   - Einladung mit erlaubter Domain → ✅
   - Einladung mit verbotener Domain → Fehler ✅
   - E-Mail existiert bereits → generischer Fehler ✅
3. Team-Unlock:
   - Korrektes Master-PW → Unlock ✅
   - Falsches Master-PW → Fehler + Audit-Log ✅
   - 6. Versuch → Rate-Limited ✅
4. Audit-Log:
   - Entry.create → Log-Eintrag vorhanden ✅
   - DELETE auf audit_log → Permission denied ✅

E2E-Tests (Playwright):
1. Registrierung via Einladungslink → Passkey → Login
2. Team erstellen → Master-PW setzen → Recovery Key sichern
3. Tresor öffnen → Eintrag erstellen → Passwort kopieren → Tresor sperren
4. Tresor erneut öffnen → Eintrag noch da (kein Datenverlust)
5. Mitglied einladen → Registrierung → sieht Team
6. Platform-Admin → Mandant erstellen → KV-Admin-Einladung

Ergebnis: 'npm test' + 'npm run test:e2e' — alle Tests grün."
```

---

### 3.2 Deployment (Hetzner)

```
Prompt: "Erstelle die Deployment-Infrastruktur gemäß INFRASTRUCTURE.md Variante B.

Domain-Setup:
- drk-kennwort.de über Checkdomain (dogado) registrieren
- DNS: Hetzner DNS
- A-Record → Hetzner Cloud Server IP
- MX/SPF/DKIM für drk-kennwort.de (Mailjet)

Hetzner Cloud Server:
- 1× CPX21 (3 vCPU, 4GB RAM) — reicht für Hunderte KVs
- Standort: Falkenstein oder Nürnberg (Deutschland)
- Firewall: Nur 80/443 von außen, 5432 nur intern

Docker Setup (Production):
- docker-compose.production.yml:
  * app (Next.js Standalone)
  * db (PostgreSQL 16 Alpine)
  * Caddy als separater Container ODER direkt auf Host
- Dockerfile gemäß CLAUDE.md Variante B (multi-stage build)

Caddyfile:
drk-kennwort.de {
    reverse_proxy app:3000
    header {
        Strict-Transport-Security 'max-age=63072000; includeSubDomains; preload'
        X-Content-Type-Options 'nosniff'
        X-Frame-Options 'DENY'
        Referrer-Policy 'strict-origin-when-cross-origin'
        Content-Security-Policy \"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'\"
    }
}

GitHub Actions (.github/workflows/deploy.yml):
- Trigger: Push auf main
- Steps: Lint → Type-Check → Unit-Tests → Build Docker Image → 
  SSH deploy to Hetzner → docker compose pull → docker compose up -d → 
  Health-Check (curl https://drk-kennwort.de/api/health)
- Rollback bei fehlgeschlagenem Health-Check

Health-Check Endpoint (GET /api/health):
- DB-Connection: SELECT 1
- Return: { status: 'ok'|'down', db: 'ok'|'error', uptime: seconds }

Backup:
- Cron auf Hetzner: Täglicher pg_dump → Hetzner Storage Box
- Retention: 7 Tage täglich, 4 Wochen wöchentlich
- Verschlüsselt (gpg)

Monitoring:
- Uptime Kuma (Docker auf dem selben Server) → prüft /api/health alle 5 Min
- Alert: E-Mail bei Ausfall

ENV-Management:
- .env.production auf Hetzner Server (nicht im Repo!)
- GitHub Secrets für CI/CD
- Secrets: DB_PASSWORD, SESSION_SECRET, MAILJET_API_KEY, MAILJET_SECRET_KEY

Ergebnis: Push auf main → automatisches Deployment. drk-kennwort.de erreichbar."
```

---

### 3.3 Launch-Checkliste

```
Prompt: "Erstelle eine Launch-Checkliste als Seite /admin/launch (nur Platform-Admin).

Sicherheit:
☐ PostgreSQL RLS auf ALLEN Tabellen aktiv (Query pg_policies prüfen)
☐ REVOKE DELETE ON auditLog ausgeführt
☐ Rate Limiting auf Login + Team-Unlock aktiv
☐ CSP-Header gesetzt (Browser DevTools prüfen)
☐ HSTS-Header gesetzt
☐ Keine externen Requests (Fonts, CDN, Analytics) — Network-Tab prüfen
☐ Session: HttpOnly + Secure + SameSite=Strict
☐ Platform-Admin hat TOTP aktiviert
☐ Argon2id für alle Passwort-Hashes (nicht bcrypt)
☐ PBKDF2 mit 600.000 Iterationen

Mandanten-Isolation:
☐ User A sieht keine Daten von User B (anderer Mandant)
☐ Einladung mit falscher Domain wird blockiert
☐ E-Mail-Existenz-Check verrät nicht den Mandanten
☐ Kein API-Endpoint gibt mandantenübergreifende Daten

DSGVO:
☐ /datenschutz live (mit korrekten Verarbeitern: Hetzner, Mailjet)
☐ /impressum live (DRK KV StädteRegion Aachen e.V.)
☐ /hilfe live
☐ /spenden live
☐ Keine Cookies (nur HttpOnly Session-Cookie)
☐ Keine Tracker, keine Analytics

Infrastruktur:
☐ drk-kennwort.de DNS konfiguriert (Hetzner DNS)
☐ TLS funktioniert (Let's Encrypt via Caddy)
☐ SPF/DKIM für drk-kennwort.de (Mailjet)
☐ Backup-Cron aktiv (täglicher pg_dump)
☐ Uptime Kuma überwacht /api/health
☐ GitHub Actions Pipeline funktioniert

Pilot-Launch:
☐ KV Aachen als erster Mandant eingerichtet
☐ 2-3 Test-Teams mit echten Zugangsdaten
☐ 5-10 Mitarbeiter als Pilotnutzer eingeladen
☐ 2 Wochen Testbetrieb
☐ Feedback sammeln + Bugs fixen

Weitere KVs:
☐ KV [Name] als Mandant angelegt
☐ KV-Admin eingeladen und registriert
☐ Teams + Mitglieder eingerichtet

Jeder Punkt hat einen Status: ✅ Erledigt / ⏳ In Arbeit / ❌ Offen.
Check-Buttons die den Status in der DB speichern (für Nachvollziehbarkeit).

Ergebnis: Strukturierter Launch-Prozess mit Checkliste."
```

---

## Zusammenfassung — Was in welcher Woche

```
Woche  Phase                      Kernstück
─────  ─────                      ─────────
 1-2   Phase 0: Fundament         Template, DB-Schema (RLS!), Auth (Passkey+TOTP+Magic Link), 
                                  Mandanten-Middleware
 3-5   Phase 1: Kern-Features     Krypto-Modul, Teams+Master-PW+Recovery Key, Tresor (CRUD),
                                  Mitglieder+Einladungen, Plattform-Admin, Audit-Log
 6-7   Phase 2: Härtung+Polish    Security Headers, Mailjet, UX-Feinschliff, Responsive
 8-9   Phase 3: Test+Deploy       Tests (Unit+E2E), Hetzner-Deployment, Launch-Checkliste
```

**Kritischer Pfad:** 0.2 (Schema) → 0.3 (Auth) → 0.4 (Isolation) → 1.1 (Crypto) → 1.2 (Teams) → 1.3 (Tresor)

**Pro Phase gilt:**
- IMMER zuerst CLAUDE.md + INFRASTRUCTURE.md des Templates lesen
- IMMER CSS-Design von NIS2-Audit als Referenz nutzen
- Am Ende jeder Phase: Alles manuell durchklicken
- Bugs sofort fixen
- CHANGELOG.md aktualisieren
- Git-Tag pro Phase (v0.1, v0.2, v0.3)

---

## Sicherheits-Zusammenfassung

| Ebene | Maßnahme |
|---|---|
| **Datenbank** | PostgreSQL RLS auf allen Tabellen, SET LOCAL pro Request |
| **Verschlüsselung** | AES-256-GCM clientseitig, PBKDF2 600k, Web Crypto API |
| **Passwort-Hashing** | Argon2id (Memory 64MB, Iterations 3, Parallelism 4) |
| **Auth** | Passkeys (WebAuthn) + TOTP (Pflicht für Admins) + Magic Link |
| **Sessions** | Iron-Session, HttpOnly/Secure/SameSite=Strict, 8h Dauer |
| **Tresor-Lock** | Auto-Lock 15 Min, Key nur in Memory, Clipboard-Clear 30s |
| **Rate Limiting** | 5 Login-Versuche/15 Min, progressive Delays |
| **Transport** | TLS 1.3 (Caddy + Let's Encrypt), HSTS 2 Jahre |
| **Headers** | CSP, X-Frame-Options DENY, X-Content-Type-Options nosniff |
| **Mandanten** | Strikte Isolation, kein Cross-Tenant, Domain-restricted Invites |
| **Audit** | Append-only Log, keine DELETE-Berechtigung, IP+UserAgent |
| **Recovery** | Notfall-Key pro Team, One-Time-Use, PDF zum Ausdrucken |
| **Zero-Knowledge** | Server sieht nie Klartext. Selbst bei DB-Dump = wertlos. |

---

*DRK Kreisverband StädteRegion Aachen e.V. · Henry-Dunant-Platz 1, 52146 Würselen*
*Gebaut mit ❤️ für das Deutsche Rote Kreuz*
