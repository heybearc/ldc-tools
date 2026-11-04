import assert from 'node:assert/strict';
import test from 'node:test';
import { projectFacts, type Project } from './project-facts.ts';

function project(fields: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    name: 'Hall',
    number: null,
    location: null,
    status: 'Active',
    start: null,
    end: null,
    personnel: [],
    schedule: [],
    ...fields,
  };
}

test('a project line keeps number, place, and dates', () => {
  assert.equal(projectFacts(project({ number: '12', location: 'Austin', start: 'Nov 3, 2026' })), '12 · Austin · Nov 3, 2026');
  assert.equal(projectFacts(project()), '');
});
