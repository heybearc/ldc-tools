import assert from 'node:assert/strict';
import test from 'node:test';
import { directoryFromHome, peopleForView } from './directory-view.ts';
import type { Directory, Person } from './home.ts';

const person = (name: string, place: string, role = 'Overseer'): Person => ({
  id: name,
  name,
  email: `${name}@example.com`,
  phone: '555-0100',
  role,
  place,
  photo: null,
});

const directory: Directory = {
  constructionGroup: [person('Cory Allen', 'Construction group', 'Contact')],
  personnel: [person('Ruth Hirsch', 'Personnel', 'Contact')],
  ancillary: [person('Ada Lane', 'Maintenance', 'Maintenance')],
  teams: [{
    id: 'electrical',
    name: 'Electrical',
    people: [person('Team Lead', 'Electrical')],
    crews: [{
      id: 'crew-1',
      name: 'Crew 1',
      people: [person('Crew Member', 'Electrical · Crew 1')],
    }],
  }],
};

test('each directory section stays on its own list', () => {
  assert.deepEqual(peopleForView(directory, 'construction', '', '', '').map((row) => row.name), ['Cory Allen']);
  assert.deepEqual(peopleForView(directory, 'personnel', '', '', '').map((row) => row.name), ['Ruth Hirsch']);
  assert.deepEqual(peopleForView(directory, 'ancillary', '', '', '').map((row) => row.name), ['Ada Lane']);
  assert.deepEqual(peopleForView(directory, 'trades', 'electrical', 'team', '').map((row) => row.name), ['Team Lead']);
  assert.deepEqual(peopleForView(directory, 'trades', 'electrical', 'crew-1', '').map((row) => row.name), ['Crew Member']);
});

test('search looks through every section', () => {
  assert.deepEqual(peopleForView(directory, 'trades', 'electrical', 'crew-1', 'ruth').map((row) => row.name), ['Ruth Hirsch']);
  assert.deepEqual(peopleForView(directory, 'construction', '', '', 'zzzz'), []);
});

test('a flat list still separates the construction group and personnel', () => {
  const fromFlat = directoryFromHome({
    people: [
      person('Cory Allen', 'Construction group', 'Contact'),
      person('Crew Member', 'Electrical · Crew 1'),
    ],
  });
  assert.equal(fromFlat.constructionGroup.length, 1);
  assert.equal(fromFlat.teams[0].crews[0].people[0].name, 'Crew Member');
});
