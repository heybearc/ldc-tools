export type DatedAssignment = {
  id: string;
  role: string;
  isActive: boolean;
  startDate: Date | null;
  endDate: Date | null;
};

export type VisibleAssignment<T extends DatedAssignment> = T & {
  awaitingReplacement: boolean;
};

/** Ended assignments stay visible until another active person in the same role has a start date on or after the end date. */
export function visibleAssignments<T extends DatedAssignment>(rows: T[]): VisibleAssignment<T>[] {
  return rows.flatMap((row) => {
    if (row.isActive) {
      return [{ ...row, awaitingReplacement: false }];
    }
    if (!row.endDate) return [];
    const replaced = rows.some(
      (other) =>
        other.id !== row.id &&
        other.role === row.role &&
        other.isActive &&
        other.startDate != null &&
        other.startDate >= row.endDate!
    );
    if (replaced) return [];
    return [{ ...row, awaitingReplacement: true }];
  });
}

export function dateInputValue(value: Date | string | null | undefined): string {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

export function parseDirectoryDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const day = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  return new Date(`${day}T12:00:00.000Z`);
}
