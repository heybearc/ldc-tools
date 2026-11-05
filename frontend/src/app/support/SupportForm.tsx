'use client';

import { useState } from 'react';

export default function SupportForm() {
  const [kind, setKind] = useState<'access' | 'help'>('access');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [company, setCompany] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/v1/public/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, name, email, message, company }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof body.error === 'string' ? body.error : 'Could not send that. Try again in a moment.');
        return;
      }
      setSent(true);
    } catch {
      setError('Could not send that. Check the connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return <p className="text-gray-700">Sent. An administrator will reply to the email you entered.</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-800">
          <input type="radio" name="kind" checked={kind === 'access'} onChange={() => setKind('access')} />
          Request access
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-800">
          <input type="radio" name="kind" checked={kind === 'help'} onChange={() => setKind('help')} />
          Account help
        </label>
      </div>
      <label className="block text-sm font-semibold text-gray-800">
        Name
        <input value={name} onChange={(event) => setName(event.target.value)} required className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
      </label>
      <label className="block text-sm font-semibold text-gray-800">
        Email
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
      </label>
      <label className="block text-sm font-semibold text-gray-800">
        Message
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} required minLength={8} rows={5} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
      </label>
      <label className="hidden" aria-hidden="true">
        Company
        <input tabIndex={-1} autoComplete="off" value={company} onChange={(event) => setCompany(event.target.value)} />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button type="submit" disabled={busy} className="rounded-md bg-blue-800 px-4 py-2 font-semibold text-white disabled:opacity-60">
        {busy ? 'Sending…' : 'Send'}
      </button>
    </form>
  );
}
