import React, { useEffect, useState } from 'react';
import apiService from '@/services/apiService';

interface School {
  id?: number | string;
  name?: string;
  schoolName?: string;
  udiseCode?: string;
  districtName?: string;
  stateName?: string;
  status?: string;
}

export default function SchoolsTest() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Schools API Test | Schools';
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiService.getSchools();
        setSchools(result || []);
      } catch (e: any) {
        setError(e?.message || 'Failed to fetch');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Schools API Test</h1>
        <p className="text-sm opacity-70">Verifies GET /api/schools using your x-api-key</p>
      </header>

      {loading && <p>Loading schools…</p>}
      {error && (
        <div className="rounded-md border p-4 text-red-600">
          <p className="font-medium">Error</p>
          <p className="text-sm break-all">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <section className="space-y-4">
          <p className="text-sm">Fetched {schools.length} schools.</p>
          <ul className="space-y-2">
            {schools.slice(0, 10).map((s, idx) => (
              <li key={(s.id as string) ?? idx} className="rounded-md border p-3">
                <div className="font-medium">{s.name || s.schoolName || 'Unnamed School'}</div>
                <div className="text-xs opacity-70">
                  UDISE: {s.udiseCode || '—'} | District: {s.districtName || '—'} | State: {s.stateName || '—'} | Status: {s.status || '—'}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
