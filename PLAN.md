# LDC Tools Plan

**Last updated:** 2026-10-30  
**Current phase:** Region work queue  
**Status:** v1.41.0 is LIVE on green (CT135) at `16ffef1` and synced to blue (CT133). Slices 1–6 are shipped. Hub dates are paused.

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
- [x] Slice 3 — projects; `/ship` v1.33.0
- [x] Slice 4 — project dates on the project and the work list
- [x] Slice 5 — process templates; `/ship` v1.35.0
- [x] Admin link, Personnel user list, construction-group access; `/ship` v1.36.0
- [x] CG 01.12 Personnel roster loaded; profile links on STANDBY (`12d9e2b`)
- [x] Directory profiles, invite form, toasts; `/ship` v1.37.0 and v1.38.0
- [x] Resend Invitation; `/ship` v1.38.1
- [x] Slice 6 — crew-request spreadsheet import onto the work list
- [x] Slice 8 — directory contacts are not sign-in accounts

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
- Construction group: overseer, assistant, and support
- Personnel: Personnel Contact, Assistant, and Support
- Ancillary: other region-support and construction-group staff who are not those two groups

A directory contact who is not Personnel stays a contact. Do not create a login for them. New trade and crew people are directory contacts. People who already have an account stay on that account.

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

Done when a dated project item appears on the project and on the work list. Personnel add the date on the project. It is a work item with that project and date.

### 5. Processes

A process template belongs to the construction group. Each step has an explanation and an optional reference document. Starting or claiming a process creates one work item. The steps stay inside it.

Done when a template can be started and its steps show on the work list with their explanations.

### 6. Crew-request import — done

Import the Microsoft Form spreadsheet `Construction Group 01.12 LDC Crew Update Request`. Each row becomes a claimable work item. Columns: ID, Your Email, Choose an Action, Your Name, Volunteer Name, Volunteer BA ID, Crew Name, Project Roster Name, Questions or Comments. Completing the item keeps the requestor and sends email when mail is already configured. Importing the same form ID again does not add a second task.

Done when a spreadsheet import creates claimable tasks, someone can finish one, and the requestor is still on that task.

### 7. Hub assignments — in progress

The persons list is in `docs/templates/LDC-Trade-Leadership-Import-Template.xlsx` (the sheet with Mobile Phone and Email Address). It has current roles and no start or end dates.

A fully listed role names the trade and, for a crew role, the crew. Those are the current assignments. Any other assignment for that person is older. A role with no crew is incomplete, and that person is left unchanged. Nothing is written until the dates are in the list.

Done when an older assignment gets an end date and the directory shows the current one.

### 8. Directory contacts — done

A person added on a trade or crew is a directory contact. That add does not create a sign-in account. Someone who already has an account keeps it, and the new role is attached to that account. People who have signed in are not removed.

Done when a new trade or crew person shows on the directory and does not appear as a user who can be invited.

### Do not build

Volunteer roster, congregation assignment, budget, crew-to-project assignment, the hierarchy editor, a separate calendar, and logins for directory contacts who are not Personnel.

The phone layout of the website is in progress. The store app is a separate Expo project in `mobile/`. It signs in with the same email and password and reads My Work and the directory. Team chat notifications on the website stay browser push.

## Prioritized Backlog

### High Priority
- [x] Slices 1–6 above

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
- LIVE is blue (CT133) at `9f368a3`. STANDBY is green (CT135) at `8b8291c` (work follow-on and chat, not shipped).
