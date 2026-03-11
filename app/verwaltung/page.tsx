'use client';

import Link from 'next/link';

export default function VerwaltungPage() {
  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-[calc(100vh-theme(spacing.16))] py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Verwaltung</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/verwaltung/teams" className="drk-card hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--drk-bg)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--drk)' }}>
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Teams</h3>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-light)' }}>Teams erstellen und verwalten</p>
          </Link>

          <Link href="/verwaltung/mitglieder" className="drk-card hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--drk-bg)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--drk)' }}>
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Mitglieder</h3>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-light)' }}>Mitglieder einladen und verwalten</p>
          </Link>

          <Link href="/verwaltung/audit" className="drk-card hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--drk-bg)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--drk)' }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Audit-Log</h3>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-light)' }}>Alle Aktivitäten einsehen</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
