# LDC Tools Plan

**Last updated:** 2026-10-26 (evening)  
**Current phase:** Trade Leadership Directory v1  
**Status:** CG 01.12 oversight imported (195/195); STANDBY green current; LIVE still blue

---

## Current Phase

### Active Work
- [x] Resume fleet app (CTs, HAProxy, MCP/SSH, DB VIP) (effort: M)
- [x] Deploy latest `main` to STANDBY (green) (effort: S)
- [x] Product brief + import template for Trade Leadership Directory (effort: S)
- [x] Import CG 01.12 hub scrape → oversight tables (effort: M)
- [x] Place Hart + Miller-Sieving as TT Support on placeholder team TBD (effort: S)
- [ ] Decide headshots in directory (effort: S)
- [ ] Clean inferred/no-crew rows in UI (effort: M)
- [ ] Soft-land homepage → directory; hide legacy noise (effort: M)
- [ ] Smoke / `/test-release` on STANDBY before any `/release` (effort: S)

### Completed This Phase
- ✅ Resume from Level B — CT133/135 running, onboot on (2026-10-26)
- ✅ D-068 — blue IP `10.92.3.34` (Postgres VIP keeps `.23`)
- ✅ HAProxy green ACL fix + blue server IP update
- ✅ STANDBY deploy to green `10.92.3.25` success
- ✅ Oversight import script + 193 assignments loaded

---

## Prioritized Backlog

### High Priority
- [ ] Trade Leadership Directory UX (search, copy email, export polish) (effort: M)
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
- Do **not** switch LIVE until STANDBY smoke passes
