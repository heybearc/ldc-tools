'use client';

import React, { useMemo, useRef, useState } from 'react';
import { dateInputValue } from '@/lib/directory-assignments';
import { PhotoPositioner, type PhotoPositionHandle } from '@/components/ProfilePhoto';

type TeamOption = {
  id: string;
  name: string;
  crews: { id: string; name: string }[];
};

type EntryUser = {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  isSister?: boolean;
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

function supportRole(hasCrew: boolean) {
  return hasCrew ? 'TC_SUPPORT' : 'TT_SUPPORT';
}

function roleForScope(hasCrew: boolean, sister: boolean, current: string) {
  const allowed = sister
    ? [supportRole(hasCrew)]
    : (hasCrew ? CREW_ROLES : TEAM_ROLES).map((item) => item.value);
  return allowed.includes(current) ? current : allowed[0];
}

async function readProfilePhoto(file: File) {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file');
  const bitmap = await createImageBitmap(file);
  try {
    const max = 1200;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not read that photo');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    if (dataUrl.length > 1_500_000) throw new Error('That photo is too large');
    return dataUrl;
  } finally {
    bitmap.close();
  }
}

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
  defaults,
  teams,
  onClose,
  onSaved,
}: {
  mode: 'add' | 'edit';
  entry: DirectoryEditTarget | null;
  defaults?: { tradeTeamId?: string; crewId?: string | null };
  teams: TeamOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const initialName = entry ? nameParts(entry.user) : { firstName: '', lastName: '' };
  const initialCrew = entry?.crewId || defaults?.crewId || '';
  const initialTeam = entry?.tradeTeamId || defaults?.tradeTeamId || teams[0]?.id || '';
  const [firstName, setFirstName] = useState(initialName.firstName);
  const [lastName, setLastName] = useState(initialName.lastName);
  const [email, setEmail] = useState(entry?.user.email || '');
  const [phone, setPhone] = useState(entry?.user.phone || '');
  const [image, setImage] = useState<string | null>(entry?.user.image || null);
  const [photoAdjusted, setPhotoAdjusted] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const positionerRef = useRef<PhotoPositionHandle>(null);
  const [isSister, setIsSister] = useState(entry?.user.isSister === true);
  const [tradeTeamId, setTradeTeamId] = useState(initialTeam);
  const [crewId, setCrewId] = useState(initialCrew);
  const [role, setRole] = useState(
    roleForScope(Boolean(initialCrew), entry?.user.isSister === true, entry?.role || (initialCrew ? 'TCO' : 'TTO'))
  );
  const [startDate, setStartDate] = useState(dateInputValue(entry?.startDate) || dateInputValue(new Date()));
  const [endDate, setEndDate] = useState(dateInputValue(entry?.endDate));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crews = useMemo(
    () => teams.find((team) => team.id === tradeTeamId)?.crews || [],
    [teams, tradeTeamId]
  );
  const roles = (crewId ? CREW_ROLES : TEAM_ROLES).filter((item) => !isSister || item.value === supportRole(Boolean(crewId)));

  async function save() {
    setSaving(true);
    setError(null);
    let nextImage = image;
    if (image && photoAdjusted && positionerRef.current) {
      try {
        nextImage = positionerRef.current.exportCrop();
        if (nextImage.length > 400_000) {
          setSaving(false);
          setError('That crop is too large. Zoom out a little and try again.');
          return;
        }
      } catch {
        setSaving(false);
        setError('Could not crop that photo. Replace it and position it again.');
        return;
      }
    }
    const payload = {
      id: entry?.id,
      scope: crewId ? 'crew' : 'team',
      firstName,
      lastName,
      email,
      phone,
      image: nextImage,
      isSister,
      role,
      tradeTeamId,
      crewId: crewId || null,
      originScope: entry?.crewId ? 'crew' : 'team',
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
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-xl">
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
          <div className="flex items-start gap-4">
            {image ? (
              <PhotoPositioner ref={positionerRef} src={image} onAdjust={() => setPhotoAdjusted(true)} />
            ) : (
              <div className="h-40 w-40 rounded-full bg-gray-200" />
            )}
            <div className="pt-2 text-sm">
              <label className="font-medium text-blue-700 hover:underline cursor-pointer">
                {image ? 'Replace photo' : 'Add photo'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (!file) return;
                    setPhotoError(null);
                    readProfilePhoto(file)
                      .then((next) => {
                        setImage(next);
                        setPhotoAdjusted(true);
                      })
                      .catch((err) => setPhotoError(err instanceof Error ? err.message : 'Could not read that photo'));
                  }}
                />
              </label>
              {image && (
                <button
                  type="button"
                  className="mt-2 block text-gray-500 hover:text-gray-800"
                  onClick={() => {
                    setImage(null);
                    setPhotoAdjusted(true);
                  }}
                >
                  Remove
                </button>
              )}
              {photoError && <p className="mt-1 text-red-700">{photoError}</p>}
            </div>
          </div>
          <label className="block text-sm text-gray-700">
            Email
            <input className="mt-1 w-full rounded border px-2 py-2" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="block text-sm text-gray-700">
            Phone
            <input className="mt-1 w-full rounded border px-2 py-2" value={phone || ''} onChange={(event) => setPhone(event.target.value)} />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={isSister}
              onChange={(event) => {
                const sister = event.target.checked;
                setIsSister(sister);
                setRole(roleForScope(Boolean(crewId), sister, role));
              }}
            />
            Sister
          </label>
          <p className="text-xs text-gray-500">Sisters can only be Support.</p>
          <label className="block text-sm text-gray-700">
            Trade
            <select
              className="mt-1 w-full rounded border px-2 py-2"
              value={tradeTeamId}
              onChange={(event) => {
                setTradeTeamId(event.target.value);
                setCrewId('');
                setRole(roleForScope(false, isSister, role));
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
                setRole(roleForScope(Boolean(next), isSister, role));
              }}
            >
              <option value="">Team level</option>
              {crews.map((crew) => (
                <option key={crew.id} value={crew.id}>{crew.name}</option>
              ))}
            </select>
          </label>
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
