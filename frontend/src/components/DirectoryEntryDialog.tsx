'use client';

import React, { useMemo, useState } from 'react';
import { dateInputValue } from '@/lib/directory-assignments';

type TeamOption = {
  id: string;
  name: string;
  crews: { id: string; name: string }[];
};

type EntryUser = {
  id: string;
  name: string | null;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
};

export type DirectoryEditTarget = {
  id: string;
  role: string;
  startDate?: string | null;
  endDate?: string | null;
  tradeTeamId: string;
  crewId: string | null;
  user: EntryUser;
};

const TEAM_ROLES = [
  { value: 'TTO', label: 'TTO' },
  { value: 'TTOA', label: 'TTOA' },
  { value: 'TT_SUPPORT', label: 'TT Support' },
];
const CREW_ROLES = [
  { value: 'TCO', label: 'TCO' },
  { value: 'TCOA', label: 'TCOA' },
  { value: 'TC_SUPPORT', label: 'TC Support' },
];

function nameParts(user: EntryUser) {
  if (user.firstName || user.lastName) {
    return { firstName: user.firstName || '', lastName: user.lastName || '' };
  }
  const parts = (user.name || '').trim().split(/\s+/);
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') };
}

export default function DirectoryEntryDialog({
  mode,
  entry,
  teams,
  onClose,
  onSaved,
}: {
  mode: 'add' | 'edit';
  entry: DirectoryEditTarget | null;
  teams: TeamOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const initialName = entry ? nameParts(entry.user) : { firstName: '', lastName: '' };
  const [firstName, setFirstName] = useState(initialName.firstName);
  const [lastName, setLastName] = useState(initialName.lastName);
  const [email, setEmail] = useState(entry?.user.email || '');
  const [phone, setPhone] = useState(entry?.user.phone || '');
  const [tradeTeamId, setTradeTeamId] = useState(entry?.tradeTeamId || teams[0]?.id || '');
  const [crewId, setCrewId] = useState(entry?.crewId || '');
  const [role, setRole] = useState(entry?.role || (entry?.crewId ? 'TCO' : 'TTO'));
  const [startDate, setStartDate] = useState(dateInputValue(entry?.startDate) || dateInputValue(new Date()));
  const [endDate, setEndDate] = useState(dateInputValue(entry?.endDate));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crews = useMemo(
    () => teams.find((team) => team.id === tradeTeamId)?.crews || [],
    [teams, tradeTeamId]
  );
  const roles = crewId ? CREW_ROLES : TEAM_ROLES;

  async function save() {
    setSaving(true);
    setError(null);
    const payload = {
      id: entry?.id,
      scope: crewId ? 'crew' : 'team',
      firstName,
      lastName,
      email,
      phone,
      role,
      tradeTeamId,
      crewId: crewId || null,
      startDate,
      endDate,
    };
    const response = await fetch('/api/v1/trade-teams/directory', {
      method: mode === 'add' ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(data.error || 'Save failed');
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:hidden">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="border-b px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {mode === 'add' ? 'Add person' : 'Edit entry'}
          </h2>
        </div>
        <div className="space-y-3 px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-gray-700">
              First name
              <input className="mt-1 w-full rounded border px-2 py-2" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
            </label>
            <label className="text-sm text-gray-700">
              Last name
              <input className="mt-1 w-full rounded border px-2 py-2" value={lastName} onChange={(event) => setLastName(event.target.value)} />
            </label>
          </div>
          <label className="block text-sm text-gray-700">
            Email
            <input className="mt-1 w-full rounded border px-2 py-2" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="block text-sm text-gray-700">
            Phone
            <input className="mt-1 w-full rounded border px-2 py-2" value={phone || ''} onChange={(event) => setPhone(event.target.value)} />
          </label>
          {mode === 'add' && (
            <>
              <label className="block text-sm text-gray-700">
                Trade
                <select
                  className="mt-1 w-full rounded border px-2 py-2"
                  value={tradeTeamId}
                  onChange={(event) => {
                    setTradeTeamId(event.target.value);
                    setCrewId('');
                    setRole('TTO');
                  }}
                >
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-gray-700">
                Crew
                <select
                  className="mt-1 w-full rounded border px-2 py-2"
                  value={crewId}
                  onChange={(event) => {
                    const next = event.target.value;
                    setCrewId(next);
                    setRole(next ? 'TCO' : 'TTO');
                  }}
                >
                  <option value="">Team level</option>
                  {crews.map((crew) => (
                    <option key={crew.id} value={crew.id}>{crew.name}</option>
                  ))}
                </select>
              </label>
            </>
          )}
          <label className="block text-sm text-gray-700">
            Role
            <select className="mt-1 w-full rounded border px-2 py-2" value={role} onChange={(event) => setRole(event.target.value)}>
              {roles.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-gray-700">
              Start date
              <input type="date" className="mt-1 w-full rounded border px-2 py-2" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </label>
            <label className="text-sm text-gray-700">
              End date
              <input type="date" className="mt-1 w-full rounded border px-2 py-2" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </label>
          </div>
          <p className="text-xs text-gray-500">
            An end date deactivates this person. They stay on the directory until someone else in the same role is added with a start date.
          </p>
          {error && <p className="text-sm text-red-700">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t px-5 py-4">
          <button type="button" className="rounded border px-3 py-2 text-sm" onClick={onClose}>Cancel</button>
          <button type="button" className="rounded bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-50" disabled={saving} onClick={save}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
