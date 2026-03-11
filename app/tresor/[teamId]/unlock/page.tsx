'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { deriveKeys } from '@/lib/crypto';

export default function UnlockPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;

  const [masterPassword, setMasterPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Get salt from server
      const saltRes = await fetch(`/api/teams/${teamId}/salt`);
      if (!saltRes.ok) {
        setError('Team nicht gefunden');
        return;
      }
      const { salt } = await saltRes.json();

      // 2. Derive keys client-side
      const { verificationKey, encryptionKey } = await deriveKeys(masterPassword, salt);

      // 3. Verify with server
      const unlockRes = await fetch(`/api/teams/${teamId}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationKey }),
      });

      const unlockData = await unlockRes.json();

      if (!unlockData.success) {
        setError(unlockData.error || 'Falsches Master-Passwort');
        return;
      }

      // 4. Store encryption key in memory (sessionStorage for key reference)
      // The actual CryptoKey stays in memory via window.__vaultKeys
      if (typeof window !== 'undefined') {
        (window as unknown as Record<string, Record<string, CryptoKey>>).__vaultKeys =
          (window as unknown as Record<string, Record<string, CryptoKey>>).__vaultKeys || {};
        (window as unknown as Record<string, Record<string, CryptoKey>>).__vaultKeys[teamId] = encryptionKey;
      }

      // Clear password from memory
      setMasterPassword('');

      // 5. Navigate to vault
      router.push(`/tresor/${teamId}`);
    } catch {
      setError('Fehler beim Entsperren');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-[calc(100vh-theme(spacing.16))] py-8 px-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="drk-card">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--drk-bg)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--drk)' }}>
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
              Tresor entsperren
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-light)' }}>
              Geben Sie das Team-Master-Passwort ein.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="drk-label" htmlFor="master-pw">Master-Passwort</label>
              <input
                id="master-pw"
                type="password"
                className="drk-input"
                placeholder="Team-Master-Passwort"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                autoFocus
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={!masterPassword || loading}
              className="drk-btn-primary w-full"
            >
              {loading ? 'Wird entsperrt...' : 'Entsperren'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          Das Master-Passwort wird nur lokal verwendet und nie an den Server gesendet.
        </p>
      </div>
    </div>
  );
}
