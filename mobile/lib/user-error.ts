const GENERIC = /^(failed to\b|unauthorized|forbidden|not found|save failed|failed to fetch|network request failed|internal server error)/i;

export function userError(status: number, serverMessage: unknown, action: string): string {
  const specific = typeof serverMessage === 'string' ? serverMessage.trim() : '';
  if (specific && !GENERIC.test(specific)) return specific;
  if (status === 401) return 'Sign in again. This session is no longer valid.';
  if (status === 403) return 'You do not have access to do that.';
  if (status === 404) return 'That item is no longer here.';
  if (status === 400 || status === 422) return 'Check the fields and try again.';
  if (status === 0) return 'Could not reach the server. Check the connection and try again.';
  const lead = action.replace(/\.$/, '');
  return `${lead}. Try again in a moment.`;
}
