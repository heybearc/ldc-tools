'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { ClipboardList, Plus, Upload } from 'lucide-react';

interface Person {
  id: string;
  name: string | null;
  email: string;
}

interface WorkItem {
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
}

interface WorkResponse {
  canAssign: boolean;
  currentUserId: string;
  items: WorkItem[];
  teammates: Person[];
  projects: { id: string; name: string }[];
}

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
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setError('');
    const response = await fetch('/api/v1/work-items', { cache: 'no-store' });
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
    return () => window.removeEventListener('cg-filter-changed', onGroupChange);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Work</h1>
          <p className="mt-2 text-gray-600 max-w-3xl">
            Tasks for this construction group. Personnel add and assign them. A claimable task can be taken by anyone signed in here.
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
      ) : openItems.length === 0 && doneItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
          <ClipboardList className="h-8 w-8 mx-auto text-gray-400 mb-3" />
          No work yet for this construction group.
        </div>
      ) : (
        <div className="space-y-3">
          {data?.canAssign && selectedIds.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4 flex flex-col sm:flex-row sm:items-end gap-3">
              <p className="text-sm font-medium text-gray-800 sm:mb-2">{selectedIds.length} selected</p>
              <label className="block flex-1">
                <span className="text-sm font-medium text-gray-700">Assign to</span>
                <select
                  value={bulkAssigneeId}
                  onChange={(event) => setBulkAssigneeId(event.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
                >
                  <option value="">Choose a person</option>
                  {data.teammates.map((person) => (
                    <option key={person.id} value={person.id}>{personName(person)}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={assigning || !bulkAssigneeId}
                onClick={assignSelected}
                className="px-4 py-2 min-h-[44px] rounded-md bg-gray-900 text-white text-sm font-medium disabled:opacity-60"
              >
                {assigning ? 'Assigning…' : 'Assign selected'}
              </button>
            </div>
          )}
          {openItems.map((item, index) => (
            <WorkRow
              key={item.id}
              item={item}
              currentUserId={data?.currentUserId || ''}
              canAssign={Boolean(data?.canAssign)}
              busy={busyId === item.id}
              selected={selectedIds.includes(item.id)}
              onToggle={(shiftKey) => toggleSelected(item.id, index, shiftKey)}
              onClaim={() => claim(item.id)}
              onDone={() => setStatus(item.id, 'DONE')}
            />
          ))}
          {doneItems.length > 0 && (
            <h2 className="pt-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Done</h2>
          )}
          {doneItems.map((item) => (
            <WorkRow
              key={item.id}
              item={item}
              currentUserId={data?.currentUserId || ''}
              canAssign={Boolean(data?.canAssign)}
              busy={busyId === item.id}
              onClaim={() => claim(item.id)}
              onDone={() => setStatus(item.id, 'OPEN')}
            />
          ))}
        </div>
      )}
    </div>
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
}: {
  item: WorkItem;
  currentUserId: string;
  canAssign: boolean;
  busy: boolean;
  selected?: boolean;
  onToggle?: (shiftKey: boolean) => void;
  onClaim: () => void;
  onDone: () => void;
}) {
  const canClaim = item.status === 'OPEN' && item.claimable && !item.assignee;
  const canFinish = item.status === 'OPEN' && (canAssign || item.assignee?.id === currentUserId);
  const canReopen = item.status === 'DONE' && (canAssign || item.assignee?.id === currentUserId);

  return (
    <article className="bg-white rounded-lg shadow p-5">
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
            {item.claimable && item.status === 'OPEN' && (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                Claimable
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
