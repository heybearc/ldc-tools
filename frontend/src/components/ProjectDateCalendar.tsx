'use client';

import { useMemo, useState } from 'react';
import { addDays, addMonths, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns';

export interface CalendarScheduleItem {
  id: string;
  title: string;
  dueOn: string | null;
  status: string;
}

export interface CalendarProject {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  schedule: CalendarScheduleItem[];
}

type Span = 'day' | 'week' | 'month';

interface DayEvent {
  id: string;
  label: string;
  done: boolean;
}

function dayKey(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

function rangeCovers(start: string | null, end: string | null, day: string) {
  if (start && end) {
    const from = start <= end ? start : end;
    const to = start <= end ? end : start;
    return from <= day && day <= to;
  }
  return start === day || end === day;
}

function eventsOn(project: CalendarProject, day: string): DayEvent[] {
  const events: DayEvent[] = [];
  if (project.startDate === day) {
    events.push({ id: `${project.id}-start`, label: 'Starts', done: false });
  }
  if (project.endDate === day && project.endDate !== project.startDate) {
    events.push({ id: `${project.id}-end`, label: 'Ends', done: false });
  }
  for (const item of project.schedule) {
    if (item.dueOn === day) {
      events.push({ id: item.id, label: item.title, done: item.status === 'DONE' });
    }
  }
  return events;
}

export default function ProjectDateCalendar({
  projects,
  onOpenProject,
}: {
  projects: CalendarProject[];
  onOpenProject: (projectId: string) => void;
}) {
  const [span, setSpan] = useState<Span>('month');
  const [anchor, setAnchor] = useState(() => new Date());

  const days = useMemo(() => {
    if (span === 'day') return [anchor];
    if (span === 'week') {
      return eachDay(startOfWeek(anchor), endOfWeek(anchor));
    }
    return eachDay(startOfWeek(startOfMonth(anchor)), endOfWeek(endOfMonth(anchor)));
  }, [anchor, span]);

  const heading =
    span === 'day'
      ? format(anchor, 'EEEE, MMM d, yyyy')
      : span === 'week'
        ? `${format(days[0], 'MMM d')} – ${format(days[days.length - 1], 'MMM d, yyyy')}`
        : format(anchor, 'MMMM yyyy');

  function shift(direction: -1 | 1) {
    if (span === 'month') {
      setAnchor(addMonths(anchor, direction));
      return;
    }
    setAnchor(addDays(anchor, direction * (span === 'week' ? 7 : 1)));
  }

  const anyDated = projects.some(
    (project) => project.startDate || project.endDate || project.schedule.some((item) => item.dueOn),
  );

  return (
    <section className="bg-white rounded-lg shadow">
      <div className="flex flex-col gap-3 p-4 border-b border-gray-100 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => shift(-1)} className="px-3 py-2 min-h-[44px] rounded-md border border-gray-300 text-sm">
            Previous
          </button>
          <button type="button" onClick={() => setAnchor(new Date())} className="px-3 py-2 min-h-[44px] rounded-md border border-gray-300 text-sm">
            Today
          </button>
          <button type="button" onClick={() => shift(1)} className="px-3 py-2 min-h-[44px] rounded-md border border-gray-300 text-sm">
            Next
          </button>
          <h2 className="text-base font-semibold text-gray-900">{heading}</h2>
        </div>
        <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
          {([
            ['day', 'Day'],
            ['week', 'Week'],
            ['month', 'Month'],
          ] as const).map(([option, label]) => (
            <button
              key={option}
              type="button"
              onClick={() => setSpan(option)}
              className={`px-3 py-2 min-h-[44px] text-sm ${span === option ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {!anyDated ? (
        <p className="p-6 text-sm text-gray-500">No project dates yet. Add a start, end, or schedule date from the list.</p>
      ) : span === 'month' ? (
        <MonthGrid days={days} month={anchor} projects={projects} onOpenProject={onOpenProject} />
      ) : (
        <div className={`grid gap-px bg-gray-200 ${span === 'week' ? 'grid-cols-1 sm:grid-cols-7' : 'grid-cols-1'}`}>
          {days.map((day) => (
            <DayColumn key={dayKey(day)} day={day} projects={projects} onOpenProject={onOpenProject} />
          ))}
        </div>
      )}
    </section>
  );
}

function MonthGrid({
  days,
  month,
  projects,
  onOpenProject,
}: {
  days: Date[];
  month: Date;
  projects: CalendarProject[];
  onOpenProject: (projectId: string) => void;
}) {
  const weeks: Date[][] = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }
  return (
    <div>
      <div className="grid grid-cols-7 border-b bg-gray-50">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((name) => (
          <div key={name} className="px-2 py-2 text-center text-xs font-medium text-gray-600">
            {name}
          </div>
        ))}
      </div>
      {weeks.map((week) => (
        <div key={dayKey(week[0])} className="grid grid-cols-7 border-b last:border-b-0">
          {week.map((day) => {
            const key = dayKey(day);
            const inMonth = day.getMonth() === month.getMonth();
            const covered = projects.some((project) => rangeCovers(project.startDate, project.endDate, key));
            return (
              <div key={key} className={`min-h-[88px] p-1.5 border-r last:border-r-0 ${covered ? 'bg-blue-50' : inMonth ? 'bg-white' : 'bg-gray-50'}`}>
                <p className={`text-xs ${inMonth ? 'text-gray-700' : 'text-gray-400'}`}>{format(day, 'd')}</p>
                <DayEvents day={key} projects={projects} onOpenProject={onOpenProject} compact />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function DayColumn({
  day,
  projects,
  onOpenProject,
}: {
  day: Date;
  projects: CalendarProject[];
  onOpenProject: (projectId: string) => void;
}) {
  return (
    <div className="bg-white p-3 min-h-[140px]">
      <p className="text-sm font-medium text-gray-900">{format(day, 'EEE d')}</p>
      <DayEvents day={dayKey(day)} projects={projects} onOpenProject={onOpenProject} />
    </div>
  );
}

function DayEvents({
  day,
  projects,
  onOpenProject,
  compact = false,
}: {
  day: string;
  projects: CalendarProject[];
  onOpenProject: (projectId: string) => void;
  compact?: boolean;
}) {
  const rows = projects.flatMap((project) => {
    const events = eventsOn(project, day);
    const inRange = rangeCovers(project.startDate, project.endDate, day);
    if (events.length === 0 && (compact || !inRange)) return [];
    return [{ project, events, inRange }];
  });
  if (rows.length === 0) {
    return compact ? null : <p className="mt-2 text-sm text-gray-400">Nothing scheduled</p>;
  }
  return (
    <ul className="mt-1 space-y-1">
      {rows.map(({ project, events }) => (
        <li key={project.id}>
          <button
            type="button"
            onClick={() => onOpenProject(project.id)}
            className="w-full text-left rounded bg-blue-50 px-1.5 py-1 hover:bg-blue-100"
          >
            <span className={`block font-medium text-blue-900 truncate ${compact ? 'text-[11px]' : 'text-sm'}`}>{project.name}</span>
            {events.map((event) => (
              <span key={event.id} className={`block truncate text-blue-800 ${compact ? 'text-[11px]' : 'text-xs'} ${event.done ? 'line-through' : ''}`}>
                {event.label}
              </span>
            ))}
          </button>
        </li>
      ))}
    </ul>
  );
}

function eachDay(start: Date, end: Date) {
  const days: Date[] = [];
  for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
    days.push(cursor);
  }
  return days;
}
