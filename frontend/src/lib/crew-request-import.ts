import { canEmailAddress } from '@/lib/reachable-email';

export interface CrewRequestRow {
  importKey: string | null;
  title: string;
  detail: string;
  requestorName: string | null;
  requestorEmail: string | null;
}

export interface CrewRequestParseResult {
  rows: CrewRequestRow[];
  skipped: number;
  error: string | null;
}

const REQUIRED_HEADERS = ['choose an action', 'volunteer name', 'your name', 'your email'];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cell(row: Record<string, unknown>, header: string): string {
  const key = Object.keys(row).find((item) => item.trim().toLowerCase() === header);
  if (!key) return '';
  const value = row[key];
  if (value == null) return '';
  return String(value).trim();
}

function hasFormHeaders(row: Record<string, unknown>): boolean {
  const keys = new Set(Object.keys(row).map((item) => item.trim().toLowerCase()));
  return REQUIRED_HEADERS.every((header) => keys.has(header));
}

export function parseCrewRequestRows(rows: Record<string, unknown>[]): CrewRequestParseResult {
  if (rows.length === 0) {
    return { rows: [], skipped: 0, error: 'The spreadsheet has no responses' };
  }
  if (!hasFormHeaders(rows[0])) {
    return {
      rows: [],
      skipped: 0,
      error: 'This file is not the crew update form. It needs Choose an Action, Volunteer Name, Your Name, and Your Email.',
    };
  }

  const seen = new Set<string>();
  const parsed: CrewRequestRow[] = [];
  let skipped = 0;

  for (const row of rows) {
    const action = cell(row, 'choose an action');
    const volunteer = cell(row, 'volunteer name');
    if (!action && !volunteer) {
      skipped += 1;
      continue;
    }

    const id = cell(row, 'id');
    const importKey = id ? `crew-form:${id}` : null;
    if (importKey && seen.has(importKey)) {
      skipped += 1;
      continue;
    }
    if (importKey) seen.add(importKey);

    const requestorName = cell(row, 'your name') || null;
    const rawEmail = cell(row, 'your email');
    const requestorEmail = EMAIL.test(rawEmail) && canEmailAddress(rawEmail) ? rawEmail : null;
    const baId = cell(row, 'volunteer ba id (if known)');
    const crew = cell(row, 'crew name');
    const project = cell(row, 'project roster name');
    const comments = cell(row, 'questions or comments');
    const titleSource = volunteer ? `${action || 'Crew request'}: ${volunteer}` : action;
    const title = titleSource.slice(0, 200);
    const lines = [
      volunteer ? `Volunteer: ${volunteer}` : '',
      baId ? `BA ID: ${baId}` : '',
      crew ? `Crew: ${crew}` : '',
      project ? `Project roster: ${project}` : '',
      !requestorEmail && rawEmail ? `Requestor email: ${rawEmail}` : '',
      comments ? `Comments: ${comments}` : '',
    ].filter(Boolean);

    parsed.push({
      importKey,
      title,
      detail: lines.join('\n') || title,
      requestorName,
      requestorEmail,
    });
  }

  if (parsed.length === 0) {
    return { rows: [], skipped, error: 'No crew requests were found in that spreadsheet' };
  }

  return { rows: parsed, skipped, error: null };
}
