import assert from 'node:assert/strict';
import test from 'node:test';
import { isWideLayout } from './layout.ts';

test('a tablet uses the wide layout and a phone stays stacked', () => {
  assert.equal(isWideLayout(1024, 768), true);
  assert.equal(isWideLayout(768, 1024), true);
  assert.equal(isWideLayout(390, 844), false);
  assert.equal(isWideLayout(844, 390), false);
});
