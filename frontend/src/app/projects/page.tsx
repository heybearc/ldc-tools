'use client';

import { useCallback, useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';

interface Person {
  id: string;
  name: string | null;
  email: string;
}

interface ProjectRow {
  id: string;
  name: string;
  number: string | null;
  location: string | null;
  status: string;
  start: string | null;
  end: string | null;
  builderAssistantUrl: string | null;
  personnel: Person[];
}

const STATUS_LABELS: Record<string, string> = {
  PLANNING: 'Planning',
  ACTIVE: 'Active',
  ON_HOLD: 'On hold',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

function personName(person: Person) {
  return person.name || person.email;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [personnel, setPersonnel] = useState<Person[]>([]);
  const [canAssign, setCanAssign] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [choice, setChoice] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setError('');
    const response = await fetch('/api/v1/projects/summary', { cache: 'no-store' });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error || 'Failed to load projects');
      setLoading(false);
      return;
    }
    setProjects(body.projects || []);
    setPersonnel(body.personnel || []);
    setCanAssign(Boolean(body.canAssign));
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

  async function assign(projectId: string) {
    const userId = choice[projectId];
    if (!userId) return;
    setBusyId(projectId);
    setError('');
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/personnel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || 'Failed to assign Personnel');
        return;
      }
      setChoice((current) => ({ ...current, [projectId]: '' }));
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function remove(projectId: string, userId: string) {
    setBusyId(projectId);
    setError('');
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/personnel?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || 'Failed to remove Personnel');
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Projects</h1>
        <p className="mt-2 text-gray-600 max-w-3xl">
          Projects for this construction group. Oversight assigns Personnel. Crews, budget, and congregations stay off this list.
        </p>
      </div>

      {error && <p className="rounded-md bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading projects…</p>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
          <Building2 className="h-8 w-8 mx-auto text-gray-400 mb-3" />
          No projects for this construction group.
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <article key={project.id} className="bg-white rounded-lg shadow p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">{project.name}</h2>
                <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                  {STATUS_LABELS[project.status] || project.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                {[project.number, project.location, project.start, project.end].filter(Boolean).join(' · ') || 'No number, location, or dates yet'}
              </p>
              {project.builderAssistantUrl && (
                <a href={project.builderAssistantUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
                  Builder Assistant
                </a>
              )}
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700">Personnel</p>
                {project.personnel.length === 0 ? (
                  <p className="mt-1 text-sm text-gray-500">No one assigned</p>
                ) : (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {project.personnel.map((person) => (
                      <li key={person.id} className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-900">
                        {personName(person)}
                        {canAssign && (
                          <button
                            type="button"
                            disabled={busyId === project.id}
                            onClick={() => remove(project.id, person.id)}
                            className="text-blue-700 hover:text-blue-900"
                            aria-label={`Remove ${personName(person)}`}
                          >
                            ×
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {canAssign && (
                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <select
                      value={choice[project.id] || ''}
                      onChange={(event) => setChoice({ ...choice, [project.id]: event.target.value })}
                      className="rounded-md border border-gray-300 px-3 py-2 bg-white text-sm min-h-[44px]"
                    >
                      <option value="">Add Personnel</option>
                      {personnel.filter((person) => !project.personnel.some((assigned) => assigned.id === person.id)).map((person) => (
                        <option key={person.id} value={person.id}>{personName(person)}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!choice[project.id] || busyId === project.id}
                      onClick={() => assign(project.id)}
                      className="px-4 py-2 min-h-[44px] rounded-md bg-blue-600 text-white text-sm font-medium disabled:opacity-60"
                    >
                      Assign
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
