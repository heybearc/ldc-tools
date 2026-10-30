import assert from 'node:assert/strict';
import test from 'node:test';
import { olderAssignments, parsePersonsLines } from './persons-roster.ts';

const LINES = [
  'Anderson, Clinton Lewis',
  'Email Address',
  'clintek1@sbcglobal.net',
  'ClintonA@jwpub.org',
  'Role',
  'Trade Crew Assistant Overseer - Electrical - Electrical rough-in',
  'Role',
  'Trade Crew Assistant Overseer - Electrical - Electrical finish',
  'Anderson, Karen Diane',
  'Email Address',
  'k.anewnew@gmail.com',
  'Role',
  'Trade Crew Support',
  'Work Location',
  'AH-Willoughby, Ohio',
];

test('a fully listed person keeps those roles and drops the other crew', () => {
  const people = parsePersonsLines(LINES);
  const clinton = people.find((person) => person.name.startsWith('Anderson, Clinton'));
  assert.equal(clinton?.complete, true);
  assert.equal(clinton?.roles.length, 2);

  const older = olderAssignments(people, [
    { id: 'keep', email: 'clintek1@sbcglobal.net', role: 'TCOA', team: 'Electrical', crew: 'Electrical finish' },
    { id: 'drop', email: 'ClintonA@jwpub.org', role: 'TCO', team: 'Plumbing', crew: 'Plumbing rough-in' },
  ]);
  assert.deepEqual(older.map((row) => row.id), ['drop']);
});

test('a role with no crew does not end any assignment', () => {
  const people = parsePersonsLines(LINES);
  const older = olderAssignments(people, [
    { id: 'karen', email: 'k.anewnew@gmail.com', role: 'TC_SUPPORT', team: 'Electrical', crew: 'Electrical finish' },
  ]);
  assert.deepEqual(older, []);
  assert.equal(people.some((person) => person.name.includes('Willoughby')), false);
});
