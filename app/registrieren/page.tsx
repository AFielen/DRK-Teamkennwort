'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function RegistrierenPage() {
  return (
    <Suspense fallback={
      <div style={{ background: 'var(--bg)' }} className="min-h-[calc(100vh-theme(spacing.16))] py-8 px-4">
        <div className="max-w-md mx-auto">
          <div className="drk-card text-center">
            <p style={{ color: 'var(--text-light)' }}>Wird geladen...</p>
          </div>
        </div>
      </div>
    }>
      <RegistrierenContent />
    </Suspense>
  );
}

function RegistrierenContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [invitationEmail, setInvitationEmail] = useState('');

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }
    // Validate token on load
    fetch(`/api/auth/invitation/validate?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setTokenValid(true);
          setInvitationEmail(data.email || '');
        } else {
          setTokenValid(false);
        }
      })
      .catch(() => setTokenValid(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    if (password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen haben');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name, password }),
      });

      const data = await res.json();

      if (data.success) {
        window.location.href = '/totp-setup';
        return;
      }

      setError(data.error || 'Registrierung fehlgeschlagen');
    } catch {
      setError('Netzwerkfehler');
    } finally {
      setLoading(false);
    }
  }

  if (tokenValid === null) {
    return (
      <div style={{ background: 'var(--bg)' }} className="min-h-[calc(100vh-theme(spacing.16))] py-8 px-4">
        <div className="max-w-md mx-auto">
          <div className="drk-card text-center">
            <p style={{ color: 'var(--text-light)' }}>Einladung wird geprüft...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div style={{ background: 'var(--bg)' }} className="min-h-[calc(100vh-theme(spacing.16))] py-8 px-4">
        <div className="max-w-md mx-auto space-y-6">
          <div className="drk-card text-center">
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
              Ungültiger Einladungslink
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-light)' }}>
              Dieser Einladungslink ist ungültig oder abgelaufen.
              Bitten Sie Ihren KV-Admin um eine neue Einladung.
            </p>
          </div>
          <div className="text-center">
            <Link href="/login" style={{ color: 'var(--drk)' }} className="hover:underline text-sm font-semibold">
              Zur Anmeldung
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-[calc(100vh-theme(spacing.16))] py-8 px-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="drk-card">
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
            Registrierung
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-light)' }}>
            Erstellen Sie Ihren Account für DRK Kennwort.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="drk-label" htmlFor="reg-email">E-Mail-Adresse</label>
              <input
                id="reg-email"
                type="email"
                className="drk-input"
                value={invitationEmail}
                disabled
              />
            </div>

            <div>
              <label className="drk-label" htmlFor="reg-name">Name</label>
              <input
                id="reg-name"
                type="text"
                className="drk-input"
                placeholder="Vor- und Nachname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="drk-label" htmlFor="reg-password">Passwort</label>
              <input
                id="reg-password"
                type="password"
                className="drk-input"
                placeholder="Mindestens 8 Zeichen"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading}
              />
            </div>

            <div>
              <label className="drk-label" htmlFor="reg-confirm">Passwort bestätigen</label>
              <input
                id="reg-confirm"
                type="password"
                className="drk-input"
                placeholder="Passwort wiederholen"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={!name || !password || !confirmPassword || loading}
              className="drk-btn-primary w-full"
            >
              {loading ? 'Wird erstellt...' : 'Account erstellen'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          Im nächsten Schritt können Sie optional einen Passkey und TOTP einrichten.
        </p>
      </div>
    </div>
  );
}
