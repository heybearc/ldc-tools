'use client';

import { useEffect, useState, type ComponentType } from 'react';
import Link from 'next/link';
import { BookOpen, Building2, ClipboardList, Users, Wrench } from 'lucide-react';

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
  const [stats, setStats] = useState({ teams: 0, crews: 0, people: 0, available: 0, mine: 0, help: 0 });
  const [myTitles, setMyTitles] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [cgRes, overviewRes, workRes] = await Promise.all([
          fetch('/api/v1/user/cg-info', { cache: 'no-store' }),
          fetch('/api/v1/trade-teams/overview', { cache: 'no-store' }),
          fetch('/api/v1/work-items', { cache: 'no-store' }),
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
          setStats((current) => ({
            ...current,
            teams: overview.totalTeams ?? teams.length,
            crews: overview.totalCrews ?? teams.reduce((sum, team) => sum + (team.crews?.length || 0), 0),
            people: people.size,
          }));
        }

        if (workRes.ok) {
          const work = await workRes.json();
          const userId = work.currentUserId as string;
          const items = (work.items || []) as Array<{
            title: string;
            status: string;
            claimable: boolean;
            assignee: { id: string } | null;
            notes?: Array<{ kind: string }>;
          }>;
          const open = items.filter((item) => item.status === 'OPEN');
          const assigned = open.filter((item) => item.assignee?.id === userId);
          setMyTitles(assigned.slice(0, 5).map((item) => item.title));
          setStats((current) => ({
            ...current,
            available: open.filter((item) => item.claimable && !item.assignee).length + (work.processes?.length || 0),
            mine: assigned.length,
            help: open.filter((item) => (item.notes || []).some((note) => note.kind === 'HELP')).length,
          }));
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
          Your work in this construction group{groupName ? `, ${groupName}` : ''}, plus who to contact before you add them in Builder Assistant.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Link href="/my-work" className="block"><Stat label="My work" value={loading ? '—' : stats.mine} icon={ClipboardList} /></Link>
        <Link href="/work" className="block"><Stat label="Available work" value={loading ? '—' : stats.available} icon={ClipboardList} /></Link>
        <Stat label="Trade teams" value={loading ? '—' : stats.teams} icon={Wrench} />
        <Link href="/trade-teams/overview" className="block">
          <Stat label="People in the directory" value={loading ? '—' : stats.people} icon={Users} />
        </Link>
      </div>

      <section className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Assigned to you</h2>
          <Link href="/my-work" className="text-sm font-medium text-blue-600 hover:underline">Open my work</Link>
        </div>
        {loading ? (
          <p className="mt-3 text-gray-500">Loading your work…</p>
        ) : myTitles.length === 0 ? (
          <p className="mt-3 text-gray-600">Nothing is assigned to you. Available work can be claimed from Work.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {myTitles.map((title, index) => (
              <li key={`${title}-${index}`} className="text-gray-800">{title}</li>
            ))}
            {stats.mine > myTitles.length && (
              <li className="text-sm text-gray-500">{stats.mine - myTitles.length} more on My Work</li>
            )}
          </ul>
        )}
        {stats.help > 0 && (
          <p className="mt-4 text-sm text-amber-900">
            <Link href="/work#help" className="font-medium hover:underline">
              {stats.help} open {stats.help === 1 ? 'item has' : 'items have'} a request for help
            </Link>
          </p>
        )}
      </section>

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
            Tasks for this construction group. Personnel assign them. Claimable tasks and processes can be taken by the team.
          </p>
        </Link>
        <Link
          href="/projects"
          className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 block"
        >
          <div className="flex items-center mb-3">
            <div className="bg-emerald-700 p-3 rounded-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <h2 className="ml-4 text-lg font-semibold text-gray-900">Projects</h2>
          </div>
          <p className="text-gray-600">
            Projects for this construction group, with the people and dates on each one.
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
