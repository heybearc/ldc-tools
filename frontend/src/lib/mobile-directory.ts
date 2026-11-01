type ListedPerson = {
  roleLabel: string;
  user: {
    name: string | null;
    email: string;
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
  name: string;
  email: string;
  phone: string | null;
  role: string;
  place: string;
};

function displayName(person: ListedPerson) {
  const named = `${person.user.firstName || ''} ${person.user.lastName || ''}`.trim();
  return person.user.name || named || person.user.email;
}

export function groupPeople(groups: {
  constructionGroup: Columns;
  personnel: Columns;
  ancillary: Array<{ role: string; people: ListedPerson[] }>;
}): MobilePerson[] {
  const rows: MobilePerson[] = [];
  const push = (place: string, role: string, people: ListedPerson[]) => {
    for (const person of people) {
      rows.push({
        name: displayName(person),
        email: person.user.email,
        phone: person.user.phone,
        role,
        place,
      });
    }
  };

  push('Construction group', 'Contact', groups.constructionGroup.contact);
  push('Construction group', 'Assistant', groups.constructionGroup.assistant);
  push('Construction group', 'Support', groups.constructionGroup.support);
  push('Personnel', 'Contact', groups.personnel.contact);
  push('Personnel', 'Assistant', groups.personnel.assistant);
  push('Personnel', 'Support', groups.personnel.support);
  for (const group of groups.ancillary) {
    for (const person of group.people) {
      rows.push({
        name: displayName(person),
        email: person.user.email,
        phone: person.user.phone,
        role: person.roleLabel,
        place: group.role,
      });
    }
  }
  return rows;
}
