'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { ClipboardList, Plus, Upload } from 'lucide-react';
import Link from 'next/link';
import { isAirgappedEmail } from '@/lib/reachable-email';
import { scheduleLabel, type ProcessCadence, type ProcessCustomUnit } from '@/lib/processes';
import { byTime, publishedOn } from '@/lib/published-date';
import { userError } from '@/lib/user-error';
import { calendarToday, completionEmailOff, formatCalendarDate, isOverdue } from '@/lib/work-items';

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
  done?: boolean;
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
  dueOn: string | null;
  canEdit?: boolean;
  project: { id: string; name: string } | null;
  claimable: boolean;
  status: 'OPEN' | 'DONE';
  assignee: Person | null;
  requestorName: string | null;
  requestorEmail: string | null;
  notifyRequestor?: boolean;
  startedAt?: string | null;
  completedAt: string | null;
  createdAt: string;
  steps: Step[];
  notes: WorkNote[];
  helpUnread?: boolean;
}

interface ProcessOffer {
  id: string;
  name: string;
  purpose: string | null;
  appliesTo: 'TEAM' | 'PROJECT';
  cadence: ProcessCadence;
  customEvery: number | null;
  customUnit: ProcessCustomUnit | null;
  publishedAt?: string | null;
  steps: Step[];
}

interface WorkResponse {
  canAssign: boolean;
  canRun?: boolean;
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

function applyNotify(items: WorkItem[], overrides: Map<string, boolean>): WorkItem[] {
  if (overrides.size === 0) return items;
  return items.map((item) => {
    const notifyRequestor = overrides.get(item.id);
    return notifyRequestor === undefined ? item : { ...item, notifyRequestor };
  });
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
  const [editingId, setEditingId] = useState<string | null>(null);
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
  const [newestFirst, setNewestFirst] = useState(true);
  const [projectFilter, setProjectFilter] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [emailOffOnly, setEmailOffOnly] = useState(false);
  const [donePage, setDonePage] = useState(0);
  const [processPage, setProcessPage] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const loadGeneration = useRef(0);
  const emailOverride = useRef(new Map<string, boolean>());

  const load = useCallback(async () => {
    const generation = ++loadGeneration.current;
    setError('');
    try {
      const response = await fetch('/api/v1/work-items', { cache: 'no-store' });
      const body = await response.json().catch(() => ({}));
      if (generation !== loadGeneration.current) return;
      if (!response.ok) {
        setError(userError(response.status, body.error, 'Could not load work'));
        return;
      }
      const items = applyNotify(body.items || [], emailOverride.current);
      for (const item of body.items || []) {
        if (emailOverride.current.get(item.id) === item.notifyRequestor) {
          emailOverride.current.delete(item.id);
        }
      }
      setData({ ...body, items });
    } catch {
      if (generation !== loadGeneration.current) return;
      setError(userError(0, '', 'Could not load work'));
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
    const refresh = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 20000);
    return () => {
      window.removeEventListener('cg-filter-changed', onGroupChange);
      window.clearInterval(refresh);
    };
  }, [load]);

  const needsDate = form.timingKind === 'DEADLINE' || form.timingKind === 'PROJECT_DATE';

  function beginEdit(item: WorkItem) {
    setForm({
      title: item.title,
      detail: item.detail,
      explanation: item.explanation || '',
      referenceUrl: item.referenceUrl || '',
      timingKind: item.timingKind,
      dueOn: item.dueOn || '',
      projectId: item.project?.id || '',
      claimable: item.claimable,
      assigneeId: item.assignee?.id || '',
      requestorName: item.requestorName || '',
      requestorEmail: item.requestorEmail || '',
    });
    setEditingId(item.id);
    setShowForm(true);
    setError('');
    window.setTimeout(() => {
      document.getElementById('work-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  const openedEdit = useRef(false);
  useEffect(() => {
    if (!data || openedEdit.current) return;
    const id = new URLSearchParams(window.location.search).get('edit');
    if (!id) return;
    const item = data.items.find((candidate) => candidate.id === id);
    if (!item?.canEdit) return;
    openedEdit.current = true;
    beginEdit(item);
  }, [data]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const editing = Boolean(editingId);
    try {
      const response = await fetch(editing ? `/api/v1/work-items/${editingId}` : '/api/v1/work-items', {
        method: editing ? 'PATCH' : 'POST',
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
        setError(userError(response.status, body.error, editing ? 'Could not save the work' : 'Could not add the work'));
        return;
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
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
        setError(userError(response.status, body.error, 'Could not claim the work'));
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
        setError(userError(response.status, result.error, 'Could not import the crew requests'));
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
        setError(userError(response.status, body.error, 'Could not assign the work'));
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
        setError(userError(response.status, body.error, 'Could not claim the process'));
        return;
      }
      setNotice('Process claimed. The tasks stay on that process.');
      await load();
    } finally {
      setBusyId(null);
    }
  }

  function rememberEmail(id: string, notifyRequestor: boolean) {
    emailOverride.current.set(id, notifyRequestor);
    setData((current) => current ? { ...current, items: applyNotify(current.items, emailOverride.current) } : current);
  }

  async function setNotifySelected(notifyRequestor: boolean) {
    const ids = selectedIds;
    if (ids.length === 0) return;
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/v1/work-items/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, notifyRequestor }),
      });
      const body = await response.json();
      const savedIds = Array.isArray(body.ids)
        ? body.ids.filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)
        : [];
      if (!response.ok || savedIds.length === 0) {
        setError(userError(response.status, body.error, 'Could not update the completion email'));
        return;
      }
      savedIds.forEach((id: string) => emailOverride.current.set(id, notifyRequestor));
      setData((current) => current ? { ...current, items: applyNotify(current.items, emailOverride.current) } : current);
      const count = savedIds.length;
      setNotice(notifyRequestor
        ? `Completion email is on for ${count} task${count === 1 ? '' : 's'}.`
        : `Completion email is off for ${count} task${count === 1 ? '' : 's'}.`);
      setSelectedIds([]);
      setLastSelectedIndex(null);
      await load();
    } catch {
      setError(userError(0, '', 'Could not update the completion email'));
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
        setError(userError(response.status, body.error, 'Could not mark the work done'));
        return;
      }
      const mailed = Number(body.emailed || 0);
      const failed = Number(body.emailFailed || 0);
      const mailNote = mailed > 0
        ? ` Sent ${mailed} completion email${mailed === 1 ? '' : 's'}.`
        : '';
      const failNote = failed > 0
        ? ` ${failed} completion email${failed === 1 ? '' : 's'} did not send.`
        : '';
      setNotice(`Marked ${body.completed} finished.${mailNote}${failNote}`);
      setSelectedIds([]);
      setLastSelectedIndex(null);
      await load();
    } finally {
      setCompleting(false);
    }
  }

  async function startWorkItem(id: string) {
    setBusyId(id);
    setError('');
    try {
      const response = await fetch(`/api/v1/work-items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: true }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(userError(response.status, body.error, 'Could not start the work'));
        return;
      }
      setNotice('Started.');
      await load();
    } finally {
      setBusyId(null);
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
        setError(userError(response.status, body.error, 'Could not update the work'));
        return;
      }
      if (status === 'DONE' && body.emailSent === false && body.requestorEmail) {
        setNotice('Marked finished. The completion email was not sent.');
      } else if (status === 'DONE' && body.emailSent) {
        setNotice(`Marked finished. Emailed ${body.requestorEmail}.`);
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  const items = data?.items || [];
  const today = calendarToday();
  const openBase = items.filter((item) => item.status === 'OPEN');
  const overdueCount = openBase.filter((item) => isOverdue(item.dueOn, today)).length;
  const emailOffCount = openBase.filter((item) => completionEmailOff(item)).length;
  const viewActive = Boolean(projectFilter || overdueOnly || emailOffOnly);
  const matchesProject = (item: WorkItem) => !projectFilter || item.project?.id === projectFilter;
  const openItems = byTime(
    openBase.filter((item) => {
      if (!matchesProject(item)) return false;
      if (overdueOnly && !isOverdue(item.dueOn, today)) return false;
      if (emailOffOnly && !completionEmailOff(item)) return false;
      return true;
    }),
    (item) => item.createdAt,
    newestFirst,
  );
  const availableCount = openBase.filter((item) => item.claimable && !item.assignee).length;
  const doneItems = byTime(
    items.filter((item) => item.status === 'DONE' && matchesProject(item)),
    (item) => item.createdAt,
    newestFirst,
  );
  const processes = byTime(data?.processes || [], (process) => process.publishedAt, newestFirst);
  const helpItems = openItems.filter((item) => (item.notes || []).some((note) => note.kind === 'HELP'));
  const currentUserId = data?.currentUserId || '';
  const canAssign = Boolean(data?.canAssign);
  const canRun = Boolean(data?.canRun);
  const canSelect = (item: WorkItem) => canRun || item.assignee?.id === currentUserId;
  const selectableIds = openItems.filter(canSelect).map((item) => item.id);
  const openView = pageSlice(openItems, page, pageSize);
  const doneView = pageSlice(doneItems, donePage, pageSize);
  const processView = pageSlice(processes, processPage, pageSize);

  useEffect(() => {
    if (page !== openView.current) setPage(openView.current);
    if (donePage !== doneView.current) setDonePage(doneView.current);
    if (processPage !== processView.current) setProcessPage(processView.current);
  }, [page, donePage, processPage, openView.current, doneView.current, processView.current]);

  useEffect(() => {
    if (loading || !data) return;
    const hash = window.location.hash;
    if (!hash.startsWith('#work-')) return;
    const id = decodeURIComponent(hash.slice('#work-'.length));
    const ordered = byTime(data.items.filter((item) => item.status === 'OPEN'), (item) => item.createdAt, newestFirst);
    const index = ordered.findIndex((item) => item.id === id);
    if (index < 0) return;
    const target = Math.floor(index / pageSize);
    if (page !== target) {
      setPage(target);
      return;
    }
    document.getElementById(`work-${id}`)?.scrollIntoView({ block: 'start' });
  }, [loading, data, newestFirst, page, pageSize]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Work</h1>
          <p className="mt-2 text-gray-600 max-w-3xl">
            Tasks for this construction group. A process is one claimable item, and its tasks stay inside it. Personnel add and assign work.
          </p>
          {availableCount > 0 ? (
            <p className="mt-2 text-sm font-medium text-blue-800">
              {availableCount === 1 ? '1 task is available to claim.' : `${availableCount} tasks are available to claim.`}
            </p>
          ) : null}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setNewestFirst(true)}
              className={`px-3 py-2 min-h-[44px] rounded-md text-sm font-medium ${newestFirst ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-700'}`}
            >
              Newest
            </button>
            <button
              type="button"
              onClick={() => setNewestFirst(false)}
              className={`px-3 py-2 min-h-[44px] rounded-md text-sm font-medium ${newestFirst ? 'border border-gray-300 text-gray-700' : 'bg-blue-600 text-white'}`}
            >
              Oldest
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="block">
              <span className="sr-only">Project</span>
              <select
                value={projectFilter}
                onChange={(event) => {
                  setProjectFilter(event.target.value);
                  setPage(0);
                  setDonePage(0);
                  setSelectedIds([]);
                }}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 min-h-[44px] text-sm text-gray-900"
              >
                <option value="">All projects</option>
                {(data?.projects || []).map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              aria-pressed={overdueOnly}
              onClick={() => {
                setOverdueOnly((current) => !current);
                setPage(0);
                setSelectedIds([]);
              }}
              className={`px-3 py-2 min-h-[44px] rounded-md text-sm font-medium ${overdueOnly ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-700'}`}
            >
              Overdue{overdueCount > 0 ? ` (${overdueCount})` : ''}
            </button>
            <button
              type="button"
              aria-pressed={emailOffOnly}
              onClick={() => {
                setEmailOffOnly((current) => !current);
                setPage(0);
                setSelectedIds([]);
              }}
              className={`px-3 py-2 min-h-[44px] rounded-md text-sm font-medium ${emailOffOnly ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-700'}`}
            >
              Email off{emailOffCount > 0 ? ` (${emailOffCount})` : ''}
            </button>
          </div>
          {emailOffCount > 0 && !emailOffOnly ? (
            <p className="mt-2 text-sm text-gray-700">
              {emailOffCount === 1
                ? '1 open task will not email the requestor when it is marked done.'
                : `${emailOffCount} open tasks will not email the requestor when they are marked done.`}
            </p>
          ) : null}
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
              onClick={() => {
                if (showForm && !editingId) {
                  setShowForm(false);
                  return;
                }
                setEditingId(null);
                setForm(EMPTY_FORM);
                setShowForm(true);
              }}
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

      {showForm && data && (data.canAssign || editingId) && (
        <form id="work-form" onSubmit={onSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{editingId ? 'Edit work' : 'Add work'}</h2>
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
                disabled={form.timingKind === 'PROCESS' || form.timingKind === 'CREW_REQUEST'}
                onChange={(event) => setForm({ ...form, timingKind: event.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 bg-white disabled:bg-gray-100"
              >
                <option value="DEADLINE">Deadline</option>
                <option value="NONE">No deadline</option>
                <option value="PROJECT_DATE">Date on a project</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
                {form.timingKind === 'CREW_REQUEST' && <option value="CREW_REQUEST">Crew request</option>}
                {form.timingKind === 'PROCESS' && <option value="PROCESS">Process</option>}
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
                {(data.projects || []).map((project) => (
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
                {(data.teammates || []).map((person) => (
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
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Save work'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setForm(EMPTY_FORM);
              }}
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
                        {scheduleLabel(process.appliesTo, process.cadence, process.customEvery, process.customUnit)}
                        {' · '}
                        {process.steps.length === 1 ? '1 task' : `${process.steps.length} tasks`}
                        {publishedOn(process.publishedAt) ? ` · Published ${publishedOn(process.publishedAt)}` : ''}
                      </p>
                      {process.purpose && <p className="mt-2 text-sm text-gray-700">{process.purpose}</p>}
                      <StepList steps={process.steps} />
                    </div>
                    {process.appliesTo === 'PROJECT' ? (
                      <Link
                        href="/processes"
                        className="px-3 py-2 min-h-[44px] inline-flex items-center rounded-md border border-gray-300 text-sm font-medium text-gray-900"
                      >
                        Choose project
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled={busyId === process.id}
                        onClick={() => claimProcess(process.id)}
                        className="px-3 py-2 min-h-[44px] rounded-md bg-gray-900 text-white text-sm font-medium disabled:opacity-60"
                      >
                        Claim
                      </button>
                    )}
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
                    {completing ? 'Finishing…' : 'Mark selected finished'}
                  </button>
                  <button
                    type="button"
                    disabled={selectedIds.length === 0}
                    onClick={() => setNotifySelected(false)}
                    className="px-3 py-2 min-h-[44px] rounded-md border border-gray-300 text-sm font-medium text-gray-700 disabled:opacity-60"
                  >
                    Email off
                  </button>
                  <button
                    type="button"
                    disabled={selectedIds.length === 0}
                    onClick={() => setNotifySelected(true)}
                    className="px-3 py-2 min-h-[44px] rounded-md border border-gray-300 text-sm font-medium text-gray-700 disabled:opacity-60"
                  >
                    Email on
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
                  canRun={canRun}
                  busy={busyId === item.id}
                  selected={selectedIds.includes(item.id)}
                  onToggle={canSelect(item) ? (shiftKey) => toggleSelected(item.id, index, shiftKey) : undefined}
                  onClaim={() => claim(item.id)}
                  onStart={() => startWorkItem(item.id)}
                  onDone={() => setStatus(item.id, 'DONE')}
                  onChanged={load}
                  onEmailChange={rememberEmail}
                  onEdit={beginEdit}
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
            {openItems.length === 0 && viewActive && (
              <p className="text-sm text-gray-500">No open tasks match this view.</p>
            )}
            {openItems.length === 0 && !viewActive && processes.length > 0 && (
              <p className="text-sm text-gray-500">No open tasks.</p>
            )}
          </section>

          {doneItems.length > 0 && (
            <details className="bg-white rounded-lg shadow">
              <summary className="cursor-pointer px-5 py-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Finished ({doneItems.length})
              </summary>
              <div className="space-y-3 px-3 pb-4">
                {doneView.slice.map((item) => (
                  <WorkRow
                    key={item.id}
                    item={item}
                    currentUserId={currentUserId}
                    canAssign={canAssign}
                    canRun={canRun}
                    busy={busyId === item.id}
                    onClaim={() => claim(item.id)}
                    onStart={() => startWorkItem(item.id)}
                    onDone={() => setStatus(item.id, 'OPEN')}
                    onChanged={load}
                    onEmailChange={rememberEmail}
                    onEdit={beginEdit}
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

function StepList({
  steps,
  onToggle,
}: {
  steps: Step[];
  onToggle?: (stepId: string, done: boolean) => void;
}) {
  if (steps.length === 0) return null;
  const doneCount = steps.filter((step) => step.done).length;
  const list = (
    <ol className="mt-2 space-y-2 list-decimal pl-5">
      {steps.map((step) => (
        <li key={step.id} className="text-sm text-gray-800">
          <label className="flex items-start gap-2">
            {onToggle && (
              <input
                type="checkbox"
                className="mt-1 h-5 w-5"
                checked={Boolean(step.done)}
                aria-label={step.title}
                onChange={(event) => onToggle(step.id, event.target.checked)}
              />
            )}
            <span>
              <span className={`font-medium ${step.done ? 'line-through text-gray-500' : ''}`}>{step.title}</span>
              <p className="text-gray-600">{step.detail}</p>
              {step.explanation && <p className="text-gray-600">{step.explanation}</p>}
              {step.referenceUrl && (
                <a href={step.referenceUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                  Reference
                </a>
              )}
            </span>
          </label>
        </li>
      ))}
    </ol>
  );
  if (onToggle) {
    return (
      <div className="mt-3">
        <p className="text-sm font-medium text-gray-700">Tasks ({doneCount} of {steps.length})</p>
        {list}
      </div>
    );
  }
  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-sm font-medium text-gray-700">Tasks ({steps.length})</summary>
      {list}
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
        setError(userError(response.status, body.error, 'Could not send the reply'));
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

export function WorkRow({
  item,
  currentUserId,
  canAssign,
  canRun = false,
  busy,
  selected,
  onToggle,
  onClaim,
  onStart,
  onDone,
  onChanged,
  onEmailChange,
  onEdit,
}: {
  item: WorkItem;
  currentUserId: string;
  canAssign: boolean;
  canRun?: boolean;
  busy: boolean;
  selected?: boolean;
  onToggle?: (shiftKey: boolean) => void;
  onClaim: () => void;
  onStart: () => void;
  onDone: () => void;
  onChanged: () => Promise<void>;
  onEmailChange?: (id: string, notifyRequestor: boolean) => void;
  onEdit?: (item: WorkItem) => void;
}) {
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState('');
  const [noteNotice, setNoteNotice] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);
  const canClaim = item.status === 'OPEN' && item.claimable && !item.assignee;
  const canProgress = item.status === 'OPEN' && (canRun || item.assignee?.id === currentUserId);
  const canReopen = item.status === 'DONE' && (canRun || item.assignee?.id === currentUserId);
  const canCheckSteps = item.status === 'OPEN' && (canRun || item.assignee?.id === currentUserId);
  const canRelease = item.status === 'OPEN' && Boolean(item.assignee) && (item.assignee?.id === currentUserId || canRun);
  const doneOn = item.status === 'DONE' ? formatDone(item.completedAt) : '';

  async function toggleStep(stepId: string, done: boolean) {
    setNoteError('');
    const response = await fetch(`/api/v1/work-items/${item.id}/steps/${stepId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setNoteError(userError(response.status, body.error, 'Could not update the step'));
      return;
    }
    await onChanged();
  }

  async function removeItem() {
    setNoteError('');
    const response = await fetch(`/api/v1/work-items/${item.id}`, { method: 'DELETE' });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setNoteError(userError(response.status, body.error, 'Could not remove the work'));
      return;
    }
    await onChanged();
  }

  async function release() {
    setNoteError('');
    const response = await fetch(`/api/v1/work-items/${item.id}/release`, { method: 'POST' });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setNoteError(userError(response.status, body.error, 'Could not return the work to the pool'));
      return;
    }
    setNoteNotice('Returned to the pool. Someone in this group can claim it.');
    await onChanged();
  }

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
        setNoteError(userError(response.status, body.error, 'Could not save the note'));
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
            {item.status === 'OPEN' && isOverdue(item.dueOn) && (
              <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-800">
                Overdue
              </span>
            )}
            {item.claimable && item.status === 'OPEN' && (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                Claimable
              </span>
            )}
            {publishedOn(item.createdAt) && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                Published {publishedOn(item.createdAt)}
              </span>
            )}
            {doneOn && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                Finished {doneOn}
              </span>
            )}
          </div>
          <p className="mt-2 text-gray-700 whitespace-pre-wrap">{item.detail}</p>
          {item.dueOn && formatCalendarDate(item.dueOn) && (
            <p className="mt-2 text-sm text-gray-800">Due date: {formatCalendarDate(item.dueOn)}</p>
          )}
          {item.explanation && (
            <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">{item.explanation}</p>
          )}
          {(item.timingKind === 'CREW_REQUEST' || item.requestorEmail) && (
            <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
              <input
                key={item.notifyRequestor === false ? 'email-off' : 'email-on'}
                type="checkbox"
                checked={item.notifyRequestor !== false && !isAirgappedEmail(item.requestorEmail)}
                disabled={isAirgappedEmail(item.requestorEmail)}
                onChange={async (event) => {
                  const next = event.target.checked;
                  const response = await fetch(`/api/v1/work-items/${item.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ notifyRequestor: next }),
                  });
                  if (!response.ok) return;
                  onEmailChange?.(item.id, next);
                  await onChanged();
                }}
              />
              {isAirgappedEmail(item.requestorEmail)
                ? 'This address is on the Bethel network and cannot be emailed'
                : 'Email the requestor when this is finished'}
            </label>
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
          <StepList steps={item.steps || []} onToggle={canCheckSteps ? toggleStep : undefined} />
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
          {item.canEdit && onEdit && (
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="px-3 py-2 min-h-[44px] rounded-md border border-gray-300 text-sm font-medium text-gray-700"
            >
              Edit
            </button>
          )}
          {item.canEdit && !confirmRemove && (
            <button
              type="button"
              onClick={() => setConfirmRemove(true)}
              className="px-3 py-2 min-h-[44px] rounded-md border border-red-300 text-sm font-medium text-red-800"
            >
              Remove
            </button>
          )}
          {item.canEdit && confirmRemove && (
            <button
              type="button"
              onClick={() => { removeItem().catch(() => undefined); }}
              className="px-3 py-2 min-h-[44px] rounded-md bg-red-700 text-white text-sm font-medium"
            >
              Remove this task
            </button>
          )}
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
          {canProgress && !item.startedAt && (
            <button
              type="button"
              disabled={busy}
              onClick={onStart}
              className="px-3 py-2 min-h-[44px] rounded-md bg-gray-900 text-white text-sm font-medium disabled:opacity-60"
            >
              Start
            </button>
          )}
          {canProgress && item.startedAt && (
            <button
              type="button"
              disabled={busy}
              onClick={onDone}
              className="px-3 py-2 min-h-[44px] rounded-md border border-gray-300 text-sm font-medium text-gray-700 disabled:opacity-60"
            >
              Finished
            </button>
          )}
          {canRelease && (
            <button
              type="button"
              disabled={busy}
              onClick={() => { release().catch(() => undefined); }}
              className="px-3 py-2 min-h-[44px] rounded-md border border-gray-300 text-sm font-medium text-gray-700 disabled:opacity-60"
            >
              Return to pool
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
