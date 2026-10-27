# LDC Tools Plan

**Last updated:** 2026-10-27 (mid-day)  
**Current phase:** Trade Leadership Directory v1  
**Status:** v1.28.0 LIVE green; STANDBY blue synced; inferred rows still need a human pass

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
- [ ] Clean inferred/no-crew rows in UI (effort: M)

### Completed This Phase
- ✅ Resume from Level B — CT133/135 running, onboot on (2026-10-26)
- ✅ D-068 — blue IP `10.92.3.34` (Postgres VIP keeps `.23`)
- ✅ v1.28.0 LIVE green CT135, STANDBY blue CT133, both `fe08a8c` (2026-10-27)
- ✅ Oversight import: 195 rows, 190 people, all with photos

---

## Prioritized Backlog

### High Priority
- [ ] Rework admin portal to match TheoShift approach (effort: XL)
- [ ] Mobile optimization and PWA support (effort: L)
- [ ] Fix TypeScript error in ImportExportButtons.tsx (lines 52, 184) (effort: S)

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
- LIVE is green as of the v1.28.0 switch
