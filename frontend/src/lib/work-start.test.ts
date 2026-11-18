import assert from 'node:assert/strict';
import test from 'node:test';
import { startedAtAfterAssigneeChange } from './work-start.ts';

test('the same assignee keeps the start time', () => {
  assert.equal(startedAtAfterAssigneeChange('person', 'person'), undefined);
  assert.equal(startedAtAfterAssigneeChange(null, null), undefined);
});

test('a new assignee or the pool must start again', () => {
  assert.equal(startedAtAfterAssigneeChange('person', 'other'), null);
  assert.equal(startedAtAfterAssigneeChange('person', null), null);
  assert.equal(startedAtAfterAssigneeChange(null, 'person'), null);
});
