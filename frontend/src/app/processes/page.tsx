'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ListChecks } from 'lucide-react';

interface Step {
  id?: string;
  title: string;
  detail: string;
  explanation: string;
  referenceUrl: string;
}

interface Template {
  id: string;
  name: string;
  steps: Array<{
    id: string;
    title: string;
    detail: string;
    explanation: string | null;
    referenceUrl: string | null;
  }>;
}

const EMPTY_STEP: Step = { title: '', detail: '', explanation: '', referenceUrl: '' };

export default function ProcessesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [canPost, setCanPost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [steps, setSteps] = useState<Step[]>([{ ...EMPTY_STEP }]);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [projectChoice, setProjectChoice] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setError('');
    const response = await fetch('/api/v1/processes', { cache: 'no-store' });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error || 'Failed to load processes');
      setLoading(false);
      return;
    }
    setTemplates(body.templates || []);
    setProjects(body.projects || []);
    setCanPost(Boolean(body.canPost));
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

  function updateStep(index: number, patch: Partial<Step>) {
    setSteps((current) => current.map((step, i) => (i === index ? { ...step, ...patch } : step)));
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
          steps: steps.map((step) => ({
            title: step.title,
            detail: step.detail,
            explanation: step.explanation || null,
            referenceUrl: step.referenceUrl || null,
          })),
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || 'Failed to add a process');
        return;
      }
      setName('');
      setSteps([{ ...EMPTY_STEP }]);
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function start(templateId: string) {
    setBusyId(templateId);
    setError('');
    try {
      const response = await fetch(`/api/v1/processes/${templateId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: projectChoice[templateId] || null }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || 'Failed to start the process');
        return;
      }
      setProjectChoice((current) => ({ ...current, [templateId]: '' }));
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
            A checklist for this construction group. Starting it adds one claimable process to the work list. The steps stay inside that process.
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

      {showForm && canPost && (
        <form onSubmit={onSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Name</span>
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
          {steps.map((step, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-gray-100 pt-4">
              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-gray-700">Step title</span>
                <input
                  required
                  value={step.title}
                  onChange={(event) => updateStep(index, { title: event.target.value })}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-gray-700">Detail</span>
                <textarea
                  required
                  rows={2}
                  value={step.detail}
                  onChange={(event) => updateStep(index, { detail: event.target.value })}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-gray-700">Explanation</span>
                <textarea
                  rows={2}
                  value={step.explanation}
                  onChange={(event) => updateStep(index, { explanation: event.target.value })}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Reference link</span>
                <input
                  type="url"
                  value={step.referenceUrl}
                  onChange={(event) => updateStep(index, { referenceUrl: event.target.value })}
                  placeholder="https://"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSteps((current) => [...current, { ...EMPTY_STEP }])}
              className="px-4 py-2 min-h-[44px] rounded-md border border-gray-300 text-sm"
            >
              Add step
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
              <h2 className="text-lg font-semibold text-gray-900">{template.name}</h2>
              <ol className="mt-3 space-y-2 list-decimal pl-5">
                {template.steps.map((step) => (
                  <li key={step.id} className="text-sm text-gray-800">
                    <span className="font-medium">{step.title}</span>
                    <p className="text-gray-600">{step.detail}</p>
                    {step.explanation && <p className="text-gray-600">{step.explanation}</p>}
                  </li>
                ))}
              </ol>
              {canPost && (
                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <select
                    value={projectChoice[template.id] || ''}
                    onChange={(event) => setProjectChoice({ ...projectChoice, [template.id]: event.target.value })}
                    className="rounded-md border border-gray-300 px-3 py-2 bg-white text-sm min-h-[44px]"
                    aria-label={`Project for ${template.name}`}
                  >
                    <option value="">No project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={busyId === template.id}
                    onClick={() => start(template.id)}
                    className="px-4 py-2 min-h-[44px] rounded-md bg-blue-600 text-white text-sm font-medium disabled:opacity-60"
                  >
                    Start
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
