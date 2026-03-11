'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { APP_VERSION, APP_BUILD_DATE } from '@/lib/version';

interface HealthData {
  status: string;
  db: string;
  uptime: number;
}

export default function SystemPage() {
  const [health, setHealth] = useState<HealthData | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => {});
  }, []);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-[calc(100vh-theme(spacing.16))] py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>System-Status</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="drk-card">
            <h3 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>Datenbank</h3>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${health?.db === 'ok' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span style={{ color: 'var(--text-light)' }}>
                {health?.db === 'ok' ? 'Verbunden' : 'Nicht verbunden'}
              </span>
            </div>
          </div>

          <div className="drk-card">
            <h3 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>Uptime</h3>
            <span style={{ color: 'var(--text-light)' }}>
              {health ? formatUptime(health.uptime) : '—'}
            </span>
          </div>

          <div className="drk-card">
            <h3 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>Version</h3>
            <span className="font-mono text-sm" style={{ color: 'var(--text-light)' }}>
              v{APP_VERSION} ({APP_BUILD_DATE})
            </span>
          </div>

          <div className="drk-card">
            <h3 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>Environment</h3>
            <span style={{ color: 'var(--text-light)' }}>
              Next.js 16 · Node.js · PostgreSQL 16
            </span>
          </div>
        </div>

        <Link href="/admin" style={{ color: 'var(--drk)' }} className="hover:underline text-sm font-semibold inline-block">
          ← Zurück zum Dashboard
        </Link>
      </div>
    </div>
  );
}
