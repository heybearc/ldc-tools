type ListedPerson = {
  roleLabel: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
  };
};

type Columns = {
  contact: ListedPerson[];
  assistant: ListedPerson[];
  support: ListedPerson[];
};

export type MobilePerson = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  place: string;
  photo: string | null;
};

export type MobileCrew = {
  id: string;
  name: string;
  people: MobilePerson[];
};

export type MobileTeam = {
  id: string;
  name: string;
  people: MobilePerson[];
  crews: MobileCrew[];
};

export type MobileDirectory = {
  constructionGroup: MobilePerson[];
  personnel: MobilePerson[];
  ancillary: MobilePerson[];
  teams: MobileTeam[];
};

type Assignment = {
  id: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
  } | null;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    image: string | null;
  } | null;
};

function clean(value: string | null | undefined) {
  const text = value?.trim() || '';
  return text || null;
}

function displayName(person: ListedPerson) {
  const named = `${person.user.firstName || ''} ${person.user.lastName || ''}`.trim();
  return person.user.name || named || person.user.email;
}

function fromListed(place: string, role: string, person: ListedPerson): MobilePerson {
  return {
    id: person.user.id,
    name: displayName(person),
    email: person.user.email,
    phone: clean(person.user.phone),
    role,
    place,
    photo: clean(person.user.image),
  };
}

export function groupPeople(groups: {
  constructionGroup: Columns;
  personnel: Columns;
  ancillary: Array<{ role: string; people: ListedPerson[] }>;
}): MobilePerson[] {
  return directorySections(groups).people;
}

export function directorySections(groups: {
  constructionGroup: Columns;
  personnel: Columns;
  ancillary: Array<{ role: string; people: ListedPerson[] }>;
}) {
  const constructionGroup = [
    ...groups.constructionGroup.contact.map((person) => fromListed('Construction group', 'Contact', person)),
    ...groups.constructionGroup.assistant.map((person) => fromListed('Construction group', 'Assistant', person)),
    ...groups.constructionGroup.support.map((person) => fromListed('Construction group', 'Support', person)),
  ];
  const personnel = [
    ...groups.personnel.contact.map((person) => fromListed('Personnel', 'Contact', person)),
    ...groups.personnel.assistant.map((person) => fromListed('Personnel', 'Assistant', person)),
    ...groups.personnel.support.map((person) => fromListed('Personnel', 'Support', person)),
  ];
  const ancillary = groups.ancillary.flatMap((group) =>
    group.people.map((person) => fromListed(group.role, person.roleLabel, person)),
  );
  return {
    constructionGroup,
    personnel,
    ancillary,
    people: [...constructionGroup, ...personnel, ...ancillary],
  };
}

export function personFromAssignment(row: Assignment, place: string, role: string): MobilePerson {
  const contact = row.contact;
  const account = row.user;
  const named = account ? `${account.firstName || ''} ${account.lastName || ''}`.trim() : '';
  return {
    id: account?.id || contact?.id || row.id,
    name: contact
      ? `${contact.firstName} ${contact.lastName}`.trim()
      : account?.name || named || account?.email || '',
    email: contact?.email || account?.email || '',
    phone: clean(contact?.phone) || clean(account?.phone),
    role,
    place,
    photo: clean(contact?.image) || clean(account?.image),
  };
}
