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

export function isReleaseCheckTitle(title: string) {
  const value = title.trim();
  return value.startsWith('QA ')
    || value.startsWith('Release check')
    || value.includes('QA Volunteer')
    || value.includes('Release check volunteer');
}

/** Release-gate mail goes here instead of the construction group. */
export function operatorTestEmail() {
  return (process.env.MAIL_TEST_RECIPIENT || 'corya1992@gmail.com').trim();
}

export type WorkNoticeItem = { id?: string; title: string; detail?: string | null };
export type NoticeScope = 'group' | 'operator';

function scopedItems(items: WorkNoticeItem[], scope: NoticeScope) {
  return items.filter((item) => {
    const title = item.title.trim();
    if (!title) return false;
    return isReleaseCheckTitle(title) === (scope === 'operator');
  });
}

export function claimableNoticeItems(items: WorkNoticeItem[]) {
  return scopedItems(items, 'group');
}

export function workAvailableAlert(items: WorkNoticeItem[]) {
  const real = claimableNoticeItems(items);
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

export function workToolsUrl(path: string, baseUrl = process.env.NEXTAUTH_URL || 'https://ldctools.com') {
  const base = baseUrl.replace(/\/$/, '');
  const route = path.startsWith('/') ? path : `/${path}`;
  return `${base}${route}`;
}

export function workAvailableMessage(items: WorkNoticeItem[], baseUrl?: string, scope: NoticeScope = 'group') {
  const real = scopedItems(items, scope);
  const alert = scope === 'group'
    ? workAvailableAlert(items)
    : (real.length === 0 ? null : {
        title: 'Work available',
        body: real.length === 1 ? real[0].title.trim() : `${real.length} tasks are available`,
        url: real.length === 1 && real[0].id ? `/work#work-${real[0].id}` : '/work',
        workItemId: real.length === 1 ? (real[0].id || '') : '',
      });
  if (!alert) return null;
  const link = workToolsUrl(alert.url, baseUrl);
  const titles = real.map((item) => item.title.trim()).slice(0, 40);
  const extra = real.length - titles.length;
  const detail = real.length === 1 ? (real[0].detail || '').trim() : '';
  const subject = (scope === 'operator' ? '[test] ' : '') + (real.length === 1
    ? `Work available — ${real[0].title.trim()}`
    : `Work available — ${real.length} tasks`);
  const lead = scope === 'operator'
    ? 'Release check. This copy goes only to the operator.'
    : 'This work is available to claim.';
  const text = [
    lead,
    '',
    ...titles,
    ...(extra > 0 ? [`and ${extra} more`] : []),
    ...(detail ? ['', detail] : []),
    '',
    link,
  ].join('\n');
  return {
    subject: subject.slice(0, 140),
    text,
    link,
    titles,
    extra,
    detail,
    lead,
    pushTitle: alert.title,
    pushBody: alert.body,
    pushUrl: alert.url,
    workItemId: alert.workItemId,
  };
}

export function workAssignedMessage(items: WorkNoticeItem[], baseUrl?: string, scope: NoticeScope = 'group') {
  const real = scopedItems(items, scope);
  if (real.length === 0) return null;
  const id = real.length === 1 ? (real[0].id || '') : '';
  const link = workToolsUrl(id ? `/work#work-${id}` : '/my-work', baseUrl);
  const titles = real.map((item) => item.title.trim()).slice(0, 40);
  const extra = real.length - titles.length;
  const detail = real.length === 1 ? (real[0].detail || '').trim() : '';
  const subject = (scope === 'operator' ? '[test] ' : '') + (real.length === 1
    ? `Work assigned — ${real[0].title.trim()}`
    : `Work assigned — ${real.length} tasks`);
  const lead = scope === 'operator'
    ? 'Release check. This copy goes only to the operator.'
    : 'This work was assigned to you.';
  const text = [
    lead,
    '',
    ...titles,
    ...(extra > 0 ? [`and ${extra} more`] : []),
    ...(detail ? ['', detail] : []),
    '',
    link,
  ].join('\n');
  return {
    subject: subject.slice(0, 140),
    text,
    link,
    titles,
    extra,
    detail,
    lead,
    pushTitle: 'Work assigned',
    pushBody: real.length === 1 ? real[0].title.trim() : `${real.length} tasks were assigned to you`,
    pushUrl: id ? `/work#work-${id}` : '/my-work',
    workItemId: id,
  };
}

export function assigneeToNotify(beforeId: string | null, afterId: string | null, actorId: string) {
  if (!afterId || afterId === beforeId || afterId === actorId) return null;
  return afterId;
}
