'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import { WorkRow, type WorkItem } from '@/app/work/page';

interface WorkResponse {
  canAssign: boolean;
  currentUserId: string;
  items: WorkItem[];
}

export default function MyWorkPage() {
  const [data, setData] = useState<WorkResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const loadGeneration = useRef(0);

  const load = useCallback(async () => {
    const generation = ++loadGeneration.current;
    setError('');
    const response = await fetch('/api/v1/work-items', { cache: 'no-store' });
    if (generation !== loadGeneration.current) return;
    const body = await response.json();
    if (!response.ok) {
      setError(body.error || 'Failed to load your work');
      setLoading(false);
      return;
    }
    setData(body);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const onGroupChange = () => {
      setLoading(true);
      load();
    };
    window.addEventListener('cg-filter-changed', onGroupChange);
    return () => window.removeEventListener('cg-filter-changed', onGroupChange);
  }, [load]);

  async function setStatus(id: string, status: 'OPEN' | 'DONE') {
    setBusyId(id);
    setError('');
    try {
      const response = await fetch(`/api/v1/work-items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || 'Failed to update work');
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  const currentUserId = data?.currentUserId || '';
  const mine = (data?.items || []).filter((item) => item.assignee?.id === currentUserId);
  const openItems = mine.filter((item) => item.status === 'OPEN');
  const doneItems = mine.filter((item) => item.status === 'DONE');
  const canAssign = Boolean(data?.canAssign);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Work</h1>
        <p className="mt-2 text-gray-600 max-w-3xl">
          Work assigned to you in this construction group. Claim something new from <Link href="/work" className="text-blue-600 hover:underline">Work</Link>.
        </p>
      </div>

      {error && <p className="rounded-md bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading your work…</p>
      ) : openItems.length === 0 && doneItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
          <ClipboardList className="h-8 w-8 mx-auto text-gray-400 mb-3" />
          Nothing is assigned to you.
          <p className="mt-2">
            <Link href="/work" className="text-blue-600 hover:underline">See available work</Link>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {openItems.map((item) => (
            <WorkRow
              key={item.id}
              item={item}
              currentUserId={currentUserId}
              canAssign={canAssign}
              busy={busyId === item.id}
              onClaim={() => undefined}
              onDone={() => setStatus(item.id, 'DONE')}
              onChanged={load}
            />
          ))}
          {doneItems.length > 0 && (
            <details className="bg-white rounded-lg shadow">
              <summary className="cursor-pointer px-5 py-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Done ({doneItems.length})
              </summary>
              <div className="space-y-3 px-3 pb-4">
                {doneItems.map((item) => (
                  <WorkRow
                    key={item.id}
                    item={item}
                    currentUserId={currentUserId}
                    canAssign={canAssign}
                    busy={busyId === item.id}
                    onClaim={() => undefined}
                    onDone={() => setStatus(item.id, 'OPEN')}
                    onChanged={load}
                  />
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
