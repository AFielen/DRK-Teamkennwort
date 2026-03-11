'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState<'choose' | 'magic-link-sent'>('choose');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handlePasskeyLogin() {
    setError('');
    setLoading(true);

    try {
      // 1. Get options from server
      const optionsRes = await fetch('/api/auth/login/passkey/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!optionsRes.ok) {
        const data = await optionsRes.json();
        setError(data.error || 'Anmeldung fehlgeschlagen');
        return;
      }

      const { options, userId } = await optionsRes.json();

      // 2. Start WebAuthn authentication
      const { startAuthentication } = await import('@simplewebauthn/browser');
      const authResponse = await startAuthentication({ optionsJSON: options });

      // 3. Verify with server
      const verifyRes = await fetch('/api/auth/login/passkey/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          response: authResponse,
          challenge: options.challenge,
        }),
      });

      const verifyData = await verifyRes.json();

      if (verifyData.requireTotp) {
        window.location.href = '/login/totp';
        return;
      }

      if (verifyData.success) {
        window.location.href = '/tresor';
        return;
      }

      setError(verifyData.error || 'Anmeldung fehlgeschlagen');
    } catch {
      setError('Passkey-Anmeldung fehlgeschlagen. Versuchen Sie Magic Link.');
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink() {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setMode('magic-link-sent');
      } else {
        const data = await res.json();
        setError(data.error || 'Fehler beim Senden');
      }
    } catch {
      setError('Netzwerkfehler');
    } finally {
      setLoading(false);
    }
  }

  if (mode === 'magic-link-sent') {
    return (
      <div style={{ background: 'var(--bg)' }} className="min-h-[calc(100vh-theme(spacing.16))] py-8 px-4">
        <div className="max-w-md mx-auto space-y-6">
          <div className="drk-card text-center">
            <div className="text-4xl mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto" style={{ color: 'var(--success)' }}>
                <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /><path d="m16 19 2 2 4-4" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
              E-Mail gesendet
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-light)' }}>
              Falls ein Account für <strong>{email}</strong> existiert,
              wurde ein Anmeldelink gesendet. Prüfen Sie Ihr Postfach.
            </p>
            <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
              Der Link ist 15 Minuten gültig.
            </p>
          </div>
          <div className="text-center">
            <button
              onClick={() => setMode('choose')}
              className="text-sm hover:underline"
              style={{ color: 'var(--drk)' }}
            >
              Zurück zur Anmeldung
            </button>
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
            Anmelden
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-light)' }}>
            Melden Sie sich bei DRK Kennwort an.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="drk-label" htmlFor="email">E-Mail-Adresse</label>
              <input
                id="email"
                type="email"
                className="drk-input"
                placeholder="name@drk-aachen.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email webauthn"
                disabled={loading}
              />
            </div>

            <button
              onClick={handlePasskeyLogin}
              disabled={!email || loading}
              className="drk-btn-primary w-full flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z" /><circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
              </svg>
              {loading ? 'Wird geladen...' : 'Mit Passkey anmelden'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: 'var(--border)' }} />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}>
                  oder
                </span>
              </div>
            </div>

            <button
              onClick={handleMagicLink}
              disabled={!email || loading}
              className="drk-btn-secondary w-full flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              Magic Link per E-Mail
            </button>
          </div>
        </div>

        <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          Noch kein Konto? Sie benötigen eine Einladung von Ihrem KV-Admin.
        </p>

        <div className="text-center">
          <Link href="/" style={{ color: 'var(--drk)' }} className="hover:underline text-sm font-semibold">
            ← Zurück zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}
