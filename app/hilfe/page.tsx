import Link from 'next/link';

export default function Hilfe() {
  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-[calc(100vh-theme(spacing.16))] py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="drk-card">
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>Hilfe & Anleitung</h2>
          <p style={{ color: 'var(--text-light)' }}>
            Hier finden Sie Antworten auf häufige Fragen zur sicheren Passwort-Verwaltung mit DRK Kennwort.
          </p>
        </div>

        {/* ── FAQ ── */}
        <div className="drk-card">
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text)' }}>Häufige Fragen</h3>
          <div className="space-y-4">
            <details className="group">
              <summary className="cursor-pointer font-semibold hover:text-[#e30613] transition-colors" style={{ color: 'var(--text)' }}>
                Was ist DRK Kennwort?
              </summary>
              <p className="mt-2 text-sm pl-4" style={{ color: 'var(--text-light)' }}>
                DRK Kennwort ist eine sichere, mandantenfähige Passwort-Verwaltung für DRK-Teams.
                Jedes Team hat einen eigenen verschlüsselten Tresor, der mit einem gemeinsamen
                Master-Passwort geschützt ist &ndash; ähnlich wie KeePass, aber als Web-Anwendung.
              </p>
            </details>

            <details className="group">
              <summary className="cursor-pointer font-semibold hover:text-[#e30613] transition-colors" style={{ color: 'var(--text)' }}>
                Wie funktioniert die Verschlüsselung?
              </summary>
              <p className="mt-2 text-sm pl-4" style={{ color: 'var(--text-light)' }}>
                Alle Passwörter werden lokal in Ihrem Browser mit AES-256-GCM verschlüsselt,
                bevor sie an den Server gesendet werden. Der Schlüssel wird aus dem Team-Master-Passwort
                abgeleitet (PBKDF2 + HKDF). Der Server sieht nie ein Klartext-Passwort
                (Zero-Knowledge-Prinzip).
              </p>
            </details>

            <details className="group">
              <summary className="cursor-pointer font-semibold hover:text-[#e30613] transition-colors" style={{ color: 'var(--text)' }}>
                Was passiert, wenn ich mein Master-Passwort vergesse?
              </summary>
              <p className="mt-2 text-sm pl-4" style={{ color: 'var(--text-light)' }}>
                Das Master-Passwort wird nirgendwo gespeichert. Bei Verlust kann der Tresor
                nur über einen Recovery-Key wiederhergestellt werden, der bei der Team-Erstellung
                erzeugt wird. Bewahren Sie diesen sicher auf!
              </p>
            </details>

            <details className="group">
              <summary className="cursor-pointer font-semibold hover:text-[#e30613] transition-colors" style={{ color: 'var(--text)' }}>
                Wer kann meine Passwörter sehen?
              </summary>
              <p className="mt-2 text-sm pl-4" style={{ color: 'var(--text-light)' }}>
                Nur Team-Mitglieder, die das Team-Master-Passwort kennen, können den Tresor
                entschlüsseln. Weder der Server-Betreiber noch Administratoren haben Zugriff
                auf Klartext-Passwörter.
              </p>
            </details>

            <details className="group">
              <summary className="cursor-pointer font-semibold hover:text-[#e30613] transition-colors" style={{ color: 'var(--text)' }}>
                Was sind Passkeys und TOTP?
              </summary>
              <p className="mt-2 text-sm pl-4" style={{ color: 'var(--text-light)' }}>
                Passkeys sind eine moderne, passwortlose Anmeldemethode, die biometrische
                Daten oder Sicherheitsschlüssel nutzt. TOTP (Time-based One-Time Password)
                generiert zeitbasierte Einmalcodes, z.B. über eine Authenticator-App.
                Beides dient der sicheren Anmeldung am Account (Tür 1).
              </p>
            </details>

            <details className="group">
              <summary className="cursor-pointer font-semibold hover:text-[#e30613] transition-colors" style={{ color: 'var(--text)' }}>
                Ist die Anwendung DSGVO-konform?
              </summary>
              <p className="mt-2 text-sm pl-4" style={{ color: 'var(--text-light)' }}>
                Ja. DRK Kennwort wird auf Hetzner-Servern in Deutschland gehostet.
                Es werden keine US-Dienste, keine Cookies und keine Tracking-Tools
                eingesetzt. Der gesamte Quellcode ist Open Source und überprüfbar.
              </p>
            </details>
          </div>
        </div>

        {/* ── Kontakt ── */}
        <div className="drk-card border-l-4" style={{ borderLeftColor: 'var(--drk)' }}>
          <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>Fragen, Feedback oder Fehler gefunden?</h3>
          <p className="text-sm" style={{ color: 'var(--text-light)' }}>
            Wenden Sie sich an den DRK Kreisverband StädteRegion Aachen e.V. &ndash; auch bei technischen Fehlern, Bugs oder inhaltlichen Unklarheiten:<br />
            <a href="mailto:digitalisierung@drk-aachen.de" style={{ color: 'var(--drk)' }} className="hover:underline">
              digitalisierung@drk-aachen.de
            </a>
          </p>
        </div>

        <div className="text-center">
          <Link href="/" style={{ color: 'var(--drk)' }} className="hover:underline text-sm font-semibold">
            ← Zurück zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}
