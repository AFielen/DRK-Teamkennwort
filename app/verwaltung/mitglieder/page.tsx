'use client';

import Link from 'next/link';

export default function MitgliederPage() {
  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-[calc(100vh-theme(spacing.16))] py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Mitglieder</h2>
          <Link href="/verwaltung/mitglieder/einladen" className="drk-btn-primary text-sm px-4 py-2">
            + Einladen
          </Link>
        </div>

        <div className="drk-card text-center py-8">
          <p style={{ color: 'var(--text-light)' }}>
            Die Mitglieder-Übersicht wird geladen, sobald die Verbindung zur Datenbank steht.
          </p>
        </div>

        <Link href="/verwaltung" style={{ color: 'var(--drk)' }} className="hover:underline text-sm font-semibold inline-block">
          ← Zurück zur Verwaltung
        </Link>
      </div>
    </div>
  );
}
