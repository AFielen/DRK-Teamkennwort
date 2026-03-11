'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TotpSetupPage() {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/totp/setup', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        if (data.qrCodeUrl) {
          setQrCodeUrl(data.qrCodeUrl);
          setSecret(data.secret);
        }
      })
      .catch(() => setError('Fehler beim Laden'));
  }, []);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/totp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, secret }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Ungültiger Code');
        setCode('');
      }
    } catch {
      setError('Netzwerkfehler');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{ background: 'var(--bg)' }} className="min-h-[calc(100vh-theme(spacing.16))] py-8 px-4">
        <div className="max-w-md mx-auto space-y-6">
          <div className="drk-card text-center">
            <div className="mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto" style={{ color: 'var(--success)' }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>
              TOTP eingerichtet
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-light)' }}>
              Die Zwei-Faktor-Authentifizierung ist jetzt aktiv.
              Bei der nächsten Anmeldung benötigen Sie den Code aus Ihrer App.
            </p>
            <Link href="/tresor" className="drk-btn-primary inline-block">
              Zum Tresor
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
            TOTP einrichten
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-light)' }}>
            Scannen Sie den QR-Code mit Ihrer Authenticator-App
            (z.B. Google Authenticator, Authy).
          </p>

          {qrCodeUrl && (
            <div className="text-center mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCodeUrl}
                alt="TOTP QR-Code"
                width={200}
                height={200}
                className="mx-auto rounded-lg border p-2"
                style={{ borderColor: 'var(--border)' }}
              />
              <details className="mt-3">
                <summary className="text-xs cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                  QR-Code kann nicht gescannt werden?
                </summary>
                <p className="mt-2 text-xs font-mono p-2 rounded break-all" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
                  {secret}
                </p>
              </details>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="drk-label" htmlFor="totp-verify-code">Bestätigungscode</label>
              <input
                id="totp-verify-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                className="drk-input text-center text-2xl tracking-[0.5em] font-mono"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                autoFocus
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={code.length !== 6 || loading}
              className="drk-btn-primary w-full"
            >
              {loading ? 'Wird geprüft...' : 'TOTP aktivieren'}
            </button>
          </form>
        </div>

        <div className="text-center">
          <Link href="/tresor" style={{ color: 'var(--text-muted)' }} className="hover:underline text-sm">
            Überspringen (nicht empfohlen)
          </Link>
        </div>
      </div>
    </div>
  );
}
