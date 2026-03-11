'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateSalt, generateRecoveryKey, deriveKeys } from '@/lib/crypto';

export default function NeuesTeamPage() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'recovery'>('form');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (masterPassword !== confirmPassword) {
      setError('Master-Passwörter stimmen nicht überein');
      return;
    }

    if (masterPassword.length < 8) {
      setError('Master-Passwort muss mindestens 8 Zeichen haben');
      return;
    }

    setLoading(true);

    try {
      // 1. Generate salt
      const salt = generateSalt();

      // 2. Derive keys client-side
      const { verificationKey } = await deriveKeys(masterPassword, salt);

      // 3. Generate recovery key
      const recovery = generateRecoveryKey();
      setRecoveryKey(recovery);

      // 4. Hash recovery key (we'll send a placeholder since argon2 is server-side)
      // The server will hash the verificationKey, we send recoveryKeyHash as placeholder
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          verificationKey,
          salt,
          recoveryKeyHash: recovery, // Server should hash this
        }),
      });

      if (res.ok) {
        setStep('recovery');
      } else {
        const data = await res.json();
        setError(data.error || 'Fehler beim Erstellen');
      }
    } catch {
      setError('Fehler beim Erstellen');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'recovery') {
    return (
      <div style={{ background: 'var(--bg)' }} className="min-h-[calc(100vh-theme(spacing.16))] py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="drk-card">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text)' }}>
              Notfall-Wiederherstellungsschlüssel
            </h2>

            <div className="p-4 rounded-lg mb-4" style={{ background: '#fef2f2', border: '2px solid var(--drk)' }}>
              <p className="text-sm font-semibold mb-2" style={{ color: 'var(--drk)' }}>
                WICHTIG: Diesen Schlüssel JETZT ausdrucken oder sicher notieren!
              </p>
              <p className="text-xs" style={{ color: 'var(--text-light)' }}>
                Er wird NIEMALS wieder angezeigt. Ohne ihn können verlorene
                Master-Passwörter NICHT wiederhergestellt werden.
              </p>
            </div>

            <div className="p-6 rounded-lg text-center font-mono text-lg tracking-wider mb-6"
                 style={{ background: 'var(--bg)', border: '2px dashed var(--border)', color: 'var(--text)' }}>
              {recoveryKey}
            </div>

            <div className="space-y-3">
              <p className="text-sm" style={{ color: 'var(--text-light)' }}>
                Empfehlung: Diesen Schlüssel ausdrucken und im physischen Tresor aufbewahren.
              </p>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm" style={{ color: 'var(--text)' }}>
                  Ich habe den Wiederherstellungsschlüssel gesichert.
                </span>
              </label>

              <button
                onClick={() => router.push('/verwaltung/teams')}
                disabled={!confirmed}
                className="drk-btn-primary w-full"
              >
                Weiter
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-[calc(100vh-theme(spacing.16))] py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="drk-card">
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text)' }}>
            Neues Team erstellen
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="drk-label" htmlFor="team-name">Team-Name</label>
              <input
                id="team-name"
                type="text"
                className="drk-input"
                placeholder="z.B. Rettungsdienst"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="drk-label" htmlFor="team-desc">Beschreibung (optional)</label>
              <input
                id="team-desc"
                type="text"
                className="drk-input"
                placeholder="Kurze Beschreibung"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="drk-label" htmlFor="team-master">Master-Passwort</label>
              <input
                id="team-master"
                type="password"
                className="drk-input"
                placeholder="Team-Master-Passwort (min. 8 Zeichen)"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Dieses Passwort wird von allen Team-Mitgliedern zum Entsperren des Tresors benötigt.
              </p>
            </div>

            <div>
              <label className="drk-label" htmlFor="team-confirm">Master-Passwort bestätigen</label>
              <input
                id="team-confirm"
                type="password"
                className="drk-input"
                placeholder="Passwort wiederholen"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" disabled={!name || !masterPassword || !confirmPassword || loading} className="drk-btn-primary w-full">
              {loading ? 'Wird erstellt...' : 'Team erstellen'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
