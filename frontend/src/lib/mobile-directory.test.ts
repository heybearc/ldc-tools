import assert from 'node:assert/strict';
import test from 'node:test';
import { groupPeople } from './mobile-directory.ts';

const person = (name: string, roleLabel: string) => ({
  roleLabel,
  user: { name, email: `${name}@example.com`, firstName: null, lastName: null, phone: null },
});

test('directory groups are listed before a caller adds trade crews', () => {
  const rows = groupPeople({
    constructionGroup: {
      contact: [person('Cory Allen', 'CGO')],
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
});
