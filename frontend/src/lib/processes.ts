export interface ProcessStepInput {
  title: string;
  detail: string;
  explanation: string | null;
  referenceUrl: string | null;
}

export interface ProcessTemplateInput {
  name: string;
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

export function validateProcessTemplate(body: Record<string, unknown>): { ok: true; value: ProcessTemplateInput } | { ok: false; error: string } {
  const name = cleanText(body.name);
  if (!name) return { ok: false, error: 'Name is required' };
  if (name.length > 200) return { ok: false, error: 'Name is too long' };
  if (!Array.isArray(body.steps) || body.steps.length === 0) {
    return { ok: false, error: 'Add at least one step' };
  }

  const steps: ProcessStepInput[] = [];
  for (const raw of body.steps) {
    if (!raw || typeof raw !== 'object') return { ok: false, error: 'Each step needs a title and detail' };
    const step = raw as Record<string, unknown>;
    const title = cleanText(step.title);
    const detail = cleanText(step.detail);
    if (!title || !detail) return { ok: false, error: 'Each step needs a title and detail' };
    if (title.length > 200) return { ok: false, error: 'A step title is too long' };
    const link = referenceUrl(step.referenceUrl);
    if (!link.ok) return link;
    steps.push({
      title,
      detail,
      explanation: optionalText(step.explanation),
      referenceUrl: link.value,
    });
  }

  return { ok: true, value: { name, steps } };
}
