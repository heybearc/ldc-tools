import assert from 'node:assert/strict';
import test from 'node:test';
import { placementForTemplate, taskInstructions, validateProcessTemplate } from './processes.ts';

test('a team process is monthly and has one instruction field', () => {
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
  assert.equal(parsed.value.steps[0].detail, 'Note anything that needs repair.');
  assert.equal(parsed.value.steps[0].explanation, null);
});

test('a project process is once or weekly and needs a project to start', () => {
  const weekly = validateProcessTemplate({
    name: 'Weekly drawing check',
    appliesTo: 'PROJECT',
    cadence: 'WEEKLY',
    steps: [{ title: 'Open the current set', detail: 'Use the issued drawings.' }],
  });
  assert.equal(weekly.ok, true);
  const monthly = validateProcessTemplate({
    name: 'Wrong cadence',
    appliesTo: 'PROJECT',
    cadence: 'MONTHLY',
    steps: [{ title: 'Task' }],
  });
  assert.equal(monthly.ok, false);
  assert.equal(placementForTemplate({ appliesTo: 'PROJECT', cadence: 'ONCE' }, null).ok, false);
  assert.deepEqual(placementForTemplate({ appliesTo: 'PROJECT', cadence: 'WEEKLY' }, 'project-1'), {
    ok: true,
    projectId: 'project-1',
    cadence: 'WEEKLY',
  });
});

test('an older explanation is shown with the instructions once', () => {
  assert.equal(taskInstructions('Open the file.', 'Use the current drawing.'), 'Open the file.\nUse the current drawing.');
  assert.equal(taskInstructions('Open the file.', 'Open the file.'), 'Open the file.');
});
