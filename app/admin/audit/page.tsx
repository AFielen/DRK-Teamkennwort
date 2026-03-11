'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AUDIT_LABELS, type AuditAction } from '@/lib/audit-labels';

interface AuditEntry {
  id: string;
  action: string;
  userName: string | null;
  createdAt: string;
}

export default function AdminAuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then((data) => setEntries(data.recentActivity || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-[calc(100vh-theme(spacing.16))] py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Audit-Log (Plattform)</h2>

        {loading ? (
          <div className="drk-card animate-pulse"><div className="h-40" /></div>
        ) : entries.length === 0 ? (
          <div className="drk-card text-center py-8">
            <p style={{ color: 'var(--text-light)' }}>Keine Einträge.</p>
          </div>
        ) : (
          <div className="drk-card !p-0 divide-y" style={{ borderColor: 'var(--border)' }}>
            {entries.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                <span className="font-mono text-xs w-32 shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {new Date(e.createdAt).toLocaleString('de-DE')}
                </span>
                <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                  {e.userName || 'System'}
                </span>
                <span className="text-sm" style={{ color: 'var(--text-light)' }}>
                  {AUDIT_LABELS[e.action as AuditAction] || e.action}
                </span>
              </div>
            ))}
          </div>
        )}

        <Link href="/admin" style={{ color: 'var(--drk)' }} className="hover:underline text-sm font-semibold inline-block">
          ← Zurück zum Dashboard
        </Link>
      </div>
    </div>
  );
}
