# Admin app shell

Use this on every admin console (LDC Tools and the other apps). It is the usual SaaS admin frame: a full-width workspace, a compact nav rail, and pages that scroll inside that workspace.

## Frame

1. The product nav stays. Under it, the admin route is **full width**. Do not wrap it in `max-w-7xl` or `container`.
2. One header bar: admin title on the left, environment on the right.
3. A sticky nav rail (`w-64`) with icon + label only. Put longer explanations in the link `title`, not a second line.
4. The canvas is `min-w-0 flex-1` with one padding owner (`px-4 sm:px-6 lg:px-8`). Pages do not add another centered container.
5. Hide the marketing footer on admin routes.

Reference: `frontend/src/app/admin/layout.tsx` and `frontend/src/components/admin/shell.tsx`.

## Page

- `AdminPageHeader`: title, one-line description, primary action on the right.
- One white surface per main task. Filters sit above the surface, not in the nav rail.
- Tables use `AdminTableFrame`.
- The title column is the only flexible column (`w-full max-w-0` plus `truncate`). Every other column is `whitespace-nowrap`.
- The actions column is `sticky right-0` so Edit and Delete stay visible when the table scrolls.
- Empty, loading, and error states live in the surface, not a full-viewport spinner.

## Do not

- Nest a second `max-w-*` inside the shell.
- Give every nav item a description line.
- Let a table's minimum content width become the page width.
