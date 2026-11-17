export type PoolState = {
  status: string;
  claimable: boolean;
  assigneeId: string | null;
};

export function enteredClaimPool(before: PoolState | null, after: PoolState) {
  const waiting = after.status === 'OPEN' && after.claimable && !after.assigneeId;
  if (!waiting) return false;
  if (!before) return true;
  return !(before.status === 'OPEN' && before.claimable && !before.assigneeId);
}

function releaseCheckTitle(title: string) {
  return title.startsWith('QA ') || title.includes('QA Volunteer');
}

export function workAvailableAlert(items: Array<{ id?: string; title: string }>) {
  const real = items.filter((item) => item.title.trim() && !releaseCheckTitle(item.title));
  if (real.length === 0) return null;
  if (real.length === 1) {
    const id = real[0].id || '';
    return {
      title: 'Work available',
      body: real[0].title.trim(),
      url: id ? `/work#work-${id}` : '/work',
      workItemId: id,
    };
  }
  return {
    title: 'Work available',
    body: `${real.length} tasks are available`,
    url: '/work',
    workItemId: '',
  };
}
