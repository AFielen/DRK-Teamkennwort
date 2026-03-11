'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Team {
  id: string;
  name: string;
  description: string | null;
  role: string;
  memberCount: number;
  entryCount: number;
}

export default function TeamsVerwaltungPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/teams')
      .then((res) => res.json())
      .then((data) => setTeams(data.teams || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: 'var(--bg)' }} className="min-h-[calc(100vh-theme(spacing.16))] py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Teams</h2>
          <Link href="/verwaltung/teams/neu" className="drk-btn-primary text-sm px-4 py-2">
            + Neues Team
          </Link>
        </div>

        {loading ? (
          <div className="drk-card animate-pulse"><div className="h-20" /></div>
        ) : teams.length === 0 ? (
          <div className="drk-card text-center py-8">
            <p style={{ color: 'var(--text-light)' }}>Noch keine Teams erstellt.</p>
            <Link href="/verwaltung/teams/neu" className="drk-btn-primary inline-block mt-4">
              Erstes Team erstellen
            </Link>
          </div>
        ) : (
          <div className="drk-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text)' }}>Team</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text)' }}>Mitglieder</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text)' }}>Einträge</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text)' }}>Rolle</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <tr key={team.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-3 px-4">
                      <div className="font-semibold" style={{ color: 'var(--text)' }}>{team.name}</div>
                      {team.description && (
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{team.description}</div>
                      )}
                    </td>
                    <td className="py-3 px-4" style={{ color: 'var(--text-light)' }}>{team.memberCount}</td>
                    <td className="py-3 px-4" style={{ color: 'var(--text-light)' }}>{team.entryCount}</td>
                    <td className="py-3 px-4">
                      <span className="drk-badge-success text-xs">{team.role}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Link href="/verwaltung" style={{ color: 'var(--drk)' }} className="hover:underline text-sm font-semibold inline-block">
          ← Zurück zur Verwaltung
        </Link>
      </div>
    </div>
  );
}
