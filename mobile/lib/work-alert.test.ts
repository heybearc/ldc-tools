import assert from 'node:assert/strict';
import test from 'node:test';
import { workAlertPath } from './work-alert.ts';

test('a work alert opens that task', () => {
  assert.equal(workAlertPath({ kind: 'work', workItemId: 'abc' }), '/work/abc');
});

test('several tasks open Available', () => {
  assert.equal(workAlertPath({ kind: 'work' }), '/available');
});

test('chat alerts stay on their own path', () => {
  assert.equal(workAlertPath({ kind: 'chat', url: '/chat' }), null);
});
