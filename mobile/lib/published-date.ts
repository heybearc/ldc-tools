export function publishedOn(iso: string | null | undefined) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function byTime<T>(rows: T[], time: (row: T) => string | null | undefined, newestFirst: boolean) {
  return [...rows].sort((a, b) => {
    const left = Date.parse(time(a) || '') || 0;
    const right = Date.parse(time(b) || '') || 0;
    return newestFirst ? right - left : left - right;
  });
}
