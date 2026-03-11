import Link from 'next/link';

export default function Datenschutz() {
  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-[calc(100vh-theme(spacing.16))] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="drk-card">
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text)' }}>Datenschutzerklärung</h2>

          <div className="space-y-6" style={{ color: 'var(--text-light)' }}>
            <section>
              <h3 className="font-bold mb-2" style={{ color: 'var(--text)' }}>1. Verantwortlicher</h3>
              <p>
                DRK-Kreisverband Städteregion Aachen e.V.<br />
                Henry-Dunant-Platz 1, 52146 Würselen<br />
                Telefon: 02405 6039100<br />
                E-Mail:{' '}
                <a href="mailto:Info@DRK-Aachen.de" style={{ color: 'var(--drk)' }} className="hover:underline">
                  Info@DRK-Aachen.de
                </a>
              </p>
            </section>

            <section>
              <h3 className="font-bold mb-2" style={{ color: 'var(--text)' }}>2. Grundsatz</h3>
              <p>
                Diese Anwendung wurde nach dem Prinzip der Datensparsamkeit und
                der <strong>Zero-Knowledge-Architektur</strong> entwickelt. Alle Passwörter und
                Tresor-Inhalte werden ausschließlich im Browser des Nutzers ver- und
                entschlüsselt (AES-256-GCM via Web Crypto API). Der Server speichert
                nur verschlüsselte Daten und kann diese nicht entschlüsseln.
              </p>
            </section>

            <section>
              <h3 className="font-bold mb-2" style={{ color: 'var(--text)' }}>3. Erhobene Daten</h3>
              <p>
                Für die Nutzung der Anwendung werden folgende Daten verarbeitet:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li><strong>E-Mail-Adresse:</strong> Für die Registrierung und Anmeldung</li>
                <li><strong>Name:</strong> Zur Anzeige innerhalb der Anwendung</li>
                <li><strong>Passwort-Hash:</strong> Argon2id-Hash des Account-Passworts (nicht das Klartext-Passwort)</li>
                <li><strong>Verschlüsselte Tresor-Daten:</strong> AES-256-GCM-verschlüsselte Einträge</li>
                <li><strong>Audit-Log:</strong> Protokollierung von Zugriffen (Zeitpunkt, IP-Adresse, Aktion)</li>
              </ul>
              <p className="mt-2">
                <strong>Keine Cookies:</strong> Diese Anwendung verwendet keine Cookies.<br />
                <strong>Keine Tracking-Dienste:</strong> Es werden keine Analytics- oder Tracking-Tools eingesetzt.<br />
                <strong>Keine externen Dienste:</strong> Es werden keine externen Schriftarten, CDNs oder sonstige
                Drittanbieter-Dienste geladen.
              </p>
            </section>

            <section>
              <h3 className="font-bold mb-2" style={{ color: 'var(--text)' }}>4. Hosting</h3>
              <p>
                Diese Anwendung wird auf einem Server der <strong>Hetzner Online GmbH</strong> (Gunzenhausen,
                Deutschland) betrieben. Alle Daten verbleiben in deutschen Rechenzentren.
                Ein Auftragsverarbeitungsvertrag (AVV) liegt vor.
              </p>
              <p className="mt-2">
                <strong>Hetzner Online GmbH</strong><br />
                Industriestr. 25, 91710 Gunzenhausen<br />
                <a href="https://www.hetzner.com/de/legal/privacy-policy"
                   target="_blank" rel="noopener noreferrer"
                   style={{ color: 'var(--drk)' }} className="hover:underline">
                  Datenschutzerklärung von Hetzner
                </a>
              </p>
            </section>

            <section>
              <h3 className="font-bold mb-2" style={{ color: 'var(--text)' }}>5. E-Mail-Versand</h3>
              <p>
                Für transaktionale E-Mails (Einladungen, Benachrichtigungen) wird der
                Dienst <strong>Mailjet</strong> (Mailjet SAS, Paris, Frankreich) als SMTP-Relay
                genutzt. Mailjet verarbeitet ausschließlich die E-Mail-Adresse und den
                Nachrichteninhalt. Ein Auftragsverarbeitungsvertrag (AVV/DPA) liegt vor.
                Alle Server befinden sich in der EU.
              </p>
            </section>

            <section>
              <h3 className="font-bold mb-2" style={{ color: 'var(--text)' }}>6. Datenbank</h3>
              <p>
                Die Anwendung nutzt <strong>PostgreSQL</strong> als Datenbank, selbst gehostet auf
                dem Hetzner-Server. Es werden keine Cloud-Datenbank-Dienste von
                US-Anbietern verwendet. Die Mandantenisolation erfolgt über
                PostgreSQL Row-Level Security (RLS).
              </p>
            </section>

            <section>
              <h3 className="font-bold mb-2" style={{ color: 'var(--text)' }}>7. Verschlüsselung</h3>
              <p>
                Die Verbindung zur Anwendung ist durchgehend TLS-verschlüsselt
                (Let&apos;s Encrypt). Die TLS-Terminierung erfolgt auf dem eigenen
                Server (Caddy Reverse Proxy) &ndash; es sind keine US-Dienste
                (wie Cloudflare) in der Kette.
              </p>
              <p className="mt-2">
                Tresor-Inhalte werden clientseitig mit AES-256-GCM verschlüsselt.
                Der Schlüssel wird aus dem Team-Master-Passwort via PBKDF2 + HKDF
                abgeleitet und verlässt nie den Browser.
              </p>
            </section>

            <section>
              <h3 className="font-bold mb-2" style={{ color: 'var(--text)' }}>8. Ihre Rechte</h3>
              <p>
                Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung
                der Verarbeitung, Datenübertragbarkeit und Widerspruch. Wenden Sie sich
                hierzu an den oben genannten Verantwortlichen.
              </p>
              <p className="mt-2">
                Zudem steht Ihnen ein Beschwerderecht bei der zuständigen
                Aufsichtsbehörde zu (Landesbeauftragte für Datenschutz und
                Informationsfreiheit Nordrhein-Westfalen).
              </p>
            </section>

            <section>
              <h3 className="font-bold mb-2" style={{ color: 'var(--text)' }}>9. Open Source</h3>
              <p>
                Der gesamte Quellcode dieser Anwendung ist öffentlich einsehbar und überprüfbar.
                Die Zero-Knowledge-Architektur kann von jedem unabhängig verifiziert werden.
              </p>
            </section>

            <section>
              <h3 className="font-bold mb-2" style={{ color: 'var(--text)' }}>10. Änderungen</h3>
              <p>
                Diese Datenschutzerklärung kann bei Änderungen an der Anwendung angepasst werden.
                Die aktuelle Version ist stets unter /datenschutz abrufbar.
              </p>
            </section>
          </div>

          <div className="mt-8">
            <Link href="/" style={{ color: 'var(--drk)' }} className="hover:underline text-sm font-semibold">
              ← Zurück zur Startseite
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
