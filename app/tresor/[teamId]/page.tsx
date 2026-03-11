'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { decrypt } from '@/lib/crypto';
import { CATEGORIES } from '@/lib/categories';

interface DecryptedEntry {
  id: string;
  category: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const AUTO_LOCK_MS = 15 * 60 * 1000; // 15 minutes

export default function VaultPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;

  const [entries, setEntries] = useState<DecryptedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lockCountdown, setLockCountdown] = useState(AUTO_LOCK_MS);

  const getEncryptionKey = useCallback((): CryptoKey | null => {
    if (typeof window === 'undefined') return null;
    const keys = (window as unknown as Record<string, Record<string, CryptoKey>>).__vaultKeys;
    return keys?.[teamId] || null;
  }, [teamId]);

  const lockVault = useCallback(() => {
    if (typeof window !== 'undefined') {
      const keys = (window as unknown as Record<string, Record<string, CryptoKey>>).__vaultKeys;
      if (keys) delete keys[teamId];
    }
    // Clear clipboard
    navigator.clipboard?.writeText('').catch(() => {});
    router.push(`/tresor/${teamId}/unlock`);
  }, [teamId, router]);

  // Auto-lock timer
  useEffect(() => {
    let lastActivity = Date.now();

    const resetTimer = () => {
      lastActivity = Date.now();
    };

    const checkLock = () => {
      const elapsed = Date.now() - lastActivity;
      const remaining = AUTO_LOCK_MS - elapsed;
      setLockCountdown(Math.max(0, remaining));

      if (remaining <= 0) {
        lockVault();
      }
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('touchstart', resetTimer);

    const interval = setInterval(checkLock, 1000);

    // Lock on tab hidden > 5 min
    const handleVisibility = () => {
      if (document.hidden) {
        setTimeout(() => {
          if (document.hidden) lockVault();
        }, 5 * 60 * 1000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    };
  }, [lockVault]);

  // Load and decrypt entries
  useEffect(() => {
    async function loadEntries() {
      const key = getEncryptionKey();
      if (!key) {
        router.push(`/tresor/${teamId}/unlock`);
        return;
      }

      try {
        const res = await fetch(`/api/entries?teamId=${teamId}`);
        const data = await res.json();

        const decrypted: DecryptedEntry[] = [];
        for (const entry of data.entries || []) {
          try {
            const plaintext = await decrypt(entry.encryptedData, entry.iv, key);
            decrypted.push({
              id: entry.id,
              category: entry.category,
              title: (plaintext.title as string) || '',
              username: (plaintext.username as string) || '',
              password: (plaintext.password as string) || '',
              url: plaintext.url as string | undefined,
              notes: plaintext.notes as string | undefined,
              createdAt: entry.createdAt,
              updatedAt: entry.updatedAt,
            });
          } catch {
            // Skip entries that can't be decrypted
          }
        }

        setEntries(decrypted);
      } catch {
        // Network error
      } finally {
        setLoading(false);
      }
    }

    loadEntries();
  }, [teamId, router, getEncryptionKey]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') lockVault();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('vault-search')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [lockVault]);

  async function copyPassword(id: string, password: string) {
    await navigator.clipboard.writeText(password);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    // Clear clipboard after 30 seconds
    setTimeout(() => navigator.clipboard.writeText('').catch(() => {}), 30000);
  }

  function revealPassword(id: string) {
    setRevealedId(id);
    // Auto-hide after 10 seconds
    setTimeout(() => setRevealedId(null), 10000);
  }

  const filteredEntries = entries.filter((e) => {
    const matchesSearch = !search ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.username.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const groupedEntries = CATEGORIES.map((cat) => ({
    ...cat,
    entries: filteredEntries.filter((e) => e.category === cat.id),
  })).filter((g) => g.entries.length > 0);

  const lockMinutes = Math.ceil(lockCountdown / 60000);

  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-[calc(100vh-theme(spacing.16))] py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with lock timer */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            Tresor
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={lockVault}
              className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-colors"
              style={{
                color: lockCountdown < 120000 ? '#dc2626' : 'var(--text-muted)',
                border: `1px solid ${lockCountdown < 120000 ? '#fecaca' : 'var(--border)'}`,
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              {lockMinutes} Min
            </button>
            <Link href={`/tresor/${teamId}/neu`} className="drk-btn-primary text-sm px-4 py-2">
              + Neuer Eintrag
            </Link>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <input
              id="vault-search"
              type="search"
              className="drk-input"
              placeholder="Suchen... (Ctrl+K)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="drk-input w-auto"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Alle Kategorien</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.labelDe}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="drk-card animate-pulse">
                <div className="h-5 w-48 rounded" style={{ background: 'var(--border)' }} />
                <div className="h-4 w-32 rounded mt-2" style={{ background: 'var(--border)' }} />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="drk-card text-center py-12">
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>
              Tresor ist leer
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-light)' }}>
              Legen Sie Ihren ersten Eintrag an.
            </p>
            <Link href={`/tresor/${teamId}/neu`} className="drk-btn-primary inline-block">
              Ersten Eintrag anlegen
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedEntries.map((group) => (
              <div key={group.id}>
                <h3 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
                  {group.labelDe} ({group.entries.length})
                </h3>
                <div className="space-y-2">
                  {group.entries.map((entry) => (
                    <div key={entry.id} className="drk-card !p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate" style={{ color: 'var(--text)' }}>
                            {entry.title}
                          </div>
                          <div className="text-sm truncate" style={{ color: 'var(--text-light)' }}>
                            {entry.username}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {/* Password reveal */}
                          <div className="text-sm font-mono mr-2" style={{ color: 'var(--text-light)' }}>
                            {revealedId === entry.id ? entry.password : '••••••••'}
                          </div>
                          <button
                            onClick={() => revealedId === entry.id ? setRevealedId(null) : revealPassword(entry.id)}
                            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                            title={revealedId === entry.id ? 'Verbergen' : 'Anzeigen'}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                              {revealedId === entry.id ? (
                                <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>
                              ) : (
                                <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                              )}
                            </svg>
                          </button>
                          {/* Copy */}
                          <button
                            onClick={() => copyPassword(entry.id, entry.password)}
                            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                            title="Passwort kopieren"
                          >
                            {copiedId === entry.id ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--success)' }}>
                                <path d="M20 6 9 17l-5-5" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
