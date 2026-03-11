'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { encrypt, generatePassword, calculateStrength } from '@/lib/crypto';
import { CATEGORIES } from '@/lib/categories';

export default function NewEntryPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;

  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('other');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  // Password generator state
  const [genLength, setGenLength] = useState(20);
  const [genUppercase, setGenUppercase] = useState(true);
  const [genLowercase, setGenLowercase] = useState(true);
  const [genNumbers, setGenNumbers] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);
  const [generatedPw, setGeneratedPw] = useState('');

  const strength = password ? calculateStrength(password) : null;

  function handleGenerate() {
    const pw = generatePassword({
      length: genLength,
      uppercase: genUppercase,
      lowercase: genLowercase,
      numbers: genNumbers,
      symbols: genSymbols,
    });
    setGeneratedPw(pw);
  }

  function applyGenerated() {
    setPassword(generatedPw);
    setShowGenerator(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const key = typeof window !== 'undefined'
        ? (window as unknown as Record<string, Record<string, CryptoKey>>).__vaultKeys?.[teamId]
        : null;

      if (!key) {
        router.push(`/tresor/${teamId}/unlock`);
        return;
      }

      const data = { title, username, password, url, notes };
      const { encryptedData, iv } = await encrypt(data, key);

      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, encryptedData, iv, category }),
      });

      if (res.ok) {
        router.push(`/tresor/${teamId}`);
      } else {
        const d = await res.json();
        setError(d.error || 'Fehler beim Erstellen');
      }
    } catch {
      setError('Fehler beim Verschlüsseln');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-[calc(100vh-theme(spacing.16))] py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="drk-card">
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text)' }}>
            Neuer Eintrag
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="drk-label" htmlFor="entry-category">Kategorie</label>
              <select
                id="entry-category"
                className="drk-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.labelDe}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="drk-label" htmlFor="entry-title">Titel</label>
              <input
                id="entry-title"
                type="text"
                className="drk-input"
                placeholder="z.B. Büro WLAN"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="drk-label" htmlFor="entry-username">Benutzername</label>
              <input
                id="entry-username"
                type="text"
                className="drk-input"
                placeholder="Benutzername oder E-Mail"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="drk-label" htmlFor="entry-password">Passwort</label>
              <div className="flex gap-2">
                <input
                  id="entry-password"
                  type="text"
                  className="drk-input flex-1"
                  placeholder="Passwort"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => { setShowGenerator(!showGenerator); if (!generatedPw) handleGenerate(); }}
                  className="drk-btn-secondary px-3"
                  title="Passwort generieren"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                  </svg>
                </button>
              </div>
              {strength && (
                <div className="mt-2">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${strength.score}%`, background: strength.color }}
                    />
                  </div>
                  <span className="text-xs mt-1 block" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Password Generator Panel */}
            {showGenerator && (
              <div className="p-4 rounded-lg" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Passwort-Generator</span>
                  <button type="button" onClick={handleGenerate} className="text-xs px-2 py-1 rounded" style={{ color: 'var(--drk)' }}>
                    Neu generieren
                  </button>
                </div>
                <div className="font-mono text-sm p-2 rounded mb-3 break-all" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                  {generatedPw || '...'}
                </div>
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs" style={{ color: 'var(--text-light)' }}>Länge: {genLength}</label>
                    <input type="range" min="8" max="64" value={genLength} onChange={(e) => { setGenLength(Number(e.target.value)); handleGenerate(); }} className="flex-1" />
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <label className="flex items-center gap-1"><input type="checkbox" checked={genUppercase} onChange={(e) => setGenUppercase(e.target.checked)} /> ABC</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={genLowercase} onChange={(e) => setGenLowercase(e.target.checked)} /> abc</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={genNumbers} onChange={(e) => setGenNumbers(e.target.checked)} /> 123</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={genSymbols} onChange={(e) => setGenSymbols(e.target.checked)} /> #$%</label>
                  </div>
                </div>
                <button type="button" onClick={applyGenerated} className="drk-btn-primary w-full text-sm">
                  Übernehmen
                </button>
              </div>
            )}

            <div>
              <label className="drk-label" htmlFor="entry-url">URL (optional)</label>
              <input
                id="entry-url"
                type="url"
                className="drk-input"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="drk-label" htmlFor="entry-notes">Notizen (optional)</label>
              <textarea
                id="entry-notes"
                className="drk-input"
                rows={3}
                placeholder="Zusätzliche Informationen..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={!title || loading} className="drk-btn-primary flex-1">
                {loading ? 'Wird gespeichert...' : 'Speichern'}
              </button>
              <button type="button" onClick={() => router.back()} className="drk-btn-secondary">
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
