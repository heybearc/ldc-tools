const LABELS = new Set([
  'Mobile Phone',
  'Home Phone',
  'Work Phone',
  'Email Address',
  'Role',
  'Work Location',
  'None',
]);

const ROLE_TITLES: { title: string; role: RosterRoleCode; crew: boolean }[] = [
  { title: 'Trade Crew Assistant Overseer', role: 'TCOA', crew: true },
  { title: 'Trade Crew Overseer', role: 'TCO', crew: true },
  { title: 'Trade Crew Support', role: 'TC_SUPPORT', crew: true },
  { title: 'Trade Team Overseer Assistant', role: 'TTOA', crew: false },
  { title: 'Trade Team Assistant Overseer', role: 'TTOA', crew: false },
  { title: 'Trade Team Overseer', role: 'TTO', crew: false },
  { title: 'Trade Team Support', role: 'TT_SUPPORT', crew: false },
];

export type RosterRoleCode = 'TTO' | 'TTOA' | 'TT_SUPPORT' | 'TCO' | 'TCOA' | 'TC_SUPPORT';

export type RosterRole = {
  role: RosterRoleCode;
  team: string;
  crew: string | null;
};

export type RosterPerson = {
  name: string;
  emails: string[];
  roles: RosterRole[];
  /** False when a trade role has no team, or a crew role has no crew. Those people are left unchanged. */
  complete: boolean;
};

export type OversightRow = {
  id: string;
  email: string;
  role: string;
  team: string;
  crew: string | null;
};

function isName(line: string): boolean {
  if (LABELS.has(line)) return false;
  if (!line.includes(',')) return false;
  if (line.startsWith('Trade ') || line.startsWith('CG ') || line.startsWith('Region ')) return false;
  return true;
}

function parseRole(line: string): { role: RosterRole | null; complete: boolean } {
  const match = ROLE_TITLES.find((item) => line === item.title || line.startsWith(`${item.title} - `));
  if (!match) return { role: null, complete: true };
  const rest = line.slice(match.title.length).replace(/^ - /, '');
  const parts = rest.split(' - ').map((part) => part.trim()).filter(Boolean);
  const team = parts[0] || '';
  const crew = match.crew ? (parts.slice(1).join(' - ') || null) : null;
  if (!team || (match.crew && !crew)) return { role: null, complete: false };
  return { role: { role: match.role, team, crew }, complete: true };
}

export function parsePersonsLines(lines: string[]): RosterPerson[] {
  const people: RosterPerson[] = [];
  let current: RosterPerson | null = null;
  let skipNext = false;

  const finish = () => {
    if (!current) return;
    people.push(current);
    current = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (skipNext) {
      skipNext = false;
      continue;
    }
    if (line === 'Work Location') {
      skipNext = true;
      continue;
    }
    if (isName(line)) {
      finish();
      current = { name: line, emails: [], roles: [], complete: true };
      continue;
    }
    if (!current) continue;
    if (line.includes('@')) {
      current.emails.push(line.toLowerCase());
      continue;
    }
    const parsed = parseRole(line);
    if (!parsed.complete) current.complete = false;
    if (parsed.role) current.roles.push(parsed.role);
  }
  finish();
  return people;
}

function samePlace(role: RosterRole, row: OversightRow): boolean {
  if (role.role !== row.role) return false;
  if (role.team.toLowerCase() !== row.team.toLowerCase()) return false;
  const crew = role.crew?.toLowerCase() || '';
  const rowCrew = row.crew?.toLowerCase() || '';
  return crew === rowCrew;
}

/** Assignments for a fully listed person that are not in the persons list. Incomplete people are skipped. */
export function olderAssignments(people: RosterPerson[], rows: OversightRow[]): OversightRow[] {
  const byEmail = new Map<string, RosterPerson>();
  for (const person of people) {
    for (const email of person.emails) byEmail.set(email, person);
  }
  return rows.filter((row) => {
    const person = byEmail.get(row.email.trim().toLowerCase());
    if (!person || !person.complete || person.roles.length === 0) return false;
    return !person.roles.some((role) => samePlace(role, row));
  });
}
