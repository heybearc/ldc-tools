export const PROCESS_APPLIES_TO = ['TEAM', 'PROJECT'] as const;
export type ProcessAppliesTo = (typeof PROCESS_APPLIES_TO)[number];

export const PROCESS_CADENCES = ['ONCE', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM'] as const;
export type ProcessCadence = (typeof PROCESS_CADENCES)[number];

export const PROCESS_CUSTOM_UNITS = ['DAY', 'WEEK', 'MONTH'] as const;
export type ProcessCustomUnit = (typeof PROCESS_CUSTOM_UNITS)[number];

export const PROCESS_STATUSES = ['DRAFT', 'PUBLISHED'] as const;
export type ProcessTemplateStatus = (typeof PROCESS_STATUSES)[number];

export const CADENCE_OPTIONS: Array<{ value: ProcessCadence; label: string }> = [
  { value: 'ONCE', label: 'One time' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Every two weeks' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'CUSTOM', label: 'Custom' },
];

export interface ProcessStepInput {
  title: string;
  detail: string;
  explanation: string | null;
  referenceUrl: string | null;
}

export interface ProcessTemplateInput {
  name: string;
  purpose: string | null;
  appliesTo: ProcessAppliesTo;
  cadence: ProcessCadence;
  customEvery: number | null;
  customUnit: ProcessCustomUnit | null;
  steps: ProcessStepInput[];
}

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function optionalText(value: unknown): string | null {
  const text = cleanText(value);
  return text || null;
}

function referenceUrl(value: unknown): { ok: true; value: string | null } | { ok: false; error: string } {
  const text = optionalText(value);
  if (!text) return { ok: true, value: null };
  try {
    const url = new URL(text);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { ok: false, error: 'The reference link must be a web address' };
    }
  } catch {
    return { ok: false, error: 'The reference link must be a web address' };
  }
  return { ok: true, value: text };
}

export function cadenceLabel(
  cadence: ProcessCadence,
  customEvery?: number | null,
  customUnit?: ProcessCustomUnit | null,
): string {
  if (cadence === 'ONCE') return 'One time';
  if (cadence === 'DAILY') return 'Daily';
  if (cadence === 'WEEKLY') return 'Weekly';
  if (cadence === 'BIWEEKLY') return 'Every two weeks';
  if (cadence === 'MONTHLY') return 'Monthly';
  if (cadence === 'QUARTERLY') return 'Quarterly';
  if (cadence === 'YEARLY') return 'Yearly';
  if (!customEvery || !customUnit) return 'Custom';
  const names = customEvery === 1
    ? { DAY: 'day', WEEK: 'week', MONTH: 'month' }
    : { DAY: 'days', WEEK: 'weeks', MONTH: 'months' };
  return `Every ${customEvery} ${names[customUnit]}`;
}

export function scheduleLabel(
  appliesTo: ProcessAppliesTo,
  cadence: ProcessCadence,
  customEvery?: number | null,
  customUnit?: ProcessCustomUnit | null,
): string {
  const place = appliesTo === 'PROJECT' ? 'Project' : 'Standalone';
  return `${place} · ${cadenceLabel(cadence, customEvery, customUnit)}`;
}

export function taskInstructions(detail: string, explanation: string | null): string {
  const primary = detail.trim();
  const extra = (explanation || '').trim();
  if (!extra || extra === primary) return primary;
  return primary ? `${primary}\n${extra}` : extra;
}

export function placementForTemplate(
  template: { appliesTo: ProcessAppliesTo; cadence: ProcessCadence; status?: ProcessTemplateStatus },
  projectId: string | null,
): { ok: true; projectId: string | null; cadence: ProcessCadence } | { ok: false; error: string } {
  if (template.status && template.status !== 'PUBLISHED') {
    return { ok: false, error: 'Publish this process before using it' };
  }
  if (template.appliesTo === 'TEAM') {
    if (projectId) return { ok: false, error: 'A standalone process is not tied to a project' };
    return { ok: true, projectId: null, cadence: template.cadence };
  }
  if (!projectId) return { ok: false, error: 'Choose a project for this process' };
  return { ok: true, projectId, cadence: template.cadence };
}

export function validateProcessTemplate(body: Record<string, unknown>): { ok: true; value: ProcessTemplateInput } | { ok: false; error: string } {
  const name = cleanText(body.name);
  if (!name) return { ok: false, error: 'Name is required' };
  if (name.length > 200) return { ok: false, error: 'Name is too long' };

  const purpose = optionalText(body.purpose);
  if (purpose && purpose.length > 2000) return { ok: false, error: 'Purpose is too long' };

  const appliesRaw = cleanText(body.appliesTo) || 'TEAM';
  if (!PROCESS_APPLIES_TO.includes(appliesRaw as ProcessAppliesTo)) {
    return { ok: false, error: 'Choose standalone or project' };
  }
  const appliesTo = appliesRaw as ProcessAppliesTo;

  const cadenceRaw = cleanText(body.cadence) || 'ONCE';
  if (!PROCESS_CADENCES.includes(cadenceRaw as ProcessCadence)) {
    return { ok: false, error: 'Choose how often this process runs' };
  }
  const cadence = cadenceRaw as ProcessCadence;

  let customEvery: number | null = null;
  let customUnit: ProcessCustomUnit | null = null;
  if (cadence === 'CUSTOM') {
    const every = typeof body.customEvery === 'number' ? body.customEvery : Number(cleanText(body.customEvery));
    if (!Number.isInteger(every) || every < 1 || every > 365) {
      return { ok: false, error: 'A custom repeat is a whole number from 1 to 365' };
    }
    const unit = cleanText(body.customUnit);
    if (!PROCESS_CUSTOM_UNITS.includes(unit as ProcessCustomUnit)) {
      return { ok: false, error: 'Choose days, weeks, or months for a custom repeat' };
    }
    customEvery = every;
    customUnit = unit as ProcessCustomUnit;
  }

  if (!Array.isArray(body.steps) || body.steps.length === 0) {
    return { ok: false, error: 'Add at least one task' };
  }

  const steps: ProcessStepInput[] = [];
  for (const raw of body.steps) {
    if (!raw || typeof raw !== 'object') return { ok: false, error: 'Each task needs a title' };
    const step = raw as Record<string, unknown>;
    const title = cleanText(step.title);
    const detail = cleanText(step.detail) || cleanText(step.instructions);
    if (!title) return { ok: false, error: 'Each task needs a title' };
    if (title.length > 200) return { ok: false, error: 'A task title is too long' };
    if (detail.length > 4000) return { ok: false, error: 'Task instructions are too long' };
    const link = referenceUrl(step.referenceUrl);
    if (!link.ok) return link;
    steps.push({
      title,
      detail,
      explanation: optionalText(step.explanation),
      referenceUrl: link.value,
    });
  }

  return { ok: true, value: { name, purpose, appliesTo, cadence, customEvery, customUnit, steps } };
}

export function processTemplateJson(template: {
  id: string;
  name: string;
  purpose: string | null;
  appliesTo: ProcessAppliesTo;
  cadence: ProcessCadence;
  customEvery: number | null;
  customUnit: ProcessCustomUnit | null;
  status: ProcessTemplateStatus;
  publishedAt: Date | null;
  steps: Array<{
    id: string;
    title: string;
    detail: string;
    explanation: string | null;
    referenceUrl: string | null;
  }>;
}) {
  return {
    id: template.id,
    name: template.name,
    purpose: template.purpose,
    appliesTo: template.appliesTo,
    cadence: template.cadence,
    customEvery: template.customEvery,
    customUnit: template.customUnit,
    status: template.status,
    publishedAt: template.publishedAt ? template.publishedAt.toISOString() : null,
    steps: template.steps.map((step) => ({
      id: step.id,
      title: step.title,
      detail: step.detail,
      explanation: step.explanation,
      referenceUrl: step.referenceUrl,
    })),
  };
}
