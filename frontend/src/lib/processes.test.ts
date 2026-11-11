import assert from 'node:assert/strict';
import test from 'node:test';
import { cadenceLabel, placementForTemplate, taskInstructions, validateProcessTemplate } from './processes.ts';

test('a new template can stand alone on any cadence', () => {
  const parsed = validateProcessTemplate({
    name: 'Monthly safety walk',
    purpose: 'Walk the hall before the meeting.',
    appliesTo: 'TEAM',
    cadence: 'MONTHLY',
    steps: [{ title: 'Walk the aisles', instructions: 'Note anything that needs repair.' }],
  });
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.value.cadence, 'MONTHLY');
  assert.equal(parsed.value.customEvery, null);
  assert.equal(parsed.value.steps[0].detail, 'Note anything that needs repair.');
});

test('a project template can repeat, and a draft cannot start', () => {
  const quarterly = validateProcessTemplate({
    name: 'Quarterly drawing check',
    appliesTo: 'PROJECT',
    cadence: 'QUARTERLY',
    steps: [{ title: 'Open the current set', detail: 'Use the issued drawings.' }],
  });
  assert.equal(quarterly.ok, true);
  const custom = validateProcessTemplate({
    name: 'Inspection cycle',
    appliesTo: 'TEAM',
    cadence: 'CUSTOM',
    customEvery: 10,
    customUnit: 'DAY',
    steps: [{ title: 'Walk the site' }],
  });
  assert.equal(custom.ok, true);
  if (custom.ok) assert.equal(cadenceLabel(custom.value.cadence, custom.value.customEvery, custom.value.customUnit), 'Every 10 days');
  assert.equal(placementForTemplate({ appliesTo: 'PROJECT', cadence: 'WEEKLY', status: 'DRAFT' }, 'project-1').ok, false);
  assert.deepEqual(placementForTemplate({ appliesTo: 'PROJECT', cadence: 'WEEKLY', status: 'PUBLISHED' }, 'project-1'), {
    ok: true,
    projectId: 'project-1',
    cadence: 'WEEKLY',
  });
  assert.equal(placementForTemplate({ appliesTo: 'TEAM', cadence: 'YEARLY', status: 'PUBLISHED' }, null).ok, true);
});

test('an older explanation is shown with the instructions once', () => {
  assert.equal(taskInstructions('Open the file.', 'Use the current drawing.'), 'Open the file.\nUse the current drawing.');
  assert.equal(taskInstructions('Open the file.', 'Open the file.'), 'Open the file.');
});
