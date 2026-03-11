'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function EinladenPage() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'admin' | 'readonly'>('member');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setEmail('');
      } else {
        setError(data.error || 'Fehler beim Einladen');
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
            Mitglied einladen
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
              Einladung wurde erfolgreich gesendet!
            </div>
          )}

          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="drk-label" htmlFor="invite-email">E-Mail-Adresse</label>
              <input
                id="invite-email"
                type="email"
                className="drk-input"
                placeholder="name@drk-aachen.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="drk-label" htmlFor="invite-role">Rolle</label>
              <select
                id="invite-role"
                className="drk-input"
                value={role}
                onChange={(e) => setRole(e.target.value as typeof role)}
                disabled={loading}
              >
                <option value="member">Mitglied (lesen + schreiben)</option>
                <option value="readonly">Nur lesen</option>
                <option value="admin">KV-Admin</option>
              </select>
            </div>

            <button type="submit" disabled={!email || loading} className="drk-btn-primary w-full">
              {loading ? 'Wird gesendet...' : 'Einladung senden'}
            </button>
          </form>
        </div>

        <Link href="/verwaltung/mitglieder" style={{ color: 'var(--drk)' }} className="hover:underline text-sm font-semibold inline-block">
          ← Zurück zu Mitglieder
        </Link>
      </div>
    </div>
  );
}
