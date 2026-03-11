'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AUDIT_LABELS, type AuditAction } from '@/lib/audit-labels';

interface Stats {
  tenants: number;
  users: number;
  teams: number;
  entries: number;
}

interface Activity {
  id: string;
  action: string;
  userName: string | null;
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats);
        setActivity(data.recentActivity || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { label: 'Mandanten', value: stats.tenants, color: 'var(--drk)' },
    { label: 'Nutzer', value: stats.users, color: 'var(--info)' },
    { label: 'Teams', value: stats.teams, color: 'var(--success)' },
    { label: 'Tresor-Einträge', value: stats.entries, color: 'var(--warning)' },
  ] : [];

  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-[calc(100vh-theme(spacing.16))] py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Plattform-Administration</h2>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="drk-card animate-pulse"><div className="h-16" /></div>
            ))
          ) : (
            statCards.map((card) => (
              <div key={card.label} className="drk-card">
                <div className="text-sm" style={{ color: 'var(--text-light)' }}>{card.label}</div>
                <div className="text-3xl font-bold mt-1" style={{ color: card.color }}>{card.value}</div>
              </div>
            ))
          )}
        </div>

        {/* Navigation */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Link href="/admin/mandanten" className="drk-card hover:shadow-xl transition-shadow">
            <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Mandanten</h3>
            <p className="text-sm" style={{ color: 'var(--text-light)' }}>KVs verwalten</p>
          </Link>
          <Link href="/admin/audit" className="drk-card hover:shadow-xl transition-shadow">
            <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Audit-Log</h3>
            <p className="text-sm" style={{ color: 'var(--text-light)' }}>Alle Aktivitäten</p>
          </Link>
          <Link href="/admin/system" className="drk-card hover:shadow-xl transition-shadow">
            <h3 className="font-semibold" style={{ color: 'var(--text)' }}>System</h3>
            <p className="text-sm" style={{ color: 'var(--text-light)' }}>Status & Info</p>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="drk-card">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Letzte Aktivitäten</h3>
          {activity.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Keine Aktivitäten.</p>
          ) : (
            <div className="space-y-2">
              {activity.slice(0, 10).map((a) => (
                <div key={a.id} className="flex items-center gap-3 text-sm">
                  <span className="font-mono text-xs w-14" style={{ color: 'var(--text-muted)' }}>
                    {new Date(a.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span style={{ color: 'var(--text)' }}>{a.userName || 'System'}</span>
                  <span style={{ color: 'var(--text-light)' }}>
                    {AUDIT_LABELS[a.action as AuditAction] || a.action}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
