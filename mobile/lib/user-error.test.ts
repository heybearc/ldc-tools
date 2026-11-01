import assert from 'node:assert/strict';
import test from 'node:test';
import { userError } from './user-error.ts';

test('a specific server message stays', () => {
  assert.equal(
    userError(401, 'Email or password is incorrect', 'Could not sign in'),
    'Email or password is incorrect',
  );
});

test('a generic failure says what to do', () => {
  assert.equal(
    userError(500, 'Failed to load work', 'Could not load work'),
    'Could not load work. Try again in a moment.',
  );
  assert.equal(
    userError(0, '', 'Could not load work'),
    'Could not reach the server. Check the connection and try again.',
  );
  assert.equal(userError(401, 'Unauthorized', 'Could not load work'), 'Sign in again. This session is no longer valid.');
  assert.equal(userError(403, '', 'Could not load work'), 'You do not have access to do that.');
});
