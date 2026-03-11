'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NeuerMandantPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [domains, setDomains] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminName, setAdminName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function generateSlug(text: string) {
    return text.toLowerCase()
      .replace(/[äÄ]/g, 'ae').replace(/[öÖ]/g, 'oe').replace(/[üÜ]/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/mandanten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          allowedEmailDomains: domains.split(',').map((d) => d.trim()).filter(Boolean),
          adminEmail,
          adminName,
        }),
      });

      if (res.ok) {
        router.push('/admin/mandanten');
      } else {
        const data = await res.json();
        setError(data.error || 'Fehler beim Erstellen');
      }
    } catch {
      setError('Netzwerkfehler');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-[calc(100vh-theme(spacing.16))] py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="drk-card">
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text)' }}>
            Neuer Mandant
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="drk-label" htmlFor="tenant-name">Name des Kreisverbands</label>
              <input
                id="tenant-name"
                type="text"
                className="drk-input"
                placeholder="z.B. KV Düren"
                value={name}
                onChange={(e) => { setName(e.target.value); setSlug(generateSlug(e.target.value)); }}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="drk-label" htmlFor="tenant-slug">Slug</label>
              <input
                id="tenant-slug"
                type="text"
                className="drk-input font-mono"
                placeholder="dueren"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="drk-label" htmlFor="tenant-domains">Erlaubte E-Mail-Domains</label>
              <input
                id="tenant-domains"
                type="text"
                className="drk-input"
                placeholder="drk-dueren.de (mehrere mit Komma trennen)"
                value={domains}
                onChange={(e) => setDomains(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="drk-label" htmlFor="admin-name">KV-Admin Name</label>
              <input
                id="admin-name"
                type="text"
                className="drk-input"
                placeholder="Vor- und Nachname"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="drk-label" htmlFor="admin-email">KV-Admin E-Mail</label>
              <input
                id="admin-email"
                type="email"
                className="drk-input"
                placeholder="admin@drk-dueren.de"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" disabled={!name || !slug || !domains || !adminEmail || !adminName || loading} className="drk-btn-primary w-full">
              {loading ? 'Wird erstellt...' : 'Mandant erstellen + Admin einladen'}
            </button>
          </form>
        </div>

        <Link href="/admin/mandanten" style={{ color: 'var(--drk)' }} className="hover:underline text-sm font-semibold inline-block">
          ← Zurück zu Mandanten
        </Link>
      </div>
    </div>
  );
}
