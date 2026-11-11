'use client';

import { FormEvent, useCallback, useEffect, useId, useRef, useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import ProjectDateCalendar from '@/components/ProjectDateCalendar';
import { userError } from '@/lib/user-error';

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
  dueOn: string | null;
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
  startDate: string | null;
  endDate: string | null;
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

interface ProjectDraft {
  name: string;
  number: string;
  location: string;
  status: string;
  startDate: string;
  endDate: string;
  builderAssistantUrl: string;
}

const EMPTY_PROJECT: ProjectDraft = {
  name: '',
  number: '',
  location: '',
  status: 'PLANNING',
  startDate: '',
  endDate: '',
  builderAssistantUrl: '',
};

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

function PersonnelPicker({
  people,
  disabled,
  onAssign,
}: {
  people: Person[];
  disabled: boolean;
  onAssign: (userIds: string[]) => Promise<boolean>;
}) {
  const listId = useId();
  const box = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const needle = query.trim().toLowerCase();
  const shown = needle
    ? people.filter((person) => `${personName(person)} ${person.email}`.toLowerCase().includes(needle))
    : people;
  const chosen = people.filter((person) => selected.includes(person.id));

  const peopleKey = people.map((person) => person.id).join('\n');
  useEffect(() => {
    const available = new Set(peopleKey ? peopleKey.split('\n') : []);
    setSelected((current) => {
      const next = current.filter((id) => available.has(id));
      return next.length === current.length ? current : next;
    });
  }, [peopleKey]);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <div className="mt-3 max-w-md" ref={box}>
      <label className="block text-sm font-medium text-gray-700" htmlFor={listId}>
        Add Personnel
      </label>
      {people.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">Everyone on Personnel is already assigned.</p>
      ) : (
        <>
          {chosen.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2">
              {chosen.map((person) => (
                <li key={person.id} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-sm text-blue-900">
                  {personName(person)}
                  <button
                    type="button"
                    aria-label={`Remove ${personName(person)} from the selection`}
                    onClick={() => toggle(person.id)}
                    className="px-1 text-base leading-none"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
          <input
            id={listId}
            role="combobox"
            aria-expanded={open}
            aria-controls={`${listId}-list`}
            aria-autocomplete="list"
            value={query}
            disabled={disabled}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setOpen(false);
              if (event.key === 'Enter' && open && shown[0]) {
                event.preventDefault();
                toggle(shown[0].id);
              }
            }}
            placeholder="Find people"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[44px]"
          />
          {open && (
            <ul
              id={`${listId}-list`}
              role="listbox"
              aria-multiselectable="true"
              className="mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-sm"
            >
              {shown.map((person) => {
                const on = selected.includes(person.id);
                return (
                  <li key={person.id} role="option" aria-selected={on}>
                    <button
                      type="button"
                      onClick={() => toggle(person.id)}
                      className="flex w-full items-center gap-2 px-3 py-2 min-h-[44px] text-left text-sm text-gray-900 hover:bg-gray-50"
                    >
                      <input type="checkbox" readOnly checked={on} tabIndex={-1} className="h-4 w-4 rounded border-gray-300" />
                      {personName(person)}
                    </button>
                  </li>
                );
              })}
              {shown.length === 0 && (
                <li className="px-3 py-3 text-sm text-gray-500">No one matches.</li>
              )}
            </ul>
          )}
          {selected.length > 0 && (
            <button
              type="button"
              disabled={disabled}
              onClick={async () => {
                const ok = await onAssign(selected);
                if (!ok) return;
                setSelected([]);
                setQuery('');
                setOpen(false);
              }}
              className="mt-2 px-4 py-2 min-h-[44px] rounded-md bg-blue-600 text-white text-sm font-medium disabled:opacity-60"
            >
              {selected.length === 1 ? 'Assign 1 person' : `Assign ${selected.length} people`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [personnel, setPersonnel] = useState<Person[]>([]);
  const [canAssign, setCanAssign] = useState(false);
  const [canAddDate, setCanAddDate] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ProjectDraft>(EMPTY_PROJECT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DateDraft>>({});
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', number: '', location: '' });
  const [notice, setNotice] = useState('');

  const loadGeneration = useRef(0);

  const load = useCallback(async () => {
    const generation = ++loadGeneration.current;
    setError('');
    try {
      const response = await fetch('/api/v1/projects/summary', { cache: 'no-store' });
      if (generation !== loadGeneration.current) return;
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(userError(response.status, body.error, 'Could not load projects'));
        return;
      }
      setProjects(body.projects || []);
      setPersonnel(body.personnel || []);
      setCanAssign(Boolean(body.canAssign));
      setCanAddDate(Boolean(body.canAddDate));
      setCanEdit(Boolean(body.canEdit ?? (body.canAssign || body.canAddDate)));
    } catch {
      if (generation !== loadGeneration.current) return;
      setError(userError(0, '', 'Could not load projects'));
    } finally {
      if (generation === loadGeneration.current) setLoading(false);
    }
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

  async function assign(projectId: string, userIds: string[]) {
    if (userIds.length === 0) return false;
    setBusyId(projectId);
    setError('');
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/personnel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(userError(response.status, body.error, 'Could not assign Personnel'));
        return false;
      }
      await load();
      return true;
    } catch {
      setError(userError(0, '', 'Could not assign Personnel'));
      return false;
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
        setError(userError(response.status, body.error, 'Could not add the date'));
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
        setError(userError(response.status, body.error, 'Could not remove Personnel'));
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  const canCreate = canAssign || canAddDate || canEdit;

  function beginEdit(project: ProjectRow) {
    setNotice('');
    setEditingId(project.id);
    setEditForm({
      name: project.name,
      number: project.number || '',
      location: project.location || '',
      status: project.status || 'PLANNING',
      startDate: project.startDate || '',
      endDate: project.endDate || '',
      builderAssistantUrl: project.builderAssistantUrl || '',
    });
  }

  async function saveProject(event: FormEvent) {
    event.preventDefault();
    if (!editingId) return;
    setBusyId(editingId);
    setError('');
    try {
      const response = await fetch(`/api/v1/projects/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          projectNumber: editForm.number || null,
          location: editForm.location || null,
          status: editForm.status,
          startDate: editForm.startDate || null,
          endDate: editForm.endDate || null,
          builderAssistantUrl: editForm.builderAssistantUrl || null,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(userError(response.status, body.error, 'Could not save the project'));
        return;
      }
      const savedName = editForm.name.trim();
      const savedStatus = STATUS_LABELS[editForm.status] || editForm.status;
      setEditingId(null);
      setView('list');
      setNotice(`${savedName} saved. Status is ${savedStatus}.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function removeProject(project: ProjectRow) {
    if (!window.confirm(`Remove ${project.name} from this list? Dated work stays on the work list.`)) return;
    setBusyId(project.id);
    setError('');
    try {
      const response = await fetch(`/api/v1/projects/${project.id}`, { method: 'DELETE' });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(userError(response.status, body.error, 'Could not remove the project'));
        return;
      }
      if (editingId === project.id) setEditingId(null);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  function openFromCalendar(projectId: string) {
    setView('list');
    window.setTimeout(() => {
      document.getElementById(`project-${projectId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

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
        setError(userError(response.status, body.error, 'Could not add the project'));
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
            Projects for this construction group. Edit a project to change its name, status, or dates. Oversight assigns Personnel. Personnel add a date, and that date also shows on the work list. Crews, budget, and congregations stay off this list.
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

      <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
        <button
          type="button"
          onClick={() => setView('list')}
          className={`px-4 py-2 min-h-[44px] text-sm ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
        >
          List
        </button>
        <button
          type="button"
          onClick={() => setView('calendar')}
          className={`px-4 py-2 min-h-[44px] text-sm ${view === 'calendar' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
        >
          Calendar
        </button>
      </div>

      {error && <p className="rounded-md bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</p>}
      {notice && <p className="rounded-md bg-green-50 text-green-800 px-4 py-3 text-sm">{notice}</p>}

      {loading ? (
        <p className="text-gray-500">Loading projects…</p>
      ) : view === 'calendar' ? (
        <ProjectDateCalendar projects={projects} onOpenProject={openFromCalendar} />
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
          <Building2 className="h-8 w-8 mx-auto text-gray-400 mb-3" />
          No projects for this construction group.
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <article id={`project-${project.id}`} key={project.id} className="bg-white rounded-lg shadow p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">{project.name}</h2>
                <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                  {STATUS_LABELS[project.status] || project.status}
                </span>
                {canEdit && (
                  <div className="ml-auto flex gap-2">
                    <button
                      type="button"
                      onClick={() => (editingId === project.id ? setEditingId(null) : beginEdit(project))}
                      className="px-3 py-2 min-h-[44px] rounded-md border border-gray-300 text-sm text-gray-800"
                    >
                      {editingId === project.id ? 'Close' : 'Edit project'}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === project.id}
                      onClick={() => removeProject(project)}
                      className="px-3 py-2 min-h-[44px] rounded-md border border-red-200 text-sm text-red-700 disabled:opacity-60"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              {editingId === project.id && (
                <form onSubmit={saveProject} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="block md:col-span-2">
                    <span className="text-sm font-medium text-gray-700">Name</span>
                    <input
                      required
                      value={editForm.name}
                      onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[44px]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">Number</span>
                    <input
                      value={editForm.number}
                      onChange={(event) => setEditForm({ ...editForm, number: event.target.value })}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[44px]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">Location</span>
                    <input
                      value={editForm.location}
                      onChange={(event) => setEditForm({ ...editForm, location: event.target.value })}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[44px]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">Status</span>
                    <select
                      value={editForm.status}
                      onChange={(event) => setEditForm({ ...editForm, status: event.target.value })}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[44px] bg-white"
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">Builder Assistant link</span>
                    <input
                      value={editForm.builderAssistantUrl}
                      onChange={(event) => setEditForm({ ...editForm, builderAssistantUrl: event.target.value })}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[44px]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">Start</span>
                    <input
                      type="date"
                      value={editForm.startDate}
                      onChange={(event) => setEditForm({ ...editForm, startDate: event.target.value })}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[44px]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">End</span>
                    <input
                      type="date"
                      value={editForm.endDate}
                      onChange={(event) => setEditForm({ ...editForm, endDate: event.target.value })}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[44px]"
                    />
                  </label>
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={busyId === project.id}
                      className="px-4 py-2 min-h-[44px] rounded-md bg-blue-600 text-white text-sm font-medium disabled:opacity-60"
                    >
                      {busyId === project.id ? 'Saving…' : 'Save project'}
                    </button>
                  </div>
                </form>
              )}
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
                  <PersonnelPicker
                    people={personnel.filter((person) => !project.personnel.some((assigned) => assigned.id === person.id))}
                    disabled={busyId === project.id}
                    onAssign={(userId) => assign(project.id, userId)}
                  />
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
