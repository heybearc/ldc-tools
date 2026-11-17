import type { ReactNode } from 'react';

/**
 * Admin app shell pieces.
 *
 * Copy this file into another app and pair it with a full-width route frame
 * (no nested max-width container). The contract is in docs/standards/admin-app-shell.md.
 */

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
        {description ? <p className="mt-1 text-sm text-gray-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** White surface. Wide tables scroll inside the frame; they do not push the page sideways. */
export function AdminTableFrame({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
