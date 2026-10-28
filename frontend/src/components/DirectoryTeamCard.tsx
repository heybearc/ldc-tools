'use client';

import Link from 'next/link';
import { Copy } from 'lucide-react';

export const directoryTeamColors = [
  { bg: 'bg-green-600', header: 'bg-green-700', light: 'bg-green-50', border: 'border-green-200' },
  { bg: 'bg-blue-600', header: 'bg-blue-700', light: 'bg-blue-50', border: 'border-blue-200' },
  { bg: 'bg-purple-600', header: 'bg-purple-700', light: 'bg-purple-50', border: 'border-purple-200' },
  { bg: 'bg-orange-600', header: 'bg-orange-700', light: 'bg-orange-50', border: 'border-orange-200' },
  { bg: 'bg-teal-600', header: 'bg-teal-700', light: 'bg-teal-50', border: 'border-teal-200' },
  { bg: 'bg-pink-600', header: 'bg-pink-700', light: 'bg-pink-50', border: 'border-pink-200' },
  { bg: 'bg-indigo-600', header: 'bg-indigo-700', light: 'bg-indigo-50', border: 'border-indigo-200' },
  { bg: 'bg-amber-600', header: 'bg-amber-700', light: 'bg-amber-50', border: 'border-amber-200' },
];

export interface DirectoryUser {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  isSister?: boolean;
}

export interface DirectoryAssignment {
  id: string;
  role: string;
  isActive?: boolean;
  awaitingReplacement?: boolean;
  startDate?: string | null;
  endDate?: string | null;
  user: DirectoryUser;
}

export interface DirectoryCrew {
  id: string;
  name: string;
  description?: string | null;
  scopeOfWork?: string | null;
  isRequired?: boolean;
  status?: string;
  oversight: DirectoryAssignment[];
}

export interface DirectoryTeam {
  id: string;
  name: string;
  description?: string | null;
  crews: DirectoryCrew[];
  oversight: DirectoryAssignment[];
}

export function assignmentsForRole(oversight: DirectoryAssignment[], role: string) {
  return oversight.filter((row) => row.role === role);
}

export function directoryPersonName(user: { name: string | null; email: string }) {
  return user.name || user.email.split('@')[0];
}

export function OversightNames({
  assignments,
  onEdit,
}: {
  assignments: DirectoryAssignment[];
  onEdit?: (assignment: DirectoryAssignment) => void;
}) {
  if (assignments.length === 0) return <span>—</span>;
  return (
    <div className="flex flex-col gap-1">
      {assignments.map((assignment) => {
        const label = (
          <>
            {assignment.user.image ? (
              <img
                src={assignment.user.image}
                alt=""
                className="h-7 w-7 rounded-full object-cover flex-shrink-0 bg-gray-200"
              />
            ) : null}
            <span className={`truncate ${assignment.awaitingReplacement ? 'text-amber-800' : ''}`}>
              {directoryPersonName(assignment.user)}
              {assignment.awaitingReplacement ? ' (ended)' : ''}
            </span>
          </>
        );
        return (
          <div key={assignment.id} className="flex items-center gap-1.5 min-w-0">
            {onEdit ? (
              <button
                type="button"
                className="flex items-center gap-1.5 min-w-0 text-left hover:underline"
                onClick={() => onEdit(assignment)}
              >
                {label}
              </button>
            ) : (
              <div className="flex items-center gap-1.5 min-w-0">{label}</div>
            )}
            {assignment.user.email && (
              <button
                type="button"
                title="Copy email"
                className="text-gray-400 hover:text-gray-700"
                onClick={() => navigator.clipboard.writeText(assignment.user.email)}
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function DirectoryTeamCard({
  team,
  colorIndex = 0,
  onlyCrewId,
  onEdit,
  linkTeam = false,
  linkCrews = false,
}: {
  team: DirectoryTeam;
  colorIndex?: number;
  onlyCrewId?: string;
  onEdit?: (assignment: DirectoryAssignment, tradeTeamId: string, crewId: string | null) => void;
  linkTeam?: boolean;
  linkCrews?: boolean;
}) {
  const colors = directoryTeamColors[colorIndex % directoryTeamColors.length];
  const crews = onlyCrewId ? team.crews.filter((crew) => crew.id === onlyCrewId) : team.crews;
  const title = onlyCrewId ? crews[0]?.name || team.name : team.name;

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className={`${colors.header} text-white p-3 rounded-t-lg`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold text-lg">{title}</h2>
          {linkTeam && !onlyCrewId && (
            <Link
              href={`/trade-teams/${team.id}`}
              className="shrink-0 rounded bg-white/15 px-2 py-1 text-xs font-medium hover:bg-white/25 print:hidden"
            >
              Open team
            </Link>
          )}
        </div>
        {onlyCrewId && (
          <p className="text-xs text-white/80 mt-1">{team.name}</p>
        )}
      </div>

      {!onlyCrewId && (
        <div className={`${colors.light} ${colors.border} border-x p-3`}>
          <div className="text-xs font-semibold text-gray-500 mb-1">Trade Team</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="font-medium text-gray-600">Overseer</div>
              <div className="text-gray-900">
                <OversightNames
                  assignments={assignmentsForRole(team.oversight, 'TTO')}
                  onEdit={onEdit ? (assignment) => onEdit(assignment, team.id, null) : undefined}
                />
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-600">Assistant</div>
              <div className="text-gray-900">
                <OversightNames
                  assignments={assignmentsForRole(team.oversight, 'TTOA')}
                  onEdit={onEdit ? (assignment) => onEdit(assignment, team.id, null) : undefined}
                />
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-600">Support</div>
              <div className="text-gray-900">
                <OversightNames
                  assignments={assignmentsForRole(team.oversight, 'TT_SUPPORT')}
                  onEdit={onEdit ? (assignment) => onEdit(assignment, team.id, null) : undefined}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`${colors.bg} text-white p-2`}>
        <div className="grid grid-cols-4 gap-1 text-xs font-medium">
          <div>{onlyCrewId ? 'Crew' : 'Discipline'}</div>
          <div>TCO</div>
          <div>TCOA</div>
          <div>Support</div>
        </div>
      </div>

      <div className={`${colors.border} border-x border-b rounded-b-lg overflow-hidden`}>
        {crews.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm italic">No crews assigned</div>
        ) : (
          crews.map((crew, crewIdx) => (
            <div
              key={crew.id}
              className={`p-2 text-xs ${crewIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b last:border-b-0`}
            >
              <div className="grid grid-cols-4 gap-1">
                <div className="font-medium text-gray-900" title={crew.scopeOfWork || ''}>
                  {linkCrews && !onlyCrewId ? (
                    <Link href={`/trade-teams/${team.id}/crews/${crew.id}`} className="text-blue-700 hover:underline">
                      {crew.name}
                    </Link>
                  ) : (
                    crew.name
                  )}
                </div>
                <div className="text-gray-700">
                  <OversightNames
                    assignments={assignmentsForRole(crew.oversight, 'TCO')}
                    onEdit={onEdit ? (assignment) => onEdit(assignment, team.id, crew.id) : undefined}
                  />
                </div>
                <div className="text-gray-700">
                  <OversightNames
                    assignments={assignmentsForRole(crew.oversight, 'TCOA')}
                    onEdit={onEdit ? (assignment) => onEdit(assignment, team.id, crew.id) : undefined}
                  />
                </div>
                <div className="text-gray-700">
                  <OversightNames
                    assignments={assignmentsForRole(crew.oversight, 'TC_SUPPORT')}
                    onEdit={onEdit ? (assignment) => onEdit(assignment, team.id, crew.id) : undefined}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
