export default function Home() {
  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-[calc(100vh-theme(spacing.16))] py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* ── Hero Box ── */}
        <div className="drk-card drk-fade-in">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl shrink-0" style={{ background: 'var(--drk-bg)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                   style={{ color: 'var(--drk)' }}>
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
                DRK Kennwort
              </h2>
              <p style={{ color: 'var(--text-light)' }}>
                Sicheres, mandantenfähiges Passwort-Management für DRK-Teams.
                Zero-Knowledge-Verschlüsselung &ndash; der Server sieht nie ein Klartext-Passwort.
              </p>
            </div>
          </div>
        </div>

        {/* ── Features ── */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="drk-card drk-slide-up text-center">
            <div className="flex justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                   style={{ color: 'var(--drk)' }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h3 className="font-bold mb-1" style={{ color: 'var(--text)' }}>Zero-Knowledge</h3>
            <p className="text-sm" style={{ color: 'var(--text-light)' }}>
              Verschlüsselung im Browser. Der Server speichert nur verschlüsselte Daten.
            </p>
          </div>

          <div className="drk-card drk-slide-up text-center">
            <div className="flex justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                   style={{ color: 'var(--drk)' }}>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="font-bold mb-1" style={{ color: 'var(--text)' }}>Team-Tresore</h3>
            <p className="text-sm" style={{ color: 'var(--text-light)' }}>
              Jedes Team hat einen eigenen Tresor mit eigenem Master-Passwort.
            </p>
          </div>

          <div className="drk-card drk-slide-up text-center">
            <div className="flex justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                   style={{ color: 'var(--drk)' }}>
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" x2="22" y1="10" y2="10" />
              </svg>
            </div>
            <h3 className="font-bold mb-1" style={{ color: 'var(--text)' }}>Mandantenfähig</h3>
            <p className="text-sm" style={{ color: 'var(--text-light)' }}>
              Strikt isolierte Kreisverbände. PostgreSQL Row-Level Security.
            </p>
          </div>
        </div>

        {/* ── Zwei-Türen-Prinzip ── */}
        <div className="drk-card">
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text)' }}>
            Zwei-Türen-Prinzip
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 text-sm font-bold text-white"
                   style={{ background: 'var(--drk)' }}>1</div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--text)' }}>Account-Login</p>
                <p className="text-sm" style={{ color: 'var(--text-light)' }}>
                  E-Mail + Passkey oder TOTP &ndash; identifiziert den Benutzer.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 text-sm font-bold text-white"
                   style={{ background: 'var(--drk)' }}>2</div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--text)' }}>Team-Master-Passwort</p>
                <p className="text-sm" style={{ color: 'var(--text-light)' }}>
                  Entschlüsselt den Team-Tresor lokal im Browser. Wie bei KeePass.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Info Box ── */}
        <div className="drk-card" style={{ borderLeft: '4px solid var(--info)' }}>
          <div className="flex gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                 className="shrink-0 mt-0.5" style={{ color: 'var(--info)' }}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>DSGVO-konform</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-light)' }}>
                Hosting auf Hetzner in Deutschland. Keine US-Dienste. Keine Cookies.
                Open Source und vollständig transparent.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
