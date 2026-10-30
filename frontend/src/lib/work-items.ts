export const WORK_TIMING_KINDS = ['DEADLINE', 'PROJECT_DATE', 'MONTHLY', 'YEARLY', 'PROCESS', 'CREW_REQUEST', 'NONE'] as const;
export type WorkTimingKind = (typeof WORK_TIMING_KINDS)[number];

export const PERSONNEL_ROLE_CODES = ['PC', 'PCA', 'PC-Support', 'PC_SUPPORT'] as const;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface WorkItemInput {
  title: string;
  detail: string;
  explanation: string | null;
  referenceUrl: string | null;
  timingKind: WorkTimingKind;
  dueOn: string | null;
  projectId: string | null;
  claimable: boolean;
  assigneeId: string | null;
  requestorName: string | null;
  requestorEmail: string | null;
}

export function isPersonnelRole(role: string): boolean {
  return (PERSONNEL_ROLE_CODES as readonly string[]).includes(role);
}

export function formatCalendarDate(value: string | null | undefined): string {
  if (!value) return '';
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return '';
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

export function timingLabel(
  kind: WorkTimingKind,
  dueOn: string | null,
  projectName: string | null,
): string {
  if (kind === 'MONTHLY') return 'Monthly';
  if (kind === 'YEARLY') return 'Yearly';
  if (kind === 'PROCESS') return projectName ? `Process · ${projectName}` : 'Process';
  if (kind === 'CREW_REQUEST') return 'Crew request';
  if (kind === 'NONE') return 'No deadline';
  const date = formatCalendarDate(dueOn);
  if (kind === 'PROJECT_DATE') {
    return [date, projectName].filter(Boolean).join(' · ');
  }
  return date;
}

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function optionalText(value: unknown): string | null {
  const text = cleanText(value);
  return text || null;
}

export function validateWorkItemInput(body: Record<string, unknown>): { ok: true; value: WorkItemInput } | { ok: false; error: string } {
  const title = cleanText(body.title);
  const detail = cleanText(body.detail);
  if (!title) return { ok: false, error: 'Title is required' };
  if (!detail) return { ok: false, error: 'Detail is required' };
  if (title.length > 200) return { ok: false, error: 'Title is too long' };

  const timingKind = body.timingKind;
  if (typeof timingKind !== 'string' || !(WORK_TIMING_KINDS as readonly string[]).includes(timingKind)) {
    return { ok: false, error: 'Choose a deadline, no deadline, a project date, or a monthly or yearly repeat' };
  }

  const dueOn = optionalText(body.dueOn);
  if ((timingKind === 'DEADLINE' || timingKind === 'PROJECT_DATE') && !dueOn) {
    return { ok: false, error: 'A date is required' };
  }
  if (timingKind === 'PROCESS' && dueOn) {
    return { ok: false, error: 'A process step does not take a date' };
  }
  if (timingKind === 'CREW_REQUEST' && dueOn) {
    return { ok: false, error: 'A crew request does not take a date' };
  }
  if (dueOn && !/^\d{4}-\d{2}-\d{2}$/.test(dueOn)) {
    return { ok: false, error: 'Use a calendar date' };
  }

  const projectId = optionalText(body.projectId);
  if (timingKind === 'PROJECT_DATE' && !projectId) {
    return { ok: false, error: 'A project date needs a project' };
  }

  const referenceUrl = optionalText(body.referenceUrl);
  if (referenceUrl) {
    try {
      const url = new URL(referenceUrl);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return { ok: false, error: 'The reference link must be a web address' };
      }
    } catch {
      return { ok: false, error: 'The reference link must be a web address' };
    }
  }

  const requestorEmail = optionalText(body.requestorEmail);
  if (requestorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requestorEmail)) {
    return { ok: false, error: 'Requestor email is not valid' };
  }

  return {
    ok: true,
    value: {
      title,
      detail,
      explanation: optionalText(body.explanation),
      referenceUrl,
      timingKind: timingKind as WorkTimingKind,
      dueOn: timingKind === 'MONTHLY' || timingKind === 'YEARLY' || timingKind === 'PROCESS' || timingKind === 'CREW_REQUEST' || timingKind === 'NONE' ? null : dueOn,
      projectId,
      claimable: body.claimable === true,
      assigneeId: optionalText(body.assigneeId),
      requestorName: optionalText(body.requestorName),
      requestorEmail,
    },
  };
}

export function dueOnDate(value: string | null): Date | null {
  if (!value) return null;
  return new Date(`${value}T00:00:00.000Z`);
}
