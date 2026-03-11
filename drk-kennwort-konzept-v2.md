# 🔐 DRK Kennwort — Konzeptpapier v2

**Sicheres Passwort-Management für DRK-Teams. Kein externer Anbieter.**
**https://drk-kennwort.de**

Open Source · Kostenlos · DSGVO-konform · Self-Hosted · Mandantenfähig

---

## 1. Problem

DRK-Kreisverbände teilen täglich Zugangsdaten: WiFi-Passwörter für Unterkünfte, Logins für DRK-Portale, Zugangscodes für Gebäude, Social-Media-Accounts, Dienstleister-Portale. Die Realität:

- **Zettelwirtschaft** — Post-its am Monitor, Passwortlisten in Schubladen
- **WhatsApp/E-Mail** — Klartext-Passwörter in Chat-Verläufen
- **Excel-Listen** — Unverschlüsselt auf dem Netzlaufwerk
- **Identische Passwörter** — Überall das gleiche, weil es niemand organisiert

Kommerzielle Passwort-Manager (1Password, LastPass, Bitwarden Cloud) scheiden aus: US-Anbieter, CLOUD Act, Daten außerhalb der EU, Abhängigkeit von Dritten.

**Neuer Anspruch:** Eine Plattform, die **alle DRK-Kreisverbände** nutzen können — ohne dass ein KV den anderen sehen kann.

---

## 2. Lösung

**DRK Kennwort** ist eine mandantenfähige, selbst gehostete Plattform für sicheres Team-Passwort-Management. Jeder Kreisverband ist ein vollständig isolierter Mandant. Alle Daten bleiben auf einem Hetzner-Server in Deutschland.

### Kernversprechen

| | |
|---|---|
| **Multi-Mandant** | Jeder KV ist ein isolierter Mandant auf derselben Plattform |
| **Strikte Isolation** | Kein KV kann den anderen sehen — weder Daten noch Existenz |
| **Zero-Knowledge** | Server speichert nur verschlüsselte Blobs |
| **Self-Hosted** | drk-kennwort.de auf eigenem Hetzner-Server |
| **Domain-Restricted** | Nur @drk-kreisverband.de-Endungen dürfen eingeladen werden |
| **KeePass-Prinzip** | Tresor wird mit Master-Passwort aufgeschlossen — wie ein lokaler Safe |

---

## 3. Mandantenmodell

### 3.1 Hierarchie

```
drk-kennwort.de (Plattform)
│
├── Mandant: KV StädteRegion Aachen
│   ├── erlaubte Domain: @drk-aachen.de
│   ├── Team "Rettungsdienst"
│   ├── Team "Verwaltung"
│   └── Team "Social Media"
│
├── Mandant: KV Köln
│   ├── erlaubte Domain: @drk-koeln.de
│   ├── Team "Rettungsdienst"
│   └── Team "IT"
│
├── Mandant: KV Düren
│   ├── erlaubte Domain: @drk-dueren.de
│   └── Team "Geschäftsstelle"
│
└── ... (beliebig viele KVs)
```

### 3.2 Isolationsregeln (nicht verhandelbar)

| Regel | Umsetzung |
|---|---|
| **Kein KV sieht den anderen** | Jede DB-Query enthält `WHERE tenant_id = ?`. Kein API-Endpoint gibt jemals mandantenübergreifende Daten zurück. |
| **Kein User in 2 KVs** | E-Mail-Adresse ist global unique. Ein User gehört zu exakt einem Mandanten. Versuch einer Zweitregistrierung wird blockiert. |
| **Domain-Einschränkung** | Admin kann nur E-Mail-Adressen einladen, deren Domain zum Mandanten gehört (z.B. nur @drk-aachen.de). |
| **Keine Mandanten-Auflistung** | Es gibt keinen Screen, der alle KVs zeigt. Auch nicht für Plattform-Admins im Frontend. |
| **Mandant in jeder Session** | Session-Token enthält `tenant_id`. Middleware validiert bei jedem Request. |
| **Separate Encryption Keys** | Jeder Mandant hat eigene Verschlüsselungskeys. Ein Leak eines KV-Keys kompromittiert keinen anderen. |

### 3.3 Onboarding eines neuen KV

```
1. KV kontaktiert DRK Aachen (Plattform-Betreiber)
2. Plattform-Admin erstellt Mandant:
   - Name: "KV Musterstadt"
   - Erlaubte Domain(s): @drk-musterstadt.de
3. Plattform-Admin erstellt ersten KV-Admin-Account
4. KV-Admin erhält Einladungsmail (Mailjet)
5. KV-Admin registriert sich, erstellt Teams, lädt Mitglieder ein
6. Ab jetzt: Alles Self-Service durch den KV-Admin
```

**Bewusste Entscheidung:** Kein Self-Service-Onboarding. Neue Mandanten werden manuell angelegt. Das verhindert Missbrauch und stellt sicher, dass nur echte DRK-Kreisverbände auf die Plattform kommen.

---

## 4. Sicherheitsarchitektur

### 4.1 Authentifizierung — KeePass-Prinzip mit zwei Schichten

Das Auth-Modell hat **zwei Türen**, die beide aufgeschlossen werden müssen:

```
┌─────────────────────────────────────────────────────────┐
│  TÜR 1: Account-Login (wer bist du?)                   │
│                                                         │
│  E-Mail + persönliches Passwort                         │
│  → Identifiziert den User                               │
│  → Erstellt eine Session                                │
│  → Der User sieht: seine Teams, Einstellungen           │
│  → Der User sieht NICHT: Passwort-Einträge (noch        │
│    verschlüsselt)                                       │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  TÜR 2: Tresor-Entsperrung (KeePass-Prinzip)           │
│                                                         │
│  Team-Master-Passwort                                   │
│  → Leitet Encryption Key ab (PBKDF2 → AES-256-GCM)     │
│  → Entschlüsselt die Tresor-Einträge clientseitig       │
│  → Key existiert NUR im Browser-Memory                  │
│  → Bei Inaktivität: Auto-Lock → Key wird gelöscht       │
│  → Muss erneut eingegeben werden                        │
└─────────────────────────────────────────────────────────┘
```

**Warum zwei Türen?**

Tür 1 allein wäre unsicher: Wenn jemand den Account hackt, hätte er alle Passwörter. Tür 2 allein wäre unpraktisch: Ohne Account-System kein Audit-Log, keine Rollenverwaltung, keine Einladungen.

Zusammen: Selbst wenn der Server kompromittiert wird UND ein Account gehackt wird — ohne das Master-Passwort (das nie den Browser verlässt) sind die Tresor-Einträge wertlos.

### 4.2 Verschlüsselungsmodell (Zero-Knowledge)

```
┌──────────────────────────────────────────────────┐
│  BROWSER (Client-Side, Web Crypto API)           │
│                                                  │
│  Team-Master-Passwort                            │
│       │                                          │
│       ▼                                          │
│  PBKDF2 (600.000 Iterationen, SHA-256)           │
│       │                                          │
│       ├──▶ Encryption Key (AES-256-GCM)          │
│       │         │                                │
│       │         ▼                                │
│       │    Ver-/Entschlüsselung der Einträge     │
│       │    (komplett im Browser)                  │
│       │                                          │
│       └──▶ Verification Key (separater HKDF)     │
│                 │                                │
│                 ▼                                │
│            → Server prüft: "Kennt dieser User    │
│              das Master-Passwort?"               │
└──────────────────────────────────────────────────┘
            │
            ▼  (nur verschlüsselte Blobs + Verification Key)
┌──────────────────────────────────────────────────┐
│  SERVER                                          │
│                                                  │
│  Kann:                                           │
│  ✓ Prüfen ob Master-Passwort korrekt ist         │
│  ✓ Verschlüsselte Blobs speichern/ausliefern     │
│  ✓ Audit-Log schreiben                           │
│                                                  │
│  Kann NICHT:                                     │
│  ✗ Einträge entschlüsseln                        │
│  ✗ Master-Passwort rekonstruieren                │
│  ✗ Klartext-Zugangsdaten lesen                   │
│  ✗ Daten eines anderen Mandanten sehen           │
└──────────────────────────────────────────────────┘
```

**Krypto-Parameter:**

| Zweck | Algorithmus | Parameter |
|---|---|---|
| Key Derivation | PBKDF2 | SHA-256, 600.000 Iterationen, 128-bit Salt |
| Datenverschlüsselung | AES-256-GCM | 96-bit IV (zufällig pro Eintrag), 128-bit Auth Tag |
| Verification Key | HKDF | SHA-256, separater Info-String |
| Verification Speicherung | Argon2id | Memory 64 MB, Iterations 3, Parallelism 4 |
| Account-Passwort | Argon2id | Gleiche Parameter |

**Warum 600.000 PBKDF2-Iterationen?** OWASP-Empfehlung 2024 für SHA-256. Auf einem modernen Smartphone dauert die Ableitung ~300ms — spürbar, aber akzeptabel. Auf einem Angreifer-GPU-Rig limitiert es Brute-Force auf wenige Tausend Versuche pro Sekunde.

**Warum Argon2id statt bcrypt?** Argon2id ist memory-hard und damit resistenter gegen GPU- und ASIC-Angriffe. Bcrypt ist veraltet für neue Projekte. Node.js unterstützt Argon2 über die `argon2`-Library nativ.

### 4.3 Mandanten-Isolation auf Datenbankebene

**Row-Level Security (PostgreSQL RLS):**

```sql
-- Aktiviere RLS auf allen mandantenrelevanten Tabellen
ALTER TABLE vault_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: User sieht nur eigenen Mandanten
CREATE POLICY tenant_isolation ON vault_entries
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation ON teams
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Middleware setzt bei jedem Request:
-- SET LOCAL app.current_tenant = '550e8400-...';
```

**Warum RLS?** Selbst wenn ein Bug in der Anwendungslogik den `tenant_id`-Filter vergisst — PostgreSQL selbst verhindert den Zugriff. Das ist Defense-in-Depth: Die Datenbank vertraut der Anwendung nicht.

### 4.4 Domain-Einschränkung für Einladungen

```typescript
// Middleware bei User-Einladung
async function inviteUser(tenantId: string, email: string) {
  const tenant = await getTenant(tenantId);
  const allowedDomains = tenant.allowed_email_domains; // ["drk-aachen.de"]
  
  const emailDomain = email.split('@')[1].toLowerCase();
  
  if (!allowedDomains.includes(emailDomain)) {
    throw new ForbiddenError(
      `Nur E-Mail-Adressen mit @${allowedDomains.join(', @')} können eingeladen werden.`
    );
  }
  
  // Prüfe ob E-Mail bereits in IRGENDEINEM Mandanten existiert
  const existing = await db.query(
    'SELECT id, tenant_id FROM users WHERE email = $1',
    [email]
  );
  
  if (existing.rows.length > 0) {
    throw new ConflictError(
      'Diese E-Mail-Adresse ist bereits registriert.'
      // NICHT verraten in welchem Mandanten → Information Disclosure
    );
  }
  
  // Einladung versenden...
}
```

**Sicherheitsdetails:**
- Bei „E-Mail existiert bereits" wird NICHT verraten, in welchem KV → verhindert Enumeration
- Domain-Liste wird beim Mandanten-Setup festgelegt, nur Plattform-Admin kann sie ändern
- Mehrere Domains pro Mandant möglich (z.B. @drk-aachen.de + @rettungsdienst-aachen.de)

### 4.5 Session-Sicherheit

| Maßnahme | Umsetzung |
|---|---|
| Session-Token | HttpOnly, Secure, SameSite=Strict Cookie |
| Session-Dauer | 8 Stunden (Arbeitstag), dann Re-Login |
| Tresor-Lock | 15 Min. Inaktivität → Encryption Key gelöscht → Master-Passwort erneut nötig |
| Clipboard Auto-Clear | Kopierte Passwörter nach 30 Sek. gelöscht |
| Rate Limiting | Login: max 5 Versuche/Min, dann 15 Min. Sperre |
| CSP | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'` |
| HSTS | `Strict-Transport-Security: max-age=63072000; includeSubDomains` |
| Brute-Force-Schutz | Progressiver Delay: 1s, 2s, 4s, 8s, 16s nach Fehlversuchen |

### 4.6 Threat Model

| Bedrohung | Schutz |
|---|---|
| **Server-Kompromittierung** | Zero-Knowledge: Datenbank enthält nur verschlüsselte Blobs. Ohne Master-Passwort wertlos. |
| **DB-Dump geleakt** | AES-256-GCM + Argon2id-gehashte Verification Keys. Brute-Force unpraktikabel. |
| **Admin-Account gehackt** | Account allein reicht nicht — Tresor braucht zusätzlich Master-Passwort. Zwei-Faktor-Effekt. |
| **KV A will KV B sehen** | Row-Level Security in PostgreSQL. Kein API-Endpoint gibt Cross-Tenant-Daten zurück. |
| **Phishing auf Login** | Rate Limiting + progressive Delays. Perspektivisch: TOTP als 2FA. |
| **XSS-Angriff** | Strikte CSP. React escaped standardmäßig. Encryption Key nur in Memory (nicht in DOM). |
| **Insider-Angriff (Plattform-Admin)** | Plattform-Admin kann Mandanten verwalten, aber keine Tresore öffnen (Zero-Knowledge). Audit-Log protokolliert Admin-Aktionen. |
| **Man-in-the-Middle** | TLS 1.3 (Caddy + Let's Encrypt). HSTS erzwingt HTTPS. |

---

## 5. Features

### 5.1 MVP (v1.0)

**Account-Ebene (Tür 1):**
- Login mit E-Mail + persönlichem Passwort
- Registrierung nur via Einladungslink (kein Self-Signup)
- Übersicht: Meine Teams (welche Tresore habe ich Zugriff auf?)
- Profil: Passwort ändern, Name ändern

**Tresor-Ebene (Tür 2, KeePass-Prinzip):**
- Master-Passwort pro Team eingeben → Tresor öffnet sich
- Einträge: Titel, Benutzername, Passwort, URL, Notizen (alles verschlüsselt)
- Kategorien: WiFi, Gebäude, Systeme, Social Media, E-Mail, Dienstleister, Sonstiges
- Passwort-Generator (Länge, Zeichentypen, Stärke-Anzeige)
- Copy-to-Clipboard mit Auto-Clear (30 Sek.)
- Suche & Kategorie-Filter (clientseitig nach Entschlüsselung)
- Auto-Lock nach 15 Min. Inaktivität

**Admin-Ebene:**
- Team erstellen + Master-Passwort festlegen
- Mitglieder einladen (nur erlaubte Domains)
- Rollen zuweisen: Admin / Mitglied / Nur-Lesen
- Audit-Log: Wer hat wann was angesehen/geändert
- Mitglied entfernen (Zugang widerrufen)

**Pflichtseiten:**
- Impressum, Datenschutz, Hilfe, Spenden (DRK-Standard)
- DE/EN Zweisprachigkeit

### 5.2 Version 1.1

- Passwort-Ablauf-Erinnerung (optionales Ablaufdatum pro Eintrag)
- Favoriten (häufig genutzte Einträge oben)
- Verschlüsselter JSON-Export/Import (Backup)
- Erweiterte Audit-Filter (User, Datum, Aktion)
- Master-Passwort ändern (Re-Encryption aller Einträge clientseitig)
- TOTP (Zwei-Faktor) für Account-Login

### 5.3 Version 2.0

- Authentik-Integration (SSO via OIDC, ein Login für alle DRK-Tools)
- PWA mit Offline-Tresor (verschlüsselt in IndexedDB)
- Passwort-Rotation-Workflow
- Notfall-Zugang: Versiegelter Recovery-Key pro Team (für den Fall, dass alle das Master-Passwort vergessen)

---

## 6. Datenmodell

```sql
-- ============================================================
-- MANDANTEN (ein Eintrag pro Kreisverband)
-- ============================================================
CREATE TABLE tenants (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                  TEXT NOT NULL,           -- "KV StädteRegion Aachen"
    slug                  TEXT NOT NULL UNIQUE,     -- "aachen" (für interne Referenz)
    allowed_email_domains TEXT[] NOT NULL,          -- {"drk-aachen.de"}
    is_active             BOOLEAN DEFAULT true,
    created_at            TIMESTAMPTZ DEFAULT now(),
    
    -- Constraint: Mindestens eine Domain
    CONSTRAINT at_least_one_domain CHECK (array_length(allowed_email_domains, 1) > 0)
);

-- ============================================================
-- USERS (global unique E-Mail, gehört zu genau einem Mandanten)
-- ============================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    email           TEXT NOT NULL,
    name            TEXT NOT NULL,
    password_hash   TEXT NOT NULL,       -- Argon2id (Account-Passwort)
    is_tenant_admin BOOLEAN DEFAULT false,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now(),
    last_login_at   TIMESTAMPTZ,
    
    -- Global unique E-Mail = kein User in 2 Mandanten
    CONSTRAINT unique_email UNIQUE (email)
);

-- Index für Login-Performance
CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- TEAMS (gehören zu einem Mandanten)
-- ============================================================
CREATE TABLE teams (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id),
    name                TEXT NOT NULL,           -- "Rettungsdienst"
    description         TEXT,                    -- Optional
    
    -- Krypto: Für Master-Passwort-Verification
    verification_hash   TEXT NOT NULL,           -- Argon2id(HKDF(PBKDF2(master_pw)))
    key_salt            TEXT NOT NULL,           -- PBKDF2 Salt (Base64)
    
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ DEFAULT now(),
    
    -- Pro Mandant unique Team-Namen
    CONSTRAINT unique_team_per_tenant UNIQUE (tenant_id, name)
);

-- ============================================================
-- TEAM-MITGLIEDSCHAFTEN
-- ============================================================
CREATE TABLE team_members (
    user_id     UUID NOT NULL REFERENCES users(id),
    team_id     UUID NOT NULL REFERENCES teams(id),
    role        TEXT NOT NULL CHECK (role IN ('admin', 'member', 'readonly')),
    joined_at   TIMESTAMPTZ DEFAULT now(),
    invited_by  UUID REFERENCES users(id),
    
    PRIMARY KEY (user_id, team_id)
);

-- ============================================================
-- TRESOR-EINTRÄGE (verschlüsselt)
-- ============================================================
CREATE TABLE vault_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    team_id         UUID NOT NULL REFERENCES teams(id),
    
    -- Verschlüsselter Blob (AES-256-GCM, Base64)
    -- Enthält: title, username, password, url, notes
    encrypted_data  TEXT NOT NULL,
    iv              TEXT NOT NULL,           -- Initialization Vector (Base64)
    
    -- Unverschlüsselte Metadaten (für Filterung, kein Geheimnis)
    category        TEXT NOT NULL,
    
    created_by      UUID REFERENCES users(id),
    updated_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- AUDIT-LOG (append-only, KEIN DELETE erlaubt)
-- ============================================================
CREATE TABLE audit_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id),
    team_id     UUID REFERENCES teams(id),
    user_id     UUID REFERENCES users(id),
    entry_id    UUID,
    action      TEXT NOT NULL,   -- 'entry.view', 'entry.create', 'entry.update', 
                                 -- 'entry.delete', 'team.unlock', 'team.lock',
                                 -- 'member.invite', 'member.remove', 'login', 'login.failed'
    ip_address  INET,
    user_agent  TEXT,
    metadata    JSONB,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_tenant_time ON audit_log(tenant_id, created_at DESC);
CREATE INDEX idx_audit_user ON audit_log(user_id, created_at DESC);

-- Keine DELETE-Berechtigung für den App-User
-- REVOKE DELETE ON audit_log FROM app_user;

-- ============================================================
-- INVITATIONS (temporär, verfällt nach 7 Tagen)
-- ============================================================
CREATE TABLE invitations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id),
    email       TEXT NOT NULL,
    role        TEXT NOT NULL CHECK (role IN ('admin', 'member', 'readonly')),
    team_id     UUID REFERENCES teams(id),     -- Optional: direkt einem Team zuordnen
    invited_by  UUID REFERENCES users(id),
    token       TEXT NOT NULL UNIQUE,           -- Zufälliger Token für Registrierungslink
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,                   -- NULL = noch nicht eingelöst
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Jede Tabelle: nur eigener Mandant sichtbar
CREATE POLICY tenant_isolation_users ON users
    USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY tenant_isolation_teams ON teams
    USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY tenant_isolation_entries ON vault_entries
    USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY tenant_isolation_audit ON audit_log
    USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY tenant_isolation_invitations ON invitations
    USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

---

## 7. UX-Konzept

### 7.1 User Flow — Login mit KeePass-Prinzip

```
┌─────────────────────────────────────┐
│        drk-kennwort.de              │
│                                     │
│  ┌─────────────────────────────┐    │
│  │     🔐 DRK Kennwort        │    │
│  │                             │    │
│  │  E-Mail                     │    │
│  │  [_________________________]│    │
│  │                             │    │
│  │  Passwort                   │    │
│  │  [_________________________]│    │
│  │                             │    │
│  │  [      Anmelden      ]    │    │
│  │                             │    │
│  │  Einladung erhalten?        │    │
│  │  → Registrieren             │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
          │
          ▼  (Account verifiziert)
┌─────────────────────────────────────┐
│  Meine Teams                        │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🚑 Rettungsdienst     [🔒] │    │
│  │ 4 Einträge                  │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ 🏢 Verwaltung          [🔒] │    │
│  │ 12 Einträge                 │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ 📱 Social Media        [🔒] │    │
│  │ 3 Einträge                  │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
          │
          ▼  (Klick auf Team)
┌─────────────────────────────────────┐
│  🔒 Tresor entsperren              │
│                                     │
│  Team: Rettungsdienst              │
│                                     │
│  Master-Passwort                    │
│  [_________________________] [👁]   │
│                                     │
│  [    Tresor öffnen     ]           │
│                                     │
│  ℹ Das Master-Passwort wird nicht   │
│    gespeichert und verlässt nie      │
│    deinen Browser.                   │
└─────────────────────────────────────┘
          │
          ▼  (Master-Passwort korrekt)
┌─────────────────────────────────────┐
│  🔓 Rettungsdienst   [Auto-Lock ◷] │
│                                     │
│  🔍 Suche...          [Kategorie ▾] │
│                                     │
│  🌐 WiFi & Netzwerk                │
│  ├─ WiFi RW Nord         [📋] [👁] │
│  ├─ WiFi Geschäftsstelle  [📋] [👁] │
│  └─ VPN Server            [📋] [👁] │
│                                     │
│  🖥️ Systeme & Portale               │
│  ├─ DRK-Server Admin      [📋] [👁] │
│  └─ enaio DMS             [📋] [👁] │
│                                     │
│  [+ Neuer Eintrag]                  │
│                                     │
│  🔒 Tresor sperren                  │
└─────────────────────────────────────┘
```

**Key UX-Entscheidungen:**

1. **Kein KV-Name im Login-Screen** — Es gibt kein Dropdown „Wähle deinen Kreisverband". Die E-Mail-Adresse bestimmt den Mandanten. Das verhindert, dass jemand sieht welche KVs die Plattform nutzen.

2. **Team-Auswahl vor Master-Passwort** — Weil jedes Team ein eigenes Master-Passwort hat. Der User klickt auf „Rettungsdienst", gibt das Master-Passwort ein, und sieht nur die Einträge dieses Teams.

3. **Auto-Lock-Timer sichtbar** — Oben rechts läuft ein Countdown. Klick darauf sperrt sofort. Gibt dem User Kontrolle und Awareness.

4. **📋 als primäre Aktion** — Copy-to-Clipboard ist der häufigste Use Case. Ein Klick, Passwort in der Zwischenablage, weiterarbeiten. 👁 zeigt es nur kurz an.

### 7.2 Einladungs-Flow

```
Admin klickt "Mitglied einladen"
    │
    ▼
┌─────────────────────────────────┐
│  Mitglied einladen              │
│                                 │
│  E-Mail *                       │
│  [max.mustermann@drk-aachen.de] │
│                                 │
│  ⚠ Nur @drk-aachen.de erlaubt  │
│                                 │
│  Rolle                          │
│  ○ Admin                        │
│  ● Mitglied                     │
│  ○ Nur Lesen                    │
│                                 │
│  Team (optional)                │
│  [Rettungsdienst           ▾]  │
│                                 │
│  [  Einladung senden  ]        │
└─────────────────────────────────┘
    │
    ▼
Mailjet sendet E-Mail mit Link:
drk-kennwort.de/registrieren?token=abc123
    │
    ▼
User registriert sich (Name + persönliches Passwort)
    │
    ▼
Admin teilt Master-Passwort PERSÖNLICH mit
(Telefon, vor Ort — NIEMALS per E-Mail)
```

---

## 8. Praktikabilitäts-Check

### Was passiert wenn jemand das Master-Passwort vergisst?

**Zero-Knowledge = kein „Passwort vergessen".** Das ist der Preis für echte Sicherheit. Aber in der Praxis braucht es Lösungen:

| Szenario | Lösung |
|---|---|
| Ein Mitglied vergisst das Master-PW | Admin oder anderes Mitglied teilt es erneut persönlich mit |
| ALLE vergessen das Master-PW | Daten sind verloren. Team muss neu erstellt werden. |
| Admin vergisst Account-PW | Standard „Passwort zurücksetzen" per E-Mail (Mailjet) |

**v2.0-Lösung: Recovery-Sheet.** Beim Erstellen eines Teams wird ein Recovery-Key generiert, den der Admin ausdrucken und im Tresor (physisch!) einschließen soll. Damit kann das Master-Passwort einmalig zurückgesetzt werden (Re-Encryption aller Einträge).

### Was wenn ein Mitarbeiter den KV verlässt?

1. KV-Admin entfernt den User aus allen Teams
2. Account wird deaktiviert (nicht gelöscht → Audit-Log bleibt intakt)
3. **Empfehlung:** Master-Passwort aller Teams ändern, in denen der Ex-Mitarbeiter war
4. Master-Passwort-Änderung → automatische Re-Encryption aller Einträge (clientseitig durch einen Admin, der das alte UND neue PW kennt)

### Was wenn ein KV die Plattform verlässt?

1. KV-Admin kann verschlüsselten JSON-Export aller Teams herunterladen
2. Plattform-Admin deaktiviert den Mandanten
3. Nach Frist (90 Tage): vollständige Löschung aller Daten

### Wie viele Mandanten verkraftet das System?

Die Architektur (eine PostgreSQL-DB mit RLS) skaliert problemlos auf mehrere hundert Mandanten. Jeder KV hat typischerweise 5-20 User und 3-10 Teams mit jeweils 10-50 Einträgen. Das ist minimale Last. Selbst 400 KVs mit je 20 Usern = 8.000 User, einige tausend Einträge — ein einzelner Hetzner-Server bewältigt das mit PostgreSQL mühelos.

---

## 9. Deployment

### Infrastruktur (Goldstandard)

```
drk-kennwort.de
    │ DNS: Hetzner DNS (A-Record)
    ▼
Hetzner Cloud Server (Deutschland)
    │
    ├─ Caddy (Reverse Proxy + Let's Encrypt)
    │      │
    │      ▼
    ├─ Next.js 16 Standalone (Docker)
    │      │
    │      ▼
    ├─ PostgreSQL 16 (Docker, nur intern)
    │
    └─ Mailjet (EU, SMTP: Einladungen + PW-Reset)
```

### docker-compose.yml

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://drk:${DB_PASSWORD}@db:5432/kennwort
      MAILJET_API_KEY: ${MAILJET_API_KEY}
      MAILJET_SECRET_KEY: ${MAILJET_SECRET_KEY}
      MAIL_FROM: noreply@drk-kennwort.de
      NEXT_PUBLIC_APP_URL: https://drk-kennwort.de
      SESSION_SECRET: ${SESSION_SECRET}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: drk
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: kennwort
    restart: unless-stopped

volumes:
  pgdata:
```

### Caddyfile

```caddyfile
drk-kennwort.de {
    reverse_proxy app:3000
    
    header {
        Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
        Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'"
    }
}
```

---

## 10. Rollen-Übersicht

```
┌─────────────────────────────────────────────────────────────┐
│  PLATTFORM-ADMIN (DRK Aachen, Betreiber)                    │
│  • Mandanten erstellen/deaktivieren                          │
│  • Erlaubte Domains festlegen                                │
│  • Ersten KV-Admin-Account anlegen                           │
│  • KANN NICHT: Tresore öffnen (Zero-Knowledge)               │
│  • KANN NICHT: Mandantenliste im Frontend sehen              │
│  • Zugriff: CLI oder internes Admin-Tool (nicht öffentlich)  │
└─────────────────────────────────────────────────────────────┘
         │ erstellt
         ▼
┌─────────────────────────────────────────────────────────────┐
│  KV-ADMIN (z.B. IT-Koordinator im KV Köln)                  │
│  • Teams erstellen, Master-Passwörter festlegen              │
│  • Mitglieder einladen (nur @drk-koeln.de)                   │
│  • Rollen zuweisen, Mitglieder entfernen                     │
│  • Audit-Log einsehen                                        │
│  • Sieht NUR eigenen KV                                      │
└─────────────────────────────────────────────────────────────┘
         │ lädt ein
         ▼
┌─────────────────────────────────────────────────────────────┐
│  MITGLIED                                                    │
│  • Tresor öffnen (mit Master-Passwort)                       │
│  • Einträge anzeigen, erstellen, bearbeiten                  │
│  • Sieht nur Teams, in denen er Mitglied ist                 │
└─────────────────────────────────────────────────────────────┘
         │ (eingeschränkt)
         ▼
┌─────────────────────────────────────────────────────────────┐
│  NUR-LESEN                                                   │
│  • Tresor öffnen (mit Master-Passwort)                       │
│  • Einträge anzeigen + Passwörter kopieren                   │
│  • KANN NICHT: erstellen, bearbeiten, löschen                │
└─────────────────────────────────────────────────────────────┘
```

---

## 11. Abgrenzung

### Was DRK Kennwort NICHT ist

- **Kein persönlicher Passwort-Manager** — Für private Passwörter gibt es KeePass/Bitwarden
- **Kein Bitwarden-Klon** — Kein Browser-Plugin, kein Auto-Fill
- **Kein SSO-System** — Ersetzt nicht Authentik/Keycloak
- **Kein SaaS-Produkt** — Wird vom DRK selbst betrieben, kein kommerzieller Anbieter

### Warum nicht Vaultwarden (Bitwarden Self-Hosted)?

| Kriterium | DRK Kennwort | Vaultwarden |
|---|---|---|
| Multi-Mandant (KV-Isolation) | ✅ Kernfeature | ❌ Nicht vorgesehen |
| Domain-restricted Invites | ✅ | ❌ |
| DRK-Design | ✅ | ❌ (Bitwarden-UI) |
| Komplexität für User | Niedrig (Web-only) | Hoch (Apps, Extensions, Sync) |
| Zielgruppe | Teams, die Zugänge teilen | Einzelpersonen + Orgs |
| Integration in DRK-Toollandschaft | ✅ (Header, Footer, Auth) | ❌ |

Vaultwarden wäre eine Alternative, wenn es nur um einen einzelnen KV ginge. Für eine Plattform mit strikter Mandantentrennung, Domain-Beschränkung und DRK-Identität ist eine eigene Lösung der richtige Weg.

---

## 12. Sicherheits-Checkliste

### Mandanten-Isolation
- [ ] PostgreSQL Row-Level Security auf ALLEN mandantenrelevanten Tabellen
- [ ] Middleware setzt `app.current_tenant` bei JEDEM Request
- [ ] Kein API-Endpoint gibt je mandantenübergreifende Daten zurück
- [ ] Kein User kann in 2 Mandanten existieren (UNIQUE email)
- [ ] Mandantenliste ist NICHT im Frontend sichtbar
- [ ] Fehlermeldungen verraten NICHT ob eine E-Mail in einem anderen Mandanten existiert

### Verschlüsselung
- [ ] Web Crypto API für ALLE kryptographischen Operationen
- [ ] Master-Passwort verlässt NIEMALS den Browser
- [ ] Encryption Key NUR im Memory, nie persistiert
- [ ] AES-256-GCM mit zufälligem IV pro Eintrag
- [ ] PBKDF2 mit 600.000 Iterationen
- [ ] Argon2id für Passwort-Hashing (Account + Verification)

### Session & Transport
- [ ] HttpOnly + Secure + SameSite=Strict Cookies
- [ ] HSTS mit min. 2 Jahren max-age
- [ ] CSP: `default-src 'self'`
- [ ] Rate Limiting auf alle Auth-Endpoints
- [ ] Progressive Delays nach Fehlversuchen
- [ ] Auto-Lock nach 15 Min. (konfigurierbar)
- [ ] Clipboard Auto-Clear nach 30 Sek.

### Audit & Compliance
- [ ] Audit-Log append-only (REVOKE DELETE)
- [ ] Login-Versuche (erfolgreich + fehlgeschlagen) geloggt
- [ ] Tresor-Zugriffe geloggt (view, create, update, delete)
- [ ] IP-Adresse + User-Agent im Audit-Log
- [ ] Keine Klartext-Passwörter im Log

### Infrastruktur
- [ ] Nur Hetzner (Deutschland)
- [ ] TLS 1.3 via Caddy + Let's Encrypt
- [ ] Keine externen Requests (Fonts, CDN, Analytics)
- [ ] Keine Cookies (Session = HttpOnly Cookie, kein Tracking)
- [ ] Backup: täglicher pg_dump auf Hetzner Storage Box
- [ ] Monitoring: Uptime Kuma

---

## 13. Roadmap

### Phase 1 — MVP (v1.0)
- Mandantenmodell mit strikter Isolation (RLS)
- Account-System (Login, Registrierung via Einladung, Domain-Check)
- Team-Verwaltung mit Master-Passwort (KeePass-Prinzip)
- Verschlüsselter Tresor (AES-256-GCM, clientseitig)
- CRUD für Einträge, Kategorien, Suche, Filter
- Passwort-Generator + Stärke-Anzeige
- Audit-Log (Basis)
- Auto-Lock, Clipboard-Clear
- Pflichtseiten + DE/EN
- Docker-Deployment

### Phase 2 — Härtung (v1.1)
- TOTP (Zwei-Faktor) für Account-Login
- Passwort-Ablauf-Erinnerung
- Master-Passwort ändern (Re-Encryption)
- Verschlüsselter Export/Import
- Erweiterte Audit-Filter
- Recovery-Sheet (ausdruckbarer Notfall-Key)

### Phase 3 — Skalierung (v2.0)
- Authentik-Integration (SSO)
- PWA mit Offline-Tresor
- Passwort-Rotation-Workflow
- Plattform-Dashboard (für DRK Aachen als Betreiber)

---

## 14. Offene Fragen

1. **"Kidod"-Referenz?** — Du hast "Kepass auth wie bei Kidod" erwähnt. Welches Tool/Projekt meinst du? Falls es ein Auth-Muster gibt das du übernehmen willst, baue ich das ein.

2. **Plattform-Admin-Interface:** CLI-Tool oder minimales Web-Interface (nicht öffentlich, nur auf dem Server erreichbar)? CLI ist sicherer, Web ist bequemer.

3. **Domain drk-kennwort.de:** Über Checkdomain registrieren? Hetzner DNS?

4. **Initiale KVs:** Welche Kreisverbände starten als Piloten? Aachen + 2-3 weitere?

5. **E-Mail-Domains:** Manche KVs haben mehrere Domains (z.B. @drk-aachen.de + @rettungsdienst-aachen.de). Das Modell unterstützt das bereits (Array).

6. **Master-Passwort pro Team vs. pro Mandant?** Aktuelles Modell: pro Team (granularer). Alternative: ein Master-PW für den ganzen KV (einfacher). Empfehlung bleibt pro Team.

---

*DRK Kreisverband StädteRegion Aachen e.V. · Henry-Dunant-Platz 1, 52146 Würselen*
*Gebaut mit ❤️ für das Deutsche Rote Kreuz*
