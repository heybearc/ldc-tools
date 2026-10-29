# LDC Tools Plan

**Last updated:** 2026-10-29  
**Current phase:** Trade Leadership Directory v1, then region work queue  
**Status:** v1.30.0 LIVE green; STANDBY blue synced. Hub dates are paused. Direction is directory plus projects, process checklists, and claimable work, scoped per region.

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
- [ ] Clean inferred/no-crew rows in UI (effort: M) — paused; waiting on a hub export for start and end dates
- [ ] Add Construction Group and ancillary region people to the directory (effort: M)
- [ ] Enforce construction-group scope on every list and write (effort: L)
- [ ] Projects page: Oversight assigns Personnel; schedule dated work; no crews, budget, or congregations (effort: L)
- [ ] Personnel Contact, Assistant, and Support assign tasks; claimable tasks can be claimed by the team (effort: M)
- [ ] Process checklists with explanations and reference docs (effort: XL)
- [ ] Import crew requests as checklist items; notify the requestor when complete (effort: L)
- [ ] Post a task, notify the team, let someone claim it (effort: L)

### Completed This Phase
- ✅ Resume from Level B — CT133/135 running, onboot on (2026-10-26)
- ✅ D-068 — blue IP `10.92.3.34` (Postgres VIP keeps `.23`)
- ✅ v1.28.0 LIVE green CT135, STANDBY blue CT133, both `fe08a8c` (2026-10-27)
- ✅ v1.29.0 LIVE blue CT133, STANDBY green CT135, both `3222e09` (2026-10-27)
- ✅ v1.30.0 LIVE green CT135, STANDBY blue CT133, both `e11cb3d` (2026-10-28)
- ✅ Oversight import: 195 rows, 190 people, all with photos

---

## Prioritized Backlog

### High Priority
- [ ] Region-scoped directory, projects, processes, and claimable work (see product brief, 2026-10-29)
- [ ] Mobile optimization and PWA support (effort: L)

### Do not archive
Projects, the project schedule, and crew-change requests stay. Personnel assign themselves to a project. The schedule holds dated work. Crew requests become imported tasks. Archive the volunteer roster, congregations, budget, crew-to-project assignment, and admin modules that are not sign-in or construction-group setup.
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
- LIVE is blue as of the v1.29.0 switch
