'use client';

import { Copy } from 'lucide-react';
import ProfilePhoto from '@/components/ProfilePhoto';
import { directoryPersonName, type DirectoryUser } from '@/components/DirectoryTeamCard';

export type DirectoryContact = {
  id: string;
  role: string;
  roleLabel: string;
  user: DirectoryUser;
};

export type DirectoryGroups = {
  personnel: {
    contact: DirectoryContact[];
    assistant: DirectoryContact[];
    support: DirectoryContact[];
  };
  ancillary: { role: string; people: DirectoryContact[] }[];
};

function PersonLine({ person }: { person: DirectoryContact }) {
  const name = directoryPersonName(person.user);
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      {person.user.image ? (
        <ProfilePhoto
          src={person.user.image}
          className="h-7 w-7 rounded-full object-cover flex-shrink-0 bg-gray-200"
        />
      ) : null}
      <span className="truncate text-gray-900">{name}</span>
      {person.user.email && (
        <button
          type="button"
          title="Copy email"
          className="text-gray-400 hover:text-gray-700"
          onClick={() => navigator.clipboard.writeText(person.user.email)}
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function matches(person: DirectoryContact, query: string) {
  if (!query) return true;
  const haystack = `${person.user.name || ''} ${person.user.email || ''} ${person.roleLabel} ${person.role}`.toLowerCase();
  return haystack.includes(query);
}

export function filterDirectoryGroups(groups: DirectoryGroups, query: string): DirectoryGroups {
  const q = query.trim().toLowerCase();
  return {
    personnel: {
      contact: groups.personnel.contact.filter((person) => matches(person, q)),
      assistant: groups.personnel.assistant.filter((person) => matches(person, q)),
      support: groups.personnel.support.filter((person) => matches(person, q)),
    },
    ancillary: groups.ancillary
      .map((group) => ({
        role: group.role,
        people: group.people.filter((person) => matches(person, q) || group.role.toLowerCase().includes(q)),
      }))
      .filter((group) => group.people.length > 0),
  };
}

export function directoryGroupsHavePeople(groups: DirectoryGroups) {
  return (
    groups.personnel.contact.length
    + groups.personnel.assistant.length
    + groups.personnel.support.length
    + groups.ancillary.reduce((sum, group) => sum + group.people.length, 0)
  ) > 0;
}

export default function DirectoryPeople({ groups }: { groups: DirectoryGroups }) {
  const columns = [
    { label: 'Contact', people: groups.personnel.contact },
    { label: 'Assistant', people: groups.personnel.assistant },
    { label: 'Support', people: groups.personnel.support },
  ];

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="bg-slate-700 text-white p-3">
          <h2 className="font-bold text-lg">Construction group</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3">
          {columns.map((column) => (
            <div key={column.label}>
              <div className="text-xs font-medium text-gray-600 mb-1">{column.label}</div>
              {column.people.length === 0 ? (
                <span className="text-sm text-gray-400">—</span>
              ) : (
                <div className="flex flex-col gap-1 text-sm">
                  {column.people.map((person) => (
                    <PersonLine key={person.id} person={person} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="bg-stone-600 text-white p-3">
          <h2 className="font-bold text-lg">Ancillary</h2>
        </div>
        {groups.ancillary.length === 0 ? (
          <p className="p-3 text-sm text-gray-400">—</p>
        ) : (
          <div className="divide-y">
            {groups.ancillary.map((group) => (
              <div key={group.role} className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-3 text-sm">
                <div className="font-medium text-gray-800">{group.role}</div>
                <div className="sm:col-span-3 flex flex-col gap-1">
                  {group.people.map((person) => (
                    <PersonLine key={person.id} person={person} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
