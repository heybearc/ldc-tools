'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Building2, Plus } from 'lucide-react';

interface Person {
  id: string;
  name: string | null;
  email: string;
}

interface ScheduleItem {
  id: string;
  title: string;
  detail: string;
  date: string | null;
  status: 'OPEN' | 'DONE';
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
  schedule: ScheduleItem[];
}

interface DateDraft {
  title: string;
  detail: string;
  date: string;
}

const EMPTY_DATE: DateDraft = { title: '', detail: '', date: '' };

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
  const [canAddDate, setCanAddDate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, DateDraft>>({});
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', number: '', location: '' });

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
    setCanAddDate(Boolean(body.canAddDate));
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

  function draftFor(projectId: string) {
    return drafts[projectId] || EMPTY_DATE;
  }

  async function addDate(projectId: string) {
    const draft = draftFor(projectId);
    setBusyId(projectId);
    setError('');
    try {
      const response = await fetch('/api/v1/work-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draft.title,
          detail: draft.detail,
          timingKind: 'PROJECT_DATE',
          dueOn: draft.date,
          projectId,
          claimable: false,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || 'Failed to add a date');
        return;
      }
      setDrafts((current) => ({ ...current, [projectId]: EMPTY_DATE }));
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

  const canCreate = canAssign || canAddDate;

  async function createProject(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectForm.name,
          projectNumber: projectForm.number || null,
          location: projectForm.location || null,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || 'Failed to add a project');
        return;
      }
      setProjectForm({ name: '', number: '', location: '' });
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Projects</h1>
          <p className="mt-2 text-gray-600 max-w-3xl">
            Projects for this construction group. Oversight assigns Personnel. Personnel add a date, and that date also shows on the work list. Crews, budget, and congregations stay off this list.
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setShowForm((open) => !open)}
            className="inline-flex items-center justify-center px-4 py-2 min-h-[44px] rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add project
          </button>
        )}
      </div>

      {showForm && canCreate && (
        <form onSubmit={createProject} className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-gray-700">Name</span>
              <input
                required
                value={projectForm.name}
                onChange={(event) => setProjectForm({ ...projectForm, name: event.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Number</span>
              <input
                value={projectForm.number}
                onChange={(event) => setProjectForm({ ...projectForm, number: event.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Location</span>
              <input
                value={projectForm.location}
                onChange={(event) => setProjectForm({ ...projectForm, location: event.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center px-4 py-2 min-h-[44px] rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save project'}
          </button>
        </form>
      )}

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
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="text-sm font-medium text-gray-700">Schedule</p>
                {project.schedule.length === 0 ? (
                  <p className="mt-1 text-sm text-gray-500">No dated work on this project.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {project.schedule.map((item) => (
                      <li key={item.id} className="text-sm text-gray-800">
                        <span className="font-medium">{item.date}</span>
                        <span> · {item.title}</span>
                        {item.status === 'DONE' && (
                          <span className="ml-2 text-xs font-medium text-gray-500">Done</span>
                        )}
                        <p className="text-gray-600">{item.detail}</p>
                      </li>
                    ))}
                  </ul>
                )}
                {canAddDate && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="block sm:col-span-2">
                      <span className="text-sm text-gray-700">Title</span>
                      <input
                        value={draftFor(project.id).title}
                        onChange={(event) => setDrafts({ ...drafts, [project.id]: { ...draftFor(project.id), title: event.target.value } })}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[44px]"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="text-sm text-gray-700">Detail</span>
                      <input
                        value={draftFor(project.id).detail}
                        onChange={(event) => setDrafts({ ...drafts, [project.id]: { ...draftFor(project.id), detail: event.target.value } })}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[44px]"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm text-gray-700">Date</span>
                      <input
                        type="date"
                        value={draftFor(project.id).date}
                        onChange={(event) => setDrafts({ ...drafts, [project.id]: { ...draftFor(project.id), date: event.target.value } })}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[44px]"
                      />
                    </label>
                    <div className="flex items-end">
                      <button
                        type="button"
                        disabled={!draftFor(project.id).title || !draftFor(project.id).detail || !draftFor(project.id).date || busyId === project.id}
                        onClick={() => addDate(project.id)}
                        className="px-4 py-2 min-h-[44px] rounded-md bg-blue-600 text-white text-sm font-medium disabled:opacity-60"
                      >
                        Add date
                      </button>
                    </div>
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
