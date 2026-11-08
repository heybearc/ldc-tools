import assert from 'node:assert/strict';
import test from 'node:test';
import { phoneFeatures, renderFeatureFlow } from './phone-features.ts';

test('each phone feature gets its own flow', () => {
  const ids = phoneFeatures.map((feature) => feature.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.includes('my-work'));
  assert.ok(ids.includes('available'));
  assert.ok(ids.includes('projects'));
  assert.ok(ids.includes('directory'));
  assert.ok(ids.includes('chat'));
  assert.ok(ids.includes('processes'));
  assert.ok(ids.includes('trade-teams'));
  assert.ok(ids.includes('feedback'));
  assert.ok(ids.includes('help'));

  for (const feature of phoneFeatures) {
    const flow = renderFeatureFlow(feature);
    assert.match(flow, /^appId: com\.ldctools\.mobile/m);
    assert.match(flow, /- runFlow: \.\.\/shared\/sign-in\.yaml/);
    assert.match(flow, /id: "screen-/);
  }
});
