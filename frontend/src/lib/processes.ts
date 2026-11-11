export const PROCESS_APPLIES_TO = ['TEAM', 'PROJECT'] as const;
export type ProcessAppliesTo = (typeof PROCESS_APPLIES_TO)[number];

export const PROCESS_CADENCES = ['ONCE', 'WEEKLY', 'MONTHLY'] as const;
export type ProcessCadence = (typeof PROCESS_CADENCES)[number];

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

export function scheduleLabel(appliesTo: ProcessAppliesTo, cadence: ProcessCadence): string {
  if (appliesTo === 'TEAM') return 'Team · Monthly';
  return cadence === 'WEEKLY' ? 'Project · Weekly' : 'Project · Once';
}

export function taskInstructions(detail: string, explanation: string | null): string {
  const primary = detail.trim();
  const extra = (explanation || '').trim();
  if (!extra || extra === primary) return primary;
  return primary ? `${primary}\n${extra}` : extra;
}

export function placementForTemplate(
  template: { appliesTo: ProcessAppliesTo; cadence: ProcessCadence },
  projectId: string | null,
): { ok: true; projectId: string | null; cadence: ProcessCadence } | { ok: false; error: string } {
  if (template.appliesTo === 'TEAM') {
    if (projectId) return { ok: false, error: 'A team process is monthly and is not tied to a project' };
    return { ok: true, projectId: null, cadence: 'MONTHLY' };
  }
  if (!projectId) return { ok: false, error: 'Choose a project for this process' };
  if (template.cadence !== 'ONCE' && template.cadence !== 'WEEKLY') {
    return { ok: false, error: 'A project process is once or weekly' };
  }
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
    return { ok: false, error: 'Choose team or project' };
  }
  const appliesTo = appliesRaw as ProcessAppliesTo;

  const cadenceRaw = cleanText(body.cadence) || (appliesTo === 'TEAM' ? 'MONTHLY' : 'ONCE');
  if (!PROCESS_CADENCES.includes(cadenceRaw as ProcessCadence)) {
    return { ok: false, error: 'Choose how often this process runs' };
  }
  const cadence = cadenceRaw as ProcessCadence;
  if (appliesTo === 'TEAM' && cadence !== 'MONTHLY') {
    return { ok: false, error: 'A team process is monthly' };
  }
  if (appliesTo === 'PROJECT' && cadence === 'MONTHLY') {
    return { ok: false, error: 'A project process is once or weekly' };
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

  return { ok: true, value: { name, purpose, appliesTo, cadence, steps } };
}
