# Product Brief — LDC Team Board (v1)

**Date:** 2026-10-26  
**Status:** Draft  
**Owner:** LDC personnel / project support team  
**App:** ldc-tools (`ldctools.com`) — resumed; repositioned as team reference tooling (not BA system of record)

---

## Problem

When setting up or managing projects in BA, the team needs a fast, trusted answer to: **which Trade Team / Trade Crew leadership to add, and who to contact for a given trade.** That knowledge lives in spreadsheets, memory, and screenshots. Wrong or stale contacts slow project setup and outreach.

## Product thesis

LDC Tools becomes a **team reference + task workspace**.  
**v1 is not a full task product** — it is a **Trade Leadership Directory**: Trade Teams → Trade Crews → oversight roles only (not full crew membership).

## v1 — Trade Leadership Directory

### In scope

| Level | Roles | Purpose |
|-------|--------|---------|
| **Trade Team** (trade) | TTO, TTOA, TT Support | Who owns the trade at team level |
| **Trade Crew** (under team) | TCO, TCOA, TC Support | Who owns each crew / discipline under that trade |

For each person: name, email (and phone if available), role, active dates, trade/crew name, optional notes.

**Jobs to be done**
1. “For trade X, who do I add in BA for this project?”  
2. “Who do I call/email if we need help on crew Y?”  
3. “Export / print a current oversight map for the team.”

### Out of scope (v1)

- Full volunteer/crew member rosters  
- Competing with BA as assignment system of record  
- CG admin rework, PWA, schedule notifications  
- Generic task lists / checklist templates (v2+)

### Already in the codebase (reuse)

- Prisma: `TradeTeam`, `Crew`, `TradeTeamOversight`, `TradeCrewOversight` + role enums (TTO/TTOA/TT_SUPPORT, TCO/TCOA/TC_SUPPORT)  
- UI: `/trade-teams/overview` (grid/table + PDF export columns already match this model)  
- Role limits in `oversight-types.ts` (USLDC-style constraints)

**v1 work is mostly:** make this the **default home experience**, harden data entry/import, ensure contact fields are complete and searchable, hide legacy “construction OS” noise.

### Success criteria

- Team uses the directory for **every** new project BA setup for 2 weeks without falling back to a side spreadsheet  
- Lookup of “TTO/TCO for trade Z” in **&lt; 30 seconds**  
- One export (CSV/PDF) matches what the team would have built manually  

### Non-goals / trust rule

Directory is a **mirror for our team**. BA remains authoritative for formal appointments; we update the directory when leadership changes are known.

---

## Direction (2026-10-29)

The directory is the front door, not the whole product. The same app serves other regions and zones. A region sees only its own people, projects, processes, and requests.

### Directory

Keep trade team and trade crew oversight. Also list Construction Group people and other ancillary people connected to that region. Personnel Contact, assistant, and support already exist as `PersonnelContact` on the construction group. Ancillary people need a region-scoped place in the same directory, separate from trade oversight.

A directory contact who is not Personnel does not need a login. Personnel are the people who use this app. Trade oversight, Construction Group contacts, and ancillary people are directory records. Today those oversight rows still hang off a user account; splitting the contact from the login is a later change. Do not delete a user who has signed in without asking.

Volunteers who are not in the directory are removed. The old volunteer roster is not part of this product.

Hub start and end dates are still a later cleanup. When a person has an older assignment and a newer one, the directory shows the current assignment.

### Tenancy

Zone → Region → Construction Group stays in the data. A signed-in person belongs to the construction group where they serve, such as CG 01.12, and that is where their work lives. There is no admin screen for editing the branch, zone, region, and construction-group tree. Projects, trade teams, crews, personnel contacts, and crew-change requests stay tied to that construction group. Nothing from one region appears in another. The existing cross-group staffing request is the only path for sharing, and it stays an explicit ask.

### Projects

Bring back a projects page for the construction group. Oversight assigns Personnel to a project. Personnel use the directory to see who to add in Builder Assistant. Do not assign trade crews to a project in this app. Do not keep budget fields or congregation assignments.

The project schedule stays. It is a dated list of work on that project, such as PPS meeting prep or assessment queues setup. `Project` and `ProjectScheduleEntry` already exist. Drop budget, congregation assignment, and crew-to-project assignment from what we bring back.

### Processes and tasks

A process is a checklist the team can follow. Each step has an explanation and can have a reference document attached. This is not in the schema yet. Templates belong to the region; a run of a process belongs to a project or a piece of work.

Every task carries its timing: a date on a project schedule, a deadline, or a repeat such as monthly or yearly. That timing shows on the task and process list, not only on a separate calendar.

### Work the team can pick up

Two sources land in the same queue:

- **Crew requests.** A Microsoft Form spreadsheet is imported. The import creates tasks from the submitted data and detail. There is no request form to fill out in the app. Someone claims the task and the requestor is told when it is complete. `CrewChangeRequest` already has the requestor, volunteer, crew, project, comments, status, and construction group. Do not bring back the old crew-request screens.
- **Tasks we post.** Personnel Contact, the Assistant, or their Support can assign a task. If a task is claimable, anyone on that construction group’s team can claim it or assign themselves. A task may be one-time with a deadline, or repeating monthly or yearly.

### Still archive

The volunteer roster, contacts, congregations, budget, congregation-to-project assignment, and crew-to-project assignment. Also the old admin modules that are not sign-in or construction-group setup. The project schedule stays, as dated work rather than the old construction calendar.

---

## Build order

See `PLAN.md`. Slices, in order: directory groups, work list, projects, project dates on that list, process checklists, crew-request spreadsheet import. The directory import for trade oversight is already done.
