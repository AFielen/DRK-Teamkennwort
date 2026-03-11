'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  allowedEmailDomains: string[];
  isActive: boolean;
  createdAt: string;
}

export default function MandantenPage() {
  const [tenantsList, setTenantsList] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/mandanten')
      .then((res) => res.json())
      .then((data) => setTenantsList(data.tenants || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-[calc(100vh-theme(spacing.16))] py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Mandanten</h2>
          <Link href="/admin/mandanten/neu" className="drk-btn-primary text-sm px-4 py-2">
            + Neuer Mandant
          </Link>
        </div>

        {loading ? (
          <div className="drk-card animate-pulse"><div className="h-40" /></div>
        ) : (
          <div className="drk-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text)' }}>Name</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text)' }}>Slug</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text)' }}>Domains</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {tenantsList.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-3 px-4 font-semibold" style={{ color: 'var(--text)' }}>{t.name}</td>
                    <td className="py-3 px-4 font-mono text-xs" style={{ color: 'var(--text-light)' }}>{t.slug}</td>
                    <td className="py-3 px-4 text-xs" style={{ color: 'var(--text-light)' }}>
                      {t.allowedEmailDomains.join(', ')}
                    </td>
                    <td className="py-3 px-4">
                      {t.isActive ? (
                        <span className="drk-badge-success text-xs">Aktiv</span>
                      ) : (
                        <span className="drk-badge-error text-xs">Deaktiviert</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Link href="/admin" style={{ color: 'var(--drk)' }} className="hover:underline text-sm font-semibold inline-block">
          ← Zurück zum Dashboard
        </Link>
      </div>
    </div>
  );
}
