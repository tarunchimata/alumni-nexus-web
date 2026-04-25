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
        const schoolsResponse = await apiService.getSchools({ limit: '10' });
        const schoolsArray = (schoolsResponse as any).schools || (Array.isArray(schoolsResponse) ? schoolsResponse : []);
        setSchools(schoolsArray);
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
            {schools.slice(0, 10).map((s, idx) => {
              const anyS = s as any;
              const key = (s.id ?? anyS.institution_id ?? anyS.school_id ?? s.udiseCode ?? idx) as string;
              const title = s.name ?? s.schoolName ?? anyS.school_name ?? anyS.institution_name ?? 'Unnamed School';
              const udise = s.udiseCode ?? anyS.udise_code ?? anyS.udise ?? '—';
              const district = s.districtName ?? anyS.district_name ?? anyS.district ?? '—';
              const state = s.stateName ?? anyS.state_name ?? anyS.state ?? '—';
              const status = s.status ?? (anyS.is_active !== undefined ? (anyS.is_active ? 'active' : 'inactive') : anyS.status_text) ?? '—';
              return (
                <li key={String(key)} className="rounded-md border p-3">
                  <div className="font-medium">{title}</div>
                  <div className="text-xs opacity-70">
                    UDISE: {udise} | District: {district} | State: {state} | Status: {status}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
