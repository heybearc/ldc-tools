import assert from 'node:assert/strict';
import test from 'node:test';
import { directorySections, groupPeople, personFromAssignment } from './mobile-directory.ts';

const person = (name: string, roleLabel: string, phone: string | null = null, image: string | null = null) => ({
  roleLabel,
  user: {
    id: name,
    name,
    email: `${name}@example.com`,
    image,
    firstName: null,
    lastName: null,
    phone,
  },
});

test('directory groups are listed before a caller adds trade crews', () => {
  const rows = groupPeople({
    constructionGroup: {
      contact: [person('Cory Allen', 'CGO', '555-0100', '/api/v1/directory-photos/cory.jpg')],
      assistant: [],
      support: [],
    },
    personnel: {
      contact: [],
      assistant: [person('Matt Hirsch', 'PCA')],
      support: [],
    },
    ancillary: [{ role: 'Region support', people: [person('Ada Lane', 'Region support')] }],
  });

  assert.deepEqual(rows.map((row) => `${row.role} · ${row.place}`), [
    'Contact · Construction group',
    'Assistant · Personnel',
    'Region support · Region support',
  ]);
  assert.equal(rows[0].name, 'Cory Allen');
  assert.equal(rows[0].phone, '555-0100');
  assert.equal(rows[0].photo, '/api/v1/directory-photos/cory.jpg');
});

test('directory sections stay separate from trade crews', () => {
  const sections = directorySections({
    constructionGroup: { contact: [person('Cory Allen', 'CGO')], assistant: [], support: [] },
    personnel: { contact: [person('Ruth Hirsch', 'PC')], assistant: [], support: [] },
    ancillary: [{ role: 'Maintenance', people: [person('Ada Lane', 'Maintenance')] }],
  });

  assert.deepEqual(sections.constructionGroup.map((row) => row.place), ['Construction group']);
  assert.deepEqual(sections.personnel.map((row) => row.name), ['Ruth Hirsch']);
  assert.deepEqual(sections.ancillary.map((row) => row.place), ['Maintenance']);
});

test('a trade assignment uses the contact phone and photo, then the account', () => {
  const contact = personFromAssignment({
    id: 'row-1',
    role: 'TCO',
    user: null,
    contact: {
      id: 'contact-1',
      firstName: 'Ada',
      lastName: 'Lane',
      email: 'ada@example.com',
      phone: '555-0199',
      image: '/api/v1/directory-photos/ada.jpg',
    },
  }, 'Electrical · Crew 1', 'Overseer');
  assert.equal(contact.phone, '555-0199');
  assert.equal(contact.photo, '/api/v1/directory-photos/ada.jpg');
  assert.equal(contact.name, 'Ada Lane');

  const account = personFromAssignment({
    id: 'row-2',
    role: 'TTO',
    user: {
      id: 'user-1',
      name: 'Cory Allen',
      email: 'cory@example.com',
      image: null,
      firstName: 'Cory',
      lastName: 'Allen',
      phone: '555-0100',
    },
    contact: null,
  }, 'Electrical', 'Overseer');
  assert.equal(account.phone, '555-0100');
  assert.equal(account.id, 'user-1');
});
