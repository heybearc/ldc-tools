import assert from 'node:assert/strict';
import test from 'node:test';
import { assigneeToNotify, enteredClaimPool, workAssignedMessage, workAvailableAlert, workAvailableMessage } from './work-available-notice.ts';

test('new unassigned claimable work enters the pool', () => {
  assert.equal(enteredClaimPool(null, { status: 'OPEN', claimable: true, assigneeId: null }), true);
  assert.equal(enteredClaimPool(null, { status: 'OPEN', claimable: true, assigneeId: 'user' }), false);
  assert.equal(enteredClaimPool(null, { status: 'OPEN', claimable: false, assigneeId: null }), false);
});

test('returning assigned work to the pool notifies once', () => {
  const before = { status: 'OPEN', claimable: true, assigneeId: 'user' };
  const after = { status: 'OPEN', claimable: true, assigneeId: null };
  assert.equal(enteredClaimPool(before, after), true);
  assert.equal(enteredClaimPool(after, after), false);
});

test('one task names itself and several tasks share one alert', () => {
  assert.deepEqual(workAvailableAlert([{ id: 'w1', title: 'Set up chairs' }]), {
    title: 'Work available',
    body: 'Set up chairs',
    url: '/work#work-w1',
    workItemId: 'w1',
  });
  const many = workAvailableAlert([
    { id: 'w1', title: 'Set up chairs' },
    { id: 'w2', title: 'Unlock the hall' },
  ]);
  assert.equal(many?.body, '2 tasks are available');
  assert.equal(many?.url, '/work');
  assert.equal(many?.workItemId, '');
});

test('release-check titles stay quiet', () => {
  assert.equal(workAvailableAlert([{ id: 'w1', title: 'QA Volunteer request' }]), null);
  assert.equal(workAvailableMessage([{ title: 'QA Volunteer request' }]), null);
});

test('the email names the task and links to the work list', () => {
  const message = workAvailableMessage(
    [{ id: 'w1', title: 'Set up chairs', detail: 'Hall B before the meeting.' }],
    'https://ldctools.com',
  );
  assert.equal(message?.subject, 'Work available — Set up chairs');
  assert.match(message?.text || '', /Set up chairs/);
  assert.match(message?.text || '', /Hall B before the meeting/);
  assert.match(message?.text || '', /https:\/\/ldctools.com\/work#work-w1/);
});

test('assigning work to someone else names that task', () => {
  assert.equal(assigneeToNotify(null, 'ada', 'cory'), 'ada');
  assert.equal(assigneeToNotify('ada', 'ada', 'cory'), null);
  assert.equal(assigneeToNotify(null, 'cory', 'cory'), null);
  const message = workAssignedMessage(
    [{ id: 'w1', title: 'Set up chairs', detail: 'Hall B before the meeting.' }],
    'https://ldctools.com',
  );
  assert.equal(message?.subject, 'Work assigned — Set up chairs');
  assert.equal(message?.pushTitle, 'Work assigned');
  assert.match(message?.text || '', /This work was assigned to you/);
  assert.match(message?.text || '', /https:\/\/ldctools.com\/work#work-w1/);
});
test('several tasks share one email that lists each title', () => {
  const message = workAvailableMessage([
    { title: 'Add: Ada' },
    { title: 'Remove: Ben' },
  ], 'https://ldctools.com/');
  assert.equal(message?.subject, 'Work available — 2 tasks');
  assert.match(message?.text || '', /Add: Ada/);
  assert.match(message?.text || '', /Remove: Ben/);
  assert.match(message?.text || '', /https:\/\/ldctools.com\/work$/m);
});
