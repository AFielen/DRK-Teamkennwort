'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AUDIT_LABELS, type AuditAction } from '@/lib/audit-labels';

interface AuditEntry {
  id: string;
  action: string;
  userId: string | null;
  userName: string | null;
  teamId: string | null;
  entryId: string | null;
  ipAddress: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

const SECURITY_ACTIONS = ['login.failed', 'team.unlock.failed'];

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/audit?limit=100')
      .then((res) => res.json())
      .then((data) => setEntries(data.entries || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Group by date
  const grouped = entries.reduce<Record<string, AuditEntry[]>>((acc, entry) => {
    const date = new Date(entry.createdAt).toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {});

  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-[calc(100vh-theme(spacing.16))] py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Audit-Log</h2>

        {loading ? (
          <div className="drk-card animate-pulse"><div className="h-40" /></div>
        ) : entries.length === 0 ? (
          <div className="drk-card text-center py-8">
            <p style={{ color: 'var(--text-light)' }}>Keine Einträge vorhanden.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, dateEntries]) => (
              <div key={date}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
                  {date}
                </h3>
                <div className="drk-card !p-0 divide-y" style={{ borderColor: 'var(--border)' }}>
                  {dateEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 px-4 py-3"
                      style={{
                        background: SECURITY_ACTIONS.includes(entry.action) ? '#fef2f2' : undefined,
                      }}
                    >
                      <div className="text-xs font-mono w-14 shrink-0" style={{ color: 'var(--text-muted)' }}>
                        {new Date(entry.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                          {entry.userName || 'System'}
                        </span>{' '}
                        <span className="text-sm" style={{
                          color: SECURITY_ACTIONS.includes(entry.action) ? '#dc2626' : 'var(--text-light)',
                        }}>
                          {AUDIT_LABELS[entry.action as AuditAction] || entry.action}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <Link href="/verwaltung" style={{ color: 'var(--drk)' }} className="hover:underline text-sm font-semibold inline-block">
          ← Zurück zur Verwaltung
        </Link>
      </div>
    </div>
  );
}
