'use client';

import { useEffect, useState, type ComponentType } from 'react';
import Link from 'next/link';
import { BookOpen, ClipboardList, Users, Wrench } from 'lucide-react';

interface OverviewPerson {
  user: { id: string };
}

interface OverviewTeam {
  oversight: OverviewPerson[];
  crews: Array<{ oversight: OverviewPerson[] }>;
}

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [stats, setStats] = useState({ teams: 0, crews: 0, people: 0 });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [cgRes, overviewRes] = await Promise.all([
          fetch('/api/v1/user/cg-info', { cache: 'no-store' }),
          fetch('/api/v1/trade-teams/overview', { cache: 'no-store' }),
        ]);

        if (cancelled) return;

        if (cgRes.ok) {
          const cgData = await cgRes.json();
          setGroupName(cgData.regionName || cgData.name || null);
        }

        if (overviewRes.ok) {
          const overview = await overviewRes.json();
          const teams: OverviewTeam[] = overview.tradeTeams || [];
          const people = new Set<string>();
          const addPerson = (assignment?: { user?: { id?: string } }) => {
            if (assignment?.user?.id) people.add(assignment.user.id);
          };
          for (const team of teams) {
            for (const assignment of team.oversight || []) addPerson(assignment);
            for (const crew of team.crews || []) {
              for (const assignment of crew.oversight || []) addPerson(assignment);
            }
          }
          const groups = overview.directoryGroups;
          for (const columns of [groups?.constructionGroup, groups?.personnel]) {
            if (!columns) continue;
            for (const row of [...columns.contact, ...columns.assistant, ...columns.support]) {
              addPerson(row);
            }
          }
          for (const group of groups?.ancillary || []) {
            for (const row of group.people || []) addPerson(row);
          }
          setStats({
            teams: overview.totalTeams ?? teams.length,
            crews: overview.totalCrews ?? teams.reduce((sum, team) => sum + (team.crews?.length || 0), 0),
            people: people.size,
          });
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const onGroupChange = () => {
      setLoading(true);
      load();
    };
    window.addEventListener('cg-filter-changed', onGroupChange);
    return () => {
      cancelled = true;
      window.removeEventListener('cg-filter-changed', onGroupChange);
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-base sm:text-lg text-gray-600 max-w-3xl">
          Who to contact for each trade, the construction group, and the region{groupName ? ` in ${groupName}` : ''}. Look someone up before you add them in Builder Assistant.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Trade teams" value={loading ? '—' : stats.teams} icon={Wrench} />
        <Stat label="Crews" value={loading ? '—' : stats.crews} icon={BookOpen} />
        <Stat label="Leadership contacts" value={loading ? '—' : stats.people} icon={Users} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Link
          href="/trade-teams/overview"
          className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 block"
        >
          <div className="flex items-center mb-3">
            <div className="bg-blue-600 p-3 rounded-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <h2 className="ml-4 text-lg font-semibold text-gray-900">Directory</h2>
          </div>
          <p className="text-gray-600">
            Search by trade, person, or role. Construction group, Personnel, and ancillary contacts are listed with the trades.
          </p>
        </Link>
        <Link
          href="/work"
          className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 block"
        >
          <div className="flex items-center mb-3">
            <div className="bg-amber-600 p-3 rounded-lg">
              <ClipboardList className="h-6 w-6 text-white" />
            </div>
            <h2 className="ml-4 text-lg font-semibold text-gray-900">Work</h2>
          </div>
          <p className="text-gray-600">
            Tasks for this construction group. Personnel assign them. Claimable tasks can be taken by the team.
          </p>
        </Link>
        <Link
          href="/trade-teams"
          className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 block"
        >
          <div className="flex items-center mb-3">
            <div className="bg-gray-800 p-3 rounded-lg">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <h2 className="ml-4 text-lg font-semibold text-gray-900">Trade teams</h2>
          </div>
          <p className="text-gray-600">
            The teams and the crews under them. Use this when the structure itself needs a change.
          </p>
        </Link>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="flex items-center">
        <Icon className="h-6 w-6 text-blue-600" />
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
