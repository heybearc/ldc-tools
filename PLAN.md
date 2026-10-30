# LDC Tools Plan

**Last updated:** 2026-10-29  
**Current phase:** Region work queue  
**Status:** v1.32.0 is LIVE on green (CT135) at `33baf50`. Slice 3 (`58009bd`) is on STANDBY blue (CT133), not shipped. Hub dates are paused.

---

## Current Phase

### Active Work
- [x] Resume fleet app (CTs, HAProxy, MCP/SSH, DB VIP) (effort: M)
- [x] Deploy latest `main` to STANDBY (green) (effort: S)
- [x] Product brief + import template for Trade Leadership Directory (effort: S)
- [x] Import CG 01.12 hub scrape → oversight tables (effort: M)
- [x] Place Hart + Miller-Sieving as TT Support on placeholder team TBD (effort: S)
- [x] Show hub headshots for all 190 imported people (effort: M)
- [x] Soft-land homepage → directory; hide legacy noise (effort: M)
- [x] Directory search, copy email, add person, edit, end date (effort: M)
- [x] qa-01 release gate, then `/ship` v1.28.0 (effort: S)
- [x] Move people across trades and roles; sisters only Support; `/ship` v1.29.0 (effort: M)
- [x] Retire empty Site/Civil (Sitework/Civil stays) (effort: S)
- [x] Home is the directory; open a team; place a photo; `/ship` v1.30.0 (effort: M)
- [x] Slice 1 — directory groups (Construction group and ancillary, same construction group only)
- [x] Slice 2 — work list
- [x] Slice 3 — projects
- [ ] Slices 4–6 below, in order

### Completed This Phase
- ✅ Resume from Level B — CT133/135 running, onboot on (2026-10-26)
- ✅ D-068 — blue IP `10.92.3.34` (Postgres VIP keeps `.23`)
- ✅ v1.28.0 LIVE green CT135, STANDBY blue CT133, both `fe08a8c` (2026-10-27)
- ✅ v1.29.0 LIVE blue CT133, STANDBY green CT135, both `3222e09` (2026-10-27)
- ✅ v1.30.0 LIVE green CT135, STANDBY blue CT133, both `e11cb3d` (2026-10-28)
- ✅ Oversight import: 195 rows, 190 people, all with photos

---

## Build order

Each slice ships to standby before the next one starts. Every new list is limited to the signed-in construction group. CG 01.12 is the first group. Another region sees only its own rows.

People already on the construction group:

- **Personnel** assign tasks: Personnel Contact, Assistant, and Support (`PC`, `PCA`, `PC-Support`). Support for Amber Allen, Kennedy Allen, Ruth Hirsch, Amber Williams, and Cory L Test is a volunteer role, not a `PersonnelContact` row. Read both.
- **Oversight** assigns Personnel to projects: Construction Group Overseer, Assistant, and Support (`CGO`, `ACGO`, `CG-Support`).
- A claimable task can be claimed, or self-assigned, by anyone signed in to that construction group.

### 1. Directory groups — done

Show three groups on the directory, all for the signed-in construction group:

- Trade teams and crews (already there)
- Construction group: Personnel Contact, Assistant, Support
- Ancillary: other region-support and construction-group staff who are not trade oversight

A directory contact who is not Personnel stays a contact. Do not create a login for them. Splitting those contacts off the user table waits until after slice 6.

Done when the directory lists Personnel and ancillary people beside the trades, and a person from another construction group does not appear.

### 2. Work list — done

Add one work item, scoped to the construction group. This is the list processes, project dates, and crew requests all feed.

Fields: title, detail, optional explanation, optional reference link, timing, project (optional), claimable or not, assignee, status, requestor name and email (optional).

Timing is one of: a deadline, a date on a project, or a repeat of monthly or yearly.

Personnel can create a task and assign it. If it is claimable, a signed-in teammate can claim it or assign themselves. The list shows the timing on the row.

Done when Personnel can post a task, assign it, and a teammate can claim a claimable one. The row shows deadline, project date, or repeat.

### 3. Projects — done

Unhide a short projects page. Fields to show: name, number, location, status, start, end, Builder Assistant link. Oversight assigns Personnel to the project. No crew assignment, no budget, no congregation.

Done when Oversight can put a Personnel person on a project, and the project list is only that construction group.

### 4. Project schedule

Dated work on a project, such as PPS meeting prep or assessment queues setup. Each entry is also a work item with that date, so it shows on the work list. Do not bring back the old trade-crew calendar. `ProjectScheduleEntry` is shaped for trade crews and volunteer counts; store these items as work items with a project and a date instead of reusing that shape.

Done when a dated project item appears on the project and on the work list.

### 5. Processes

A process template belongs to the construction group. Each step has an explanation and an optional reference document. Starting a process creates work items for those steps, on a project when one is chosen.

Done when a template can be started and its steps show on the work list with their explanations.

### 6. Crew-request import

Import the Microsoft Form spreadsheet. Each row becomes a work item. There is no form to fill out. Use the detail already stored on a crew-change request: requestor, volunteer, crew, project, comments. Map the sheet’s columns once, when the file is in hand. Completing the item records that it is done and keeps the requestor on the row so they can be told. Send email when mail is already configured. Do not block this slice on new email setup.

Done when a spreadsheet import creates claimable tasks, someone can finish one, and the requestor is still on that task.

### Paused

Hub start and end dates. Waiting on the Persons export. If a person has an older assignment and a newer one, keep the current assignment.

### Do not build

Volunteer roster, congregation assignment, budget, crew-to-project assignment, the hierarchy editor, a separate calendar, and logins for directory contacts who are not Personnel.

Mobile and PWA wait until the work list is in use.

## Prioritized Backlog

### High Priority
- [ ] Slices 1–6 above

### Do not archive
Projects and crew-change requests stay. The schedule is dated work on the work list, not the old crew calendar. Archive the volunteer roster, congregations, budget, and crew-to-project assignment.
- [x] Fix TypeScript error in ImportExportButtons.tsx (effort: S)

### Medium Priority
- [ ] Expand LDC smoke coverage beyond qa-01 quick suite (effort: M)
- [ ] Enhanced error messages across application (effort: M)

### Low Priority
- [ ] Performance optimizations for large datasets (effort: L)
- [ ] Code quality improvements — lint warnings, logging (effort: M)

---

## Notes

- HAProxy ACL: `is_ldc` → LIVE backend; `is_ldc_blue` / `is_ldc_green` for color hosts
- DB: `postgresql://…@10.92.3.23:5432/ldc_tools` (RW VIP)
- LIVE is green (CT135) at `33baf50`. STANDBY is blue (CT133) at `58009bd` (projects, not shipped).
