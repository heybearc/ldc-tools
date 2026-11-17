export function workAlertPath(data: unknown) {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  if (record.kind !== 'work') return null;
  const id = typeof record.workItemId === 'string' ? record.workItemId.trim() : '';
  return id ? `/work/${id}` : '/available';
}
