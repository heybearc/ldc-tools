'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ListChecks } from 'lucide-react';
import { scheduleLabel, taskInstructions, type ProcessAppliesTo, type ProcessCadence } from '@/lib/processes';
import { userError } from '@/lib/user-error';

interface Task {
  title: string;
  instructions: string;
  referenceUrl: string;
}

interface Template {
  id: string;
  name: string;
  purpose: string | null;
  appliesTo: ProcessAppliesTo;
  cadence: ProcessCadence;
  steps: Array<{
    id: string;
    title: string;
    detail: string;
    explanation: string | null;
    referenceUrl: string | null;
  }>;
}

const EMPTY_TASK: Task = { title: '', instructions: '', referenceUrl: '' };

export default function ProcessesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [canPost, setCanPost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [appliesTo, setAppliesTo] = useState<ProcessAppliesTo>('TEAM');
  const [cadence, setCadence] = useState<ProcessCadence>('MONTHLY');
  const [tasks, setTasks] = useState<Task[]>([{ ...EMPTY_TASK }]);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [projectChoice, setProjectChoice] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const response = await fetch('/api/v1/processes', { cache: 'no-store' });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(userError(response.status, body.error, 'Could not load processes'));
        return;
      }
      setTemplates(body.templates || []);
      setProjects(body.projects || []);
      setCanPost(Boolean(body.canPost));
    } catch {
      setError(userError(0, '', 'Could not load processes'));
    } finally {
      setLoading(false);
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

  function updateTask(index: number, patch: Partial<Task>) {
    setTasks((current) => current.map((task, i) => (i === index ? { ...task, ...patch } : task)));
  }

  function chooseScope(next: ProcessAppliesTo) {
    setAppliesTo(next);
    setCadence(next === 'TEAM' ? 'MONTHLY' : cadence === 'WEEKLY' ? 'WEEKLY' : 'ONCE');
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/v1/processes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          purpose,
          appliesTo,
          cadence: appliesTo === 'TEAM' ? 'MONTHLY' : cadence,
          steps: tasks.map((task) => ({
            title: task.title,
            detail: task.instructions,
            referenceUrl: task.referenceUrl || null,
          })),
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(userError(response.status, body.error, 'Could not add the process'));
        return;
      }
      setName('');
      setPurpose('');
      setAppliesTo('TEAM');
      setCadence('MONTHLY');
      setTasks([{ ...EMPTY_TASK }]);
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function start(template: Template) {
    setBusyId(template.id);
    setError('');
    setNotice('');
    const projectId = projectChoice[template.id] || '';
    if (template.appliesTo === 'PROJECT' && !projectId) {
      setError('Choose a project for this process');
      setBusyId(null);
      return;
    }
    try {
      const response = await fetch(`/api/v1/processes/${template.id}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: template.appliesTo === 'PROJECT' ? projectId : null }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(userError(response.status, body.error, 'Could not start the process'));
        return;
      }
      const projectName = projects.find((project) => project.id === projectId)?.name;
      setNotice(
        template.appliesTo === 'PROJECT' && projectName
          ? `Added to ${projectName}. It is on Work and can be claimed.`
          : 'Added to Work. It is monthly for the team and can be claimed.',
      );
    } catch {
      setError(userError(0, '', 'Could not start the process'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Processes</h1>
          <p className="mt-2 text-gray-600 max-w-3xl">
            Templates for this construction group. A team process is monthly and goes on Work with no project.
            A project process is once or weekly, and you choose the project when you start it. The tasks stay on that one work item.
          </p>
        </div>
        {canPost && (
          <button
            type="button"
            onClick={() => setShowForm((open) => !open)}
            className="px-4 py-2 min-h-[44px] rounded-md bg-blue-600 text-white text-sm font-medium"
          >
            Add process
          </button>
        )}
      </div>

      {error && <p className="rounded-md bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</p>}
      {notice && (
        <p className="rounded-md bg-green-50 text-green-800 px-4 py-3 text-sm">
          {notice}{' '}
          <Link href="/work" className="font-medium underline">Open Work</Link>
        </p>
      )}

      {showForm && canPost && (
        <form onSubmit={onSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Name</span>
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Monthly safety walk"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Purpose</span>
            <textarea
              rows={2}
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
              placeholder="Why the team runs this, and when it is finished"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
          <fieldset>
            <legend className="text-sm font-medium text-gray-700">Where it applies</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {([
                ['TEAM', 'Team'],
                ['PROJECT', 'Project'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => chooseScope(value)}
                  className={`px-4 py-2 min-h-[44px] rounded-md border text-sm font-medium ${
                    appliesTo === value ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-gray-300 text-gray-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {appliesTo === 'TEAM'
                ? 'Monthly work for the construction group. It is not tied to a project.'
                : 'Runs on one project. Choose once or weekly.'}
            </p>
          </fieldset>
          {appliesTo === 'PROJECT' && (
            <fieldset>
              <legend className="text-sm font-medium text-gray-700">How often</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {([
                  ['ONCE', 'Once'],
                  ['WEEKLY', 'Weekly'],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCadence(value)}
                    className={`px-4 py-2 min-h-[44px] rounded-md border text-sm font-medium ${
                      cadence === value ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-gray-300 text-gray-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          {tasks.map((task, index) => (
            <div key={index} className="space-y-3 border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-gray-700">Task {index + 1}</span>
                {tasks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setTasks((current) => current.filter((_, i) => i !== index))}
                    className="text-sm text-gray-600 underline"
                  >
                    Remove
                  </button>
                )}
              </div>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Title</span>
                <input
                  required
                  value={task.title}
                  onChange={(event) => updateTask(index, { title: event.target.value })}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Instructions</span>
                <textarea
                  rows={2}
                  value={task.instructions}
                  onChange={(event) => updateTask(index, { instructions: event.target.value })}
                  placeholder="What done looks like"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>
              <label className="block max-w-xl">
                <span className="text-sm font-medium text-gray-700">Reference link</span>
                <input
                  type="url"
                  value={task.referenceUrl}
                  onChange={(event) => updateTask(index, { referenceUrl: event.target.value })}
                  placeholder="https://"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTasks((current) => [...current, { ...EMPTY_TASK }])}
              className="px-4 py-2 min-h-[44px] rounded-md border border-gray-300 text-sm"
            >
              Add task
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 min-h-[44px] rounded-md bg-blue-600 text-white text-sm font-medium disabled:opacity-60"
            >
              Save process
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Loading processes…</p>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
          <ListChecks className="h-8 w-8 mx-auto text-gray-400 mb-3" />
          No processes for this construction group.
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <article key={template.id} className="bg-white rounded-lg shadow p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">{template.name}</h2>
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                  {scheduleLabel(template.appliesTo, template.cadence)}
                </span>
              </div>
              {template.purpose && <p className="mt-2 text-sm text-gray-700">{template.purpose}</p>}
              <ol className="mt-3 space-y-2 list-decimal pl-5">
                {template.steps.map((step) => {
                  const instructions = taskInstructions(step.detail, step.explanation);
                  return (
                    <li key={step.id} className="text-sm text-gray-800">
                      <span className="font-medium">{step.title}</span>
                      {instructions && <p className="text-gray-600 whitespace-pre-wrap">{instructions}</p>}
                      {step.referenceUrl && (
                        <a href={step.referenceUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                          Reference
                        </a>
                      )}
                    </li>
                  );
                })}
              </ol>
              {canPost && (
                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  {template.appliesTo === 'PROJECT' && (
                    <select
                      value={projectChoice[template.id] || ''}
                      onChange={(event) => setProjectChoice({ ...projectChoice, [template.id]: event.target.value })}
                      className="rounded-md border border-gray-300 px-3 py-2 bg-white text-sm min-h-[44px]"
                      aria-label={`Project for ${template.name}`}
                    >
                      <option value="">Choose a project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    disabled={busyId === template.id}
                    onClick={() => start(template)}
                    className="px-4 py-2 min-h-[44px] rounded-md bg-blue-600 text-white text-sm font-medium disabled:opacity-60"
                  >
                    {template.appliesTo === 'PROJECT' ? 'Add to project' : 'Add to work'}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
