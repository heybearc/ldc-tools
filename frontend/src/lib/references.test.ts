import assert from 'node:assert/strict';
import test from 'node:test';
import { groupReferences, referenceMatches, validateReference } from './references.ts';

test('a reference keeps a title, an https address, and a category', () => {
  const parsed = validateReference({
    title: '  Crew request form  ',
    url: 'https://forms.example.com/crew',
    note: ' Use this for volunteer changes. ',
    category: '  Forms  ',
  });
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.value.title, 'Crew request form');
  assert.equal(parsed.value.url, 'https://forms.example.com/crew');
  assert.equal(parsed.value.note, 'Use this for volunteer changes.');
  assert.equal(parsed.value.category, 'Forms');
});

test('a blank category is General, and a missing address is refused', () => {
  const general = validateReference({ title: 'Builder Assistant', url: 'http://ba.jw.org' });
  assert.equal(general.ok, true);
  if (general.ok) {
    assert.equal(general.value.category, 'General');
    assert.equal(general.value.note, null);
  }
  const missing = validateReference({ title: 'Notes', url: 'not a link' });
  assert.equal(missing.ok, false);
});

test('General stays first, and search matches the address', () => {
  const groups = groupReferences([
    { title: 'Safety sheet', category: 'Forms', url: 'https://example.com/safety', note: null },
    { title: 'Hub', category: 'General', url: 'https://hub.example.com', note: 'Region page' },
  ]);
  assert.deepEqual(groups.map((group) => group.category), ['General', 'Forms']);
  assert.equal(referenceMatches(groups[1].links[0], 'safety'), true);
  assert.equal(referenceMatches(groups[0].links[0], 'region page'), true);
  assert.equal(referenceMatches(groups[0].links[0], 'missing'), false);
});
