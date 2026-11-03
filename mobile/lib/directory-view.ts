import type { Directory, Person } from './home';

export type Section = 'construction' | 'personnel' | 'ancillary' | 'trades';

export const SECTIONS: Array<{ id: Section; label: string }> = [
  { id: 'construction', label: 'Construction group' },
  { id: 'personnel', label: 'Personnel' },
  { id: 'ancillary', label: 'Ancillary' },
  { id: 'trades', label: 'Trade teams' },
];

function asPerson(person: Partial<Person> & { name: string; email: string; role: string; place: string }): Person {
  return {
    id: person.id || `${person.email}-${person.role}-${person.place}`,
    name: person.name,
    email: person.email,
    phone: person.phone || null,
    role: person.role,
    place: person.place,
    photo: person.photo || null,
  };
}

export function directoryFromHome(home: { people?: Person[]; directory?: Directory }): Directory {
  if (home.directory) {
    return {
      constructionGroup: home.directory.constructionGroup || [],
      personnel: home.directory.personnel || [],
      ancillary: home.directory.ancillary || [],
      teams: home.directory.teams || [],
    };
  }

  const constructionGroup: Person[] = [];
  const personnel: Person[] = [];
  const ancillary: Person[] = [];
  const teams = new Map<string, { id: string; name: string; people: Person[]; crews: Map<string, Person[]> }>();
  for (const raw of home.people || []) {
    const person = asPerson(raw);
    if (person.place === 'Construction group') {
      constructionGroup.push(person);
      continue;
    }
    if (person.place === 'Personnel') {
      personnel.push(person);
      continue;
    }
    const [teamName, crewName] = person.place.split(' · ');
    if (!crewName) {
      ancillary.push(person);
      continue;
    }
    const team = teams.get(teamName) || { id: teamName, name: teamName, people: [], crews: new Map() };
    const crew = team.crews.get(crewName) || [];
    crew.push(person);
    team.crews.set(crewName, crew);
    teams.set(teamName, team);
  }

  return {
    constructionGroup,
    personnel,
    ancillary,
    teams: Array.from(teams.values()).map((team) => ({
      id: team.id,
      name: team.name,
      people: team.people,
      crews: Array.from(team.crews.entries()).map(([name, people]) => ({ id: name, name, people })),
    })),
  };
}

export function allPeople(directory: Directory): Person[] {
  return [
    ...directory.constructionGroup,
    ...directory.personnel,
    ...directory.ancillary,
    ...directory.teams.flatMap((team) => [...team.people, ...team.crews.flatMap((crew) => crew.people)]),
  ];
}

export function peopleForView(
  directory: Directory,
  section: Section,
  teamId: string,
  crewId: string,
  query: string,
): Person[] {
  const needle = query.trim().toLowerCase();
  if (needle) {
    return allPeople(directory).filter((person) =>
      `${person.name} ${person.email} ${person.phone || ''} ${person.role} ${person.place}`.toLowerCase().includes(needle),
    );
  }
  if (section === 'construction') return directory.constructionGroup;
  if (section === 'personnel') return directory.personnel;
  if (section === 'ancillary') return directory.ancillary;
  const team = directory.teams.find((item) => item.id === teamId) || directory.teams[0];
  if (!team) return [];
  if (!crewId || crewId === 'team') return team.people;
  return team.crews.find((crew) => crew.id === crewId)?.people || [];
}

export function emptyDirectoryMessage(section: Section, query: string, crewName: string): string {
  if (query.trim()) return 'No one matches that search.';
  if (section === 'construction') return 'No one is listed in the construction group.';
  if (section === 'personnel') return 'No one is listed in personnel.';
  if (section === 'ancillary') return 'No one is listed in ancillary.';
  if (!crewName) return 'No trade teams are listed.';
  return `No one is listed on ${crewName}.`;
}
