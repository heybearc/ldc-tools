'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { announcementLinkLabel } from '@/lib/announcement-link';
import { groupReferences, referenceMatches } from '@/lib/references';
import { userError } from '@/lib/user-error';

interface ReferenceLink {
  id: string;
  title: string;
  url: string;
  note: string | null;
  category: string;
}

const EMPTY = { title: '', url: '', note: '', category: '' };

export default function ReferencesPage() {
  const [links, setLinks] = useState<ReferenceLink[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const response = await fetch('/api/v1/references', { cache: 'no-store' });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(userError(response.status, body.error, 'Could not load references'));
        return;
      }
      setLinks(body.links || []);
      setCanManage(Boolean(body.canManage));
    } catch {
      setError(userError(0, '', 'Could not load references'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const onGroupChange = () => {
      setLoading(true);
      setCategory('All');
      load();
    };
    window.addEventListener('cg-filter-changed', onGroupChange);
    return () => window.removeEventListener('cg-filter-changed', onGroupChange);
  }, [load]);

  const categories = useMemo(() => {
    const names = Array.from(new Set(links.map((link) => link.category)));
    return ['All', ...groupReferences([...names].map((name) => ({ category: name, title: name }))).map((group) => group.category)];
  }, [links]);

  const visible = useMemo(() => {
    const filtered = links.filter((link) => {
      if (category !== 'All' && link.category !== category) return false;
      return referenceMatches(link, query);
    });
    return groupReferences(filtered);
  }, [links, category, query]);

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY);
  }

  function editLink(link: ReferenceLink) {
    setEditingId(link.id);
    setForm({
      title: link.title,
      url: link.url,
      note: link.note || '',
      category: link.category === 'General' ? '' : link.category,
    });
    setShowForm(true);
    setError('');
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch(editingId ? `/api/v1/references/${editingId}` : '/api/v1/references', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          url: form.url,
          note: form.note,
          category: form.category,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(userError(response.status, body.error, 'Could not save the reference'));
        return;
      }
      resetForm();
      setShowForm(false);
      await load();
    } catch {
      setError(userError(0, '', 'Could not save the reference'));
    } finally {
      setSaving(false);
    }
  }

  async function removeLink(link: ReferenceLink) {
    if (!window.confirm(`Remove ${link.title} from this list?`)) return;
    setError('');
    try {
      const response = await fetch(`/api/v1/references/${link.id}`, { method: 'DELETE' });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(userError(response.status, body.error, 'Could not remove the reference'));
        return;
      }
      if (editingId === link.id) {
        resetForm();
        setShowForm(false);
      }
      await load();
    } catch {
      setError(userError(0, '', 'Could not remove the reference'));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">References</h1>
          <p className="mt-2 text-gray-600 max-w-3xl">
            Shared links for this construction group. Forms, documents, and sites the team uses stay here. A task link and a chat link stay on that item.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => {
              if (showForm) resetForm();
              setShowForm((open) => !open);
            }}
            className="px-4 py-2 min-h-[44px] rounded-md bg-blue-600 text-white text-sm font-medium"
          >
            Add link
          </button>
        )}
      </div>

      {error && <p className="rounded-md bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</p>}

      {showForm && canManage && (
        <form onSubmit={onSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
          <p className="text-sm text-gray-600">
            {editingId ? 'Editing this link. The rest of the team sees the change right away.' : 'Add a link the whole construction group can open.'}
          </p>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Title</span>
            <input
              required
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Crew request form"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Web address</span>
            <input
              required
              type="url"
              value={form.url}
              onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
              placeholder="https://"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Category</span>
            <input
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              placeholder="Forms"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Note</span>
            <textarea
              value={form.note}
              onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
              rows={3}
              placeholder="When to use this link"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 min-h-[44px] rounded-md bg-blue-600 text-white text-sm font-medium disabled:opacity-60">
              {saving ? 'Saving' : editingId ? 'Save changes' : 'Save link'}
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="px-4 py-2 min-h-[44px] rounded-md border border-gray-300 text-sm font-medium text-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search titles, notes, or sites"
          className="w-full sm:max-w-sm rounded-md border border-gray-300 px-3 py-2"
          aria-label="Search references"
        />
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setCategory(name)}
                className={`px-3 py-2 min-h-[44px] rounded-md text-sm font-medium ${category === name ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-700'}`}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? <p className="text-sm text-gray-600">Loading references</p> : null}
      {!loading && visible.length === 0 ? (
        <p className="rounded-lg bg-white shadow px-6 py-8 text-gray-600">
          {links.length === 0
            ? 'No links yet. Personnel can add the forms, documents, and sites this group uses.'
            : 'No links match that search.'}
        </p>
      ) : null}

      {visible.map((group) => (
        <section key={group.category} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{group.category}</h2>
          <ul className="bg-white rounded-lg shadow divide-y divide-gray-100">
            {group.links.map((link) => (
              <li key={link.id} className="px-4 py-4 sm:px-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-base font-semibold text-blue-800 hover:underline break-words">
                    {link.title}
                  </a>
                  <p className="text-sm text-gray-500">{announcementLinkLabel(link.url)}</p>
                  {link.note ? <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{link.note}</p> : null}
                </div>
                {canManage && (
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => editLink(link)} className="px-3 py-2 min-h-[44px] rounded-md border border-gray-300 text-sm font-medium text-gray-700">
                      Edit
                    </button>
                    <button type="button" onClick={() => removeLink(link)} className="px-3 py-2 min-h-[44px] rounded-md border border-red-200 text-sm font-medium text-red-700">
                      Remove
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
