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

export default function TresorPage() {
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
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            Meine Tresore
          </h2>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="drk-card animate-pulse">
                <div className="h-6 w-48 rounded" style={{ background: 'var(--border)' }} />
                <div className="h-4 w-32 rounded mt-2" style={{ background: 'var(--border)' }} />
              </div>
            ))}
          </div>
        ) : teams.length === 0 ? (
          <div className="drk-card text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }}>
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>
              Noch keine Teams
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-light)' }}>
              Sie sind noch keinem Team zugeordnet. Bitten Sie Ihren KV-Admin um eine Einladung.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {teams.map((team) => (
              <Link
                key={team.id}
                href={`/tresor/${team.id}/unlock`}
                className="drk-card block hover:shadow-xl transition-shadow cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--drk-bg)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--drk)' }}>
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: 'var(--text)' }}>
                        {team.name}
                      </h3>
                      {team.description && (
                        <p className="text-sm" style={{ color: 'var(--text-light)' }}>
                          {team.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm" style={{ color: 'var(--text-muted)' }}>
                    <div>{team.entryCount} Einträge</div>
                    <div>{team.memberCount} Mitglieder</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
