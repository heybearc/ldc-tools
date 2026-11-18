/** A different assignee, or a return to the pool, must press Start again. */
export function startedAtAfterAssigneeChange(
  previousAssigneeId: string | null,
  nextAssigneeId: string | null,
): null | undefined {
  return previousAssigneeId === nextAssigneeId ? undefined : null;
}
