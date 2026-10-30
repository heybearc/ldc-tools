'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { ClipboardList, Plus, Upload } from 'lucide-react';

interface Person {
  id: string;
  name: string | null;
  email: string;
}

interface Step {
  id: string;
  title: string;
  detail: string;
  explanation: string | null;
  referenceUrl: string | null;
}

interface WorkNote {
  id: string;
  parentId?: string | null;
  kind: 'NOTE' | 'HELP';
  body: string;
  createdAt: string;
  author: Person;
}

export interface WorkItem {
  id: string;
  title: string;
  detail: string;
  explanation: string | null;
  referenceUrl: string | null;
  timingKind: 'DEADLINE' | 'PROJECT_DATE' | 'MONTHLY' | 'YEARLY' | 'PROCESS' | 'CREW_REQUEST' | 'NONE';
  timingLabel: string;
  project: { id: string; name: string } | null;
  claimable: boolean;
  status: 'OPEN' | 'DONE';
  assignee: Person | null;
  requestorName: string | null;
  requestorEmail: string | null;
  completedAt: string | null;
  steps: Step[];
  notes: WorkNote[];
  helpUnread?: boolean;
}

interface ProcessOffer {
  id: string;
  name: string;
  steps: Step[];
}

interface WorkResponse {
  canAssign: boolean;
  currentUserId: string;
  items: WorkItem[];
  teammates: Person[];
  projects: { id: string; name: string }[];
  processes: ProcessOffer[];
}

const PAGE_SIZES = [10, 25, 50, 100];

const EMPTY_FORM = {
  title: '',
  detail: '',
  explanation: '',
  referenceUrl: '',
  timingKind: 'DEADLINE',
  dueOn: '',
  projectId: '',
  claimable: false,
  assigneeId: '',
  requestorName: '',
  requestorEmail: '',
};

function personName(person: Person | null) {
  if (!person) return 'Unassigned';
  return person.name || person.email;
}

function formatDone(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function pageSlice<T>(items: T[], page: number, pageSize: number) {
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pages - 1);
  const start = current * pageSize;
  return { current, pages, slice: items.slice(start, start + pageSize) };
}

export default function WorkPage() {
  const [data, setData] = useState<WorkResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [bulkAssigneeId, setBulkAssigneeId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(0);
  const [donePage, setDonePage] = useState(0);
  const [processPage, setProcessPage] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const loadGeneration = useRef(0);

  const load = useCallback(async () => {
    const generation = ++loadGeneration.current;
    setError('');
    const response = await fetch('/api/v1/work-items', { cache: 'no-store' });
    if (generation !== loadGeneration.current) return;
    const body = await response.json();
    if (!response.ok) {
      setError(body.error || 'Failed to load work');
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
    const refresh = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 20000);
    return () => {
      window.removeEventListener('cg-filter-changed', onGroupChange);
      window.clearInterval(refresh);
    };
  }, [load]);

  const needsDate = form.timingKind === 'DEADLINE' || form.timingKind === 'PROJECT_DATE';

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/v1/work-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          dueOn: needsDate ? form.dueOn : null,
          projectId: form.projectId || null,
          assigneeId: form.assigneeId || null,
          claimable: form.claimable,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || 'Failed to add work');
        return;
      }
      setForm(EMPTY_FORM);
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function claim(id: string) {
    setBusyId(id);
    setError('');
    try {
      const response = await fetch(`/api/v1/work-items/${id}/claim`, { method: 'POST' });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || 'Failed to claim work');
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function onImport(file: File) {
    setImporting(true);
    setError('');
    setNotice('');
    try {
      const body = new FormData();
      body.set('file', file);
      const response = await fetch('/api/v1/work-items/import', { method: 'POST', body });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Failed to import crew requests');
        return;
      }
      const skipped = result.skipped ? ` ${result.skipped} already on the list or blank.` : '';
      setNotice(`Imported ${result.created} crew request${result.created === 1 ? '' : 's'}.${skipped}`);
      await load();
    } finally {
      setImporting(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  function toggleSelected(id: string, index: number, shiftKey: boolean) {
    setSelectedIds((current) => {
      const selected = new Set(current);
      if (shiftKey && lastSelectedIndex !== null) {
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        const range = openItems.slice(start, end + 1).map((item) => item.id);
        const turningOn = !selected.has(id);
        range.forEach((itemId) => {
          if (turningOn) selected.add(itemId);
          else selected.delete(itemId);
        });
      } else if (selected.has(id)) {
        selected.delete(id);
      } else {
        selected.add(id);
      }
      return Array.from(selected);
    });
    setLastSelectedIndex(index);
  }

  async function assignSelected() {
    if (!bulkAssigneeId || selectedIds.length === 0) return;
    setAssigning(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/v1/work-items/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, assigneeId: bulkAssigneeId }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || 'Failed to assign work');
        return;
      }
      setNotice(`Assigned ${body.assigned} task${body.assigned === 1 ? '' : 's'}.`);
      setSelectedIds([]);
      setLastSelectedIndex(null);
      await load();
    } finally {
      setAssigning(false);
    }
  }

  async function claimProcess(id: string) {
    setBusyId(id);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/v1/processes/${id}/claim`, { method: 'POST' });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || 'Failed to claim the process');
        return;
      }
      setNotice('Process claimed. The steps stay on that process.');
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function markSelectedDone() {
    if (selectedIds.length === 0) return;
    setCompleting(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/v1/work-items/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || 'Failed to mark work done');
        return;
      }
      setNotice(`Marked ${body.completed} done.`);
      setSelectedIds([]);
      setLastSelectedIndex(null);
      await load();
    } finally {
      setCompleting(false);
    }
  }

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

  const items = data?.items || [];
  const openItems = items.filter((item) => item.status === 'OPEN');
  const doneItems = items.filter((item) => item.status === 'DONE');
  const processes = data?.processes || [];
  const helpItems = openItems.filter((item) => (item.notes || []).some((note) => note.kind === 'HELP'));
  const currentUserId = data?.currentUserId || '';
  const canAssign = Boolean(data?.canAssign);
  const canSelect = (item: WorkItem) => canAssign || item.assignee?.id === currentUserId;
  const selectableIds = openItems.filter(canSelect).map((item) => item.id);
  const openView = pageSlice(openItems, page, pageSize);
  const doneView = pageSlice(doneItems, donePage, pageSize);
  const processView = pageSlice(processes, processPage, pageSize);

  useEffect(() => {
    if (page !== openView.current) setPage(openView.current);
    if (donePage !== doneView.current) setDonePage(doneView.current);
    if (processPage !== processView.current) setProcessPage(processView.current);
  }, [page, donePage, processPage, openView.current, doneView.current, processView.current]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Work</h1>
          <p className="mt-2 text-gray-600 max-w-3xl">
            Tasks for this construction group. A process is one claimable item, and its steps stay inside it. Personnel add and assign work.
          </p>
        </div>
        {data?.canAssign && (
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInput}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onImport(file);
              }}
            />
            <button
              type="button"
              disabled={importing}
              onClick={() => fileInput.current?.click()}
              className="inline-flex items-center justify-center px-4 py-2 min-h-[44px] rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              <Upload className="h-4 w-4 mr-2" />
              {importing ? 'Importing…' : 'Import crew requests'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm((open) => !open)}
              className="inline-flex items-center justify-center px-4 py-2 min-h-[44px] rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add work
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-md bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</p>
      )}
      {notice && (
        <p className="rounded-md bg-green-50 text-green-800 px-4 py-3 text-sm">{notice}</p>
      )}

      {showForm && data?.canAssign && (
        <form onSubmit={onSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-gray-700">Title</span>
              <input
                required
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-gray-700">Detail</span>
              <textarea
                required
                rows={3}
                value={form.detail}
                onChange={(event) => setForm({ ...form, detail: event.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-gray-700">Explanation</span>
              <textarea
                rows={2}
                value={form.explanation}
                onChange={(event) => setForm({ ...form, explanation: event.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Reference link</span>
              <input
                type="url"
                value={form.referenceUrl}
                onChange={(event) => setForm({ ...form, referenceUrl: event.target.value })}
                placeholder="https://"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Timing</span>
              <select
                value={form.timingKind}
                onChange={(event) => setForm({ ...form, timingKind: event.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
              >
                <option value="DEADLINE">Deadline</option>
                <option value="NONE">No deadline</option>
                <option value="PROJECT_DATE">Date on a project</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </label>
            {needsDate && (
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Date</span>
                <input
                  required
                  type="date"
                  value={form.dueOn}
                  onChange={(event) => setForm({ ...form, dueOn: event.target.value })}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>
            )}
            <label className="block">
              <span className="text-sm font-medium text-gray-700">
                Project{form.timingKind === 'PROJECT_DATE' ? '' : ' (optional)'}
              </span>
              <select
                required={form.timingKind === 'PROJECT_DATE'}
                value={form.projectId}
                onChange={(event) => setForm({ ...form, projectId: event.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
              >
                <option value="">None</option>
                {data.projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Assign to</span>
              <select
                value={form.assigneeId}
                onChange={(event) => setForm({ ...form, assigneeId: event.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
              >
                <option value="">Unassigned</option>
                {data.teammates.map((person) => (
                  <option key={person.id} value={person.id}>{personName(person)}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 min-h-[44px] text-sm text-gray-800">
              <input
                type="checkbox"
                checked={form.claimable}
                onChange={(event) => setForm({ ...form, claimable: event.target.checked })}
              />
              Claimable by anyone in this construction group
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Requestor name</span>
              <input
                value={form.requestorName}
                onChange={(event) => setForm({ ...form, requestorName: event.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Requestor email</span>
              <input
                type="email"
                value={form.requestorEmail}
                onChange={(event) => setForm({ ...form, requestorEmail: event.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 min-h-[44px] rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save work'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 min-h-[44px] rounded-md border border-gray-300 text-sm font-medium text-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Loading work…</p>
      ) : openItems.length === 0 && doneItems.length === 0 && processes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
          <ClipboardList className="h-8 w-8 mx-auto text-gray-400 mb-3" />
          No work yet for this construction group.
        </div>
      ) : (
        <div className="space-y-6">
          {helpItems.length > 0 && (
            <section id="help" className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-900">
                Help requested ({helpItems.length})
              </h2>
              <ul className="space-y-2">
                {helpItems.map((item) => {
                  const latest = [...(item.notes || [])].reverse().find((note) => note.kind === 'HELP');
                  return (
                    <li key={item.id} className="text-sm text-amber-950">
                      <a href={`#work-${item.id}`} className="font-medium hover:underline">{item.title}</a>
                      {latest ? ` — ${latest.body}` : ''}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          {processes.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Available processes</h2>
              {processView.slice.map((process) => (
                <article key={process.id} data-process-template={process.id} className="bg-white rounded-lg shadow p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">{process.name}</h3>
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                          Available
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        {process.steps.length === 1 ? '1 step' : `${process.steps.length} steps`}. Claiming keeps every step on this process.
                      </p>
                      <StepList steps={process.steps} />
                    </div>
                    <button
                      type="button"
                      disabled={busyId === process.id}
                      onClick={() => claimProcess(process.id)}
                      className="px-3 py-2 min-h-[44px] rounded-md bg-gray-900 text-white text-sm font-medium disabled:opacity-60"
                    >
                      Claim
                    </button>
                  </div>
                </article>
              ))}
              <Pager
                page={processView.current}
                pages={processView.pages}
                pageSize={pageSize}
                total={processes.length}
                onPage={setProcessPage}
                onPageSize={(size) => {
                  setPageSize(size);
                  setProcessPage(0);
                  setPage(0);
                  setDonePage(0);
                }}
              />
            </section>
          )}

          <section className="space-y-3">
            {openItems.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedIds(selectableIds)}
                    disabled={selectableIds.length === 0}
                    className="px-3 py-2 min-h-[44px] rounded-md border border-gray-300 text-sm font-medium text-gray-700 disabled:opacity-60"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedIds([]);
                      setLastSelectedIndex(null);
                    }}
                    disabled={selectedIds.length === 0}
                    className="px-3 py-2 min-h-[44px] rounded-md border border-gray-300 text-sm font-medium text-gray-700 disabled:opacity-60"
                  >
                    Deselect all
                  </button>
                  <p className="text-sm font-medium text-gray-800">{selectedIds.length} selected</p>
                  <button
                    type="button"
                    disabled={completing || selectedIds.length === 0}
                    onClick={markSelectedDone}
                    className="px-3 py-2 min-h-[44px] rounded-md bg-gray-900 text-white text-sm font-medium disabled:opacity-60"
                  >
                    {completing ? 'Marking done…' : 'Mark selected done'}
                  </button>
                </div>
                {canAssign && (
                  <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                    <label className="block flex-1">
                      <span className="text-sm font-medium text-gray-700">Assign to</span>
                      <select
                        value={bulkAssigneeId}
                        onChange={(event) => setBulkAssigneeId(event.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                      >
                        <option value="">Choose a person</option>
                        {data?.teammates.map((person) => (
                          <option key={person.id} value={person.id}>{personName(person)}</option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      disabled={assigning || !bulkAssigneeId || selectedIds.length === 0}
                      onClick={assignSelected}
                      className="px-4 py-2 min-h-[44px] rounded-md border border-gray-300 text-sm font-medium text-gray-800 disabled:opacity-60"
                    >
                      {assigning ? 'Assigning…' : 'Assign selected'}
                    </button>
                  </div>
                )}
              </div>
            )}
            {openView.slice.map((item) => {
              const index = openItems.findIndex((candidate) => candidate.id === item.id);
              return (
                <WorkRow
                  key={item.id}
                  item={item}
                  currentUserId={currentUserId}
                  canAssign={canAssign}
                  busy={busyId === item.id}
                  selected={selectedIds.includes(item.id)}
                  onToggle={canSelect(item) ? (shiftKey) => toggleSelected(item.id, index, shiftKey) : undefined}
                  onClaim={() => claim(item.id)}
                  onDone={() => setStatus(item.id, 'DONE')}
                  onChanged={load}
                />
              );
            })}
            {openItems.length > 0 && (
              <Pager
                page={openView.current}
                pages={openView.pages}
                pageSize={pageSize}
                total={openItems.length}
                onPage={setPage}
                onPageSize={(size) => {
                  setPageSize(size);
                  setPage(0);
                  setDonePage(0);
                  setProcessPage(0);
                }}
              />
            )}
            {openItems.length === 0 && processes.length > 0 && (
              <p className="text-sm text-gray-500">No open tasks.</p>
            )}
          </section>

          {doneItems.length > 0 && (
            <details className="bg-white rounded-lg shadow">
              <summary className="cursor-pointer px-5 py-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Done ({doneItems.length})
              </summary>
              <div className="space-y-3 px-3 pb-4">
                {doneView.slice.map((item) => (
                  <WorkRow
                    key={item.id}
                    item={item}
                    currentUserId={currentUserId}
                    canAssign={canAssign}
                    busy={busyId === item.id}
                    onClaim={() => claim(item.id)}
                    onDone={() => setStatus(item.id, 'OPEN')}
                    onChanged={load}
                  />
                ))}
                <Pager
                  page={doneView.current}
                  pages={doneView.pages}
                  pageSize={pageSize}
                  total={doneItems.length}
                  onPage={setDonePage}
                  onPageSize={(size) => {
                    setPageSize(size);
                    setPage(0);
                    setDonePage(0);
                    setProcessPage(0);
                  }}
                />
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

function Pager({
  page,
  pages,
  pageSize,
  total,
  onPage,
  onPageSize,
}: {
  page: number;
  pages: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}) {
  const start = total === 0 ? 0 : page * pageSize + 1;
  const end = Math.min(total, (page + 1) * pageSize);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
      <p>{total === 0 ? 'Nothing to show' : `${start}–${end} of ${total}`}</p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-2">
          Show
          <select
            value={pageSize}
            onChange={(event) => onPageSize(Number(event.target.value))}
            className="rounded-md border border-gray-300 px-2 py-2 bg-white min-h-[44px]"
            aria-label="How many to show"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={page <= 0}
          onClick={() => onPage(page - 1)}
          className="px-3 py-2 min-h-[44px] rounded-md border border-gray-300 disabled:opacity-60"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= pages - 1}
          onClick={() => onPage(page + 1)}
          className="px-3 py-2 min-h-[44px] rounded-md border border-gray-300 disabled:opacity-60"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function StepList({ steps }: { steps: Step[] }) {
  if (steps.length === 0) return null;
  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-sm font-medium text-gray-700">Steps ({steps.length})</summary>
      <ol className="mt-2 space-y-2 list-decimal pl-5">
        {steps.map((step) => (
          <li key={step.id} className="text-sm text-gray-800">
            <span className="font-medium">{step.title}</span>
            <p className="text-gray-600">{step.detail}</p>
            {step.explanation && <p className="text-gray-600">{step.explanation}</p>}
            {step.referenceUrl && (
              <a href={step.referenceUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                Reference
              </a>
            )}
          </li>
        ))}
      </ol>
    </details>
  );
}

export function NoteList({
  itemId,
  notes,
  onChanged,
}: {
  itemId: string;
  notes: WorkNote[];
  onChanged: () => Promise<void>;
}) {
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const marked = useRef(false);
  const top = notes.filter((note) => !note.parentId);
  if (top.length === 0) return null;

  async function markRead() {
    if (marked.current) return;
    marked.current = true;
    await fetch(`/api/v1/work-items/${itemId}/help-read`, { method: 'POST' });
    await onChanged();
  }

  async function sendReply(parentId: string) {
    const text = reply.trim();
    if (!text) {
      setError('Write a reply');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/v1/work-items/${itemId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text, kind: 'NOTE', parentId }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || 'Failed to reply');
        return;
      }
      setReply('');
      setReplyTo(null);
      await markRead();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ul className="mt-3 space-y-2">
      {top.map((entry) => {
        const replies = notes.filter((note) => note.parentId === entry.id);
        return (
          <li key={entry.id} className={`rounded-md px-3 py-2 text-sm ${entry.kind === 'HELP' ? 'bg-amber-50 text-amber-950' : 'bg-gray-50 text-gray-800'}`}>
            <p className="font-medium">
              {entry.kind === 'HELP' ? 'Asked for help' : 'Note'}
              {' · '}
              {personName(entry.author)}
              {' · '}
              {formatDone(entry.createdAt)}
            </p>
            <p className="mt-1 whitespace-pre-wrap">{entry.body}</p>
            {replies.length > 0 && (
              <ul className="mt-2 space-y-2 border-l-2 border-amber-200 pl-3">
                {replies.map((child) => (
                  <li key={child.id}>
                    <p className="font-medium">
                      Reply · {personName(child.author)} · {formatDone(child.createdAt)}
                    </p>
                    <p className="whitespace-pre-wrap">{child.body}</p>
                  </li>
                ))}
              </ul>
            )}
            {entry.kind === 'HELP' && (
              <div className="mt-2">
                {replyTo === entry.id ? (
                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      value={reply}
                      onFocus={() => { markRead().catch(() => undefined); }}
                      onChange={(event) => setReply(event.target.value)}
                      className="w-full rounded-md border border-amber-300 px-3 py-2 text-gray-900"
                    />
                    {error && <p className="text-red-700">{error}</p>}
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => sendReply(entry.id)}
                      className="px-3 py-2 min-h-[44px] rounded-md bg-gray-900 text-white text-sm font-medium disabled:opacity-60"
                    >
                      {saving ? 'Sending…' : 'Reply'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setReplyTo(entry.id)}
                    className="text-sm font-medium text-amber-900 hover:underline"
                  >
                    Reply
                  </button>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function WorkRow({
  item,
  currentUserId,
  canAssign,
  busy,
  selected,
  onToggle,
  onClaim,
  onDone,
  onChanged,
}: {
  item: WorkItem;
  currentUserId: string;
  canAssign: boolean;
  busy: boolean;
  selected?: boolean;
  onToggle?: (shiftKey: boolean) => void;
  onClaim: () => void;
  onDone: () => void;
  onChanged: () => Promise<void>;
}) {
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState('');
  const [noteNotice, setNoteNotice] = useState('');
  const canClaim = item.status === 'OPEN' && item.claimable && !item.assignee;
  const canFinish = item.status === 'OPEN' && (canAssign || item.assignee?.id === currentUserId);
  const canReopen = item.status === 'DONE' && (canAssign || item.assignee?.id === currentUserId);
  const doneOn = item.status === 'DONE' ? formatDone(item.completedAt) : '';

  async function saveNote(kind: 'NOTE' | 'HELP') {
    const text = note.trim();
    if (!text) {
      setNoteError('Write a note');
      return;
    }
    setSavingNote(true);
    setNoteError('');
    try {
      const response = await fetch(`/api/v1/work-items/${item.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text, kind }),
      });
      const body = await response.json();
      if (!response.ok) {
        setNoteError(body.error || 'Failed to save the note');
        return;
      }
      setNote('');
      if (kind === 'HELP') {
        setNoteNotice(
          body.notified > 0
            ? 'The Personnel Contact and Assistant were emailed. The request is also listed under Help requested.'
            : 'The Personnel Contact and Assistant can see this under Help requested on Work.',
        );
      } else {
        setNoteNotice('Note saved.');
      }
      await onChanged();
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <article id={`work-${item.id}`} data-work-id={item.id} className="bg-white rounded-lg shadow p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        {onToggle && (
          <input
            type="checkbox"
            checked={Boolean(selected)}
            aria-label={`Select ${item.title}`}
            onClick={(event) => onToggle(event.shiftKey)}
            onChange={() => undefined}
            className="mt-1 h-5 w-5"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">{item.title}</h2>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              {item.timingLabel}
            </span>
            {item.helpUnread && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900">
                Unread
              </span>
            )}
            {item.claimable && item.status === 'OPEN' && (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                Claimable
              </span>
            )}
            {doneOn && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                Done {doneOn}
              </span>
            )}
          </div>
          <p className="mt-2 text-gray-700 whitespace-pre-wrap">{item.detail}</p>
          {item.explanation && (
            <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">{item.explanation}</p>
          )}
          <p className="mt-3 text-sm text-gray-500">
            {personName(item.assignee)}
            {item.project ? ` · ${item.project.name}` : ''}
            {item.requestorName || item.requestorEmail
              ? ` · Requested by ${[item.requestorName, item.requestorEmail].filter(Boolean).join(' ')}`
              : ''}
          </p>
          {item.referenceUrl && (
            <a href={item.referenceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
              Reference
            </a>
          )}
          <StepList steps={item.steps || []} />
          <NoteList itemId={item.id} notes={item.notes || []} onChanged={onChanged} />
          <div className="mt-3 space-y-2">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Note or help</span>
              <textarea
                rows={2}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
            {noteError && <p className="text-sm text-red-700">{noteError}</p>}
            {noteNotice && <p className="text-sm text-green-800">{noteNotice}</p>}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={savingNote}
                onClick={() => saveNote('NOTE')}
                className="px-3 py-2 min-h-[44px] rounded-md border border-gray-300 text-sm font-medium text-gray-700 disabled:opacity-60"
              >
                Add note
              </button>
              <button
                type="button"
                disabled={savingNote}
                onClick={() => saveNote('HELP')}
                className="px-3 py-2 min-h-[44px] rounded-md border border-amber-300 text-sm font-medium text-amber-900 disabled:opacity-60"
              >
                Ask for help
              </button>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {canClaim && (
            <button
              type="button"
              disabled={busy}
              onClick={onClaim}
              className="px-3 py-2 min-h-[44px] rounded-md bg-gray-900 text-white text-sm font-medium disabled:opacity-60"
            >
              Claim
            </button>
          )}
          {canFinish && (
            <button
              type="button"
              disabled={busy}
              onClick={onDone}
              className="px-3 py-2 min-h-[44px] rounded-md border border-gray-300 text-sm font-medium text-gray-700 disabled:opacity-60"
            >
              Done
            </button>
          )}
          {canReopen && (
            <button
              type="button"
              disabled={busy}
              onClick={onDone}
              className="px-3 py-2 min-h-[44px] rounded-md border border-gray-300 text-sm font-medium text-gray-700 disabled:opacity-60"
            >
              Reopen
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
