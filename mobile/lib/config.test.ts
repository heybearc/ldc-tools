import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultApiBase } from './config.ts';

test('the phone uses the public site unless a test server is set', () => {
  const previous = process.env.EXPO_PUBLIC_API_BASE;
  delete process.env.EXPO_PUBLIC_API_BASE;
  assert.equal(defaultApiBase(), 'https://ldctools.com');
  process.env.EXPO_PUBLIC_API_BASE = 'https://green.ldctools.com/';
  assert.equal(defaultApiBase(), 'https://green.ldctools.com');
  if (previous === undefined) delete process.env.EXPO_PUBLIC_API_BASE;
  else process.env.EXPO_PUBLIC_API_BASE = previous;
});
