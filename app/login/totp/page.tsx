'use client';

import { useState, useRef } from 'react';

export default function TotpVerifyPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login/totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (data.success) {
        window.location.href = '/tresor';
        return;
      }

      setError(data.error || 'Ungültiger Code');
      setCode('');
      inputRef.current?.focus();
    } catch {
      setError('Netzwerkfehler');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-[calc(100vh-theme(spacing.16))] py-8 px-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="drk-card">
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
            Zwei-Faktor-Authentifizierung
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-light)' }}>
            Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="drk-label" htmlFor="totp-code">Bestätigungscode</label>
              <input
                id="totp-code"
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                className="drk-input text-center text-2xl tracking-[0.5em] font-mono"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                autoFocus
                autoComplete="one-time-code"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={code.length !== 6 || loading}
              className="drk-btn-primary w-full"
            >
              {loading ? 'Wird geprüft...' : 'Bestätigen'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
