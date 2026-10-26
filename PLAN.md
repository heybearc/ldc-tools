# LDC Tools Plan

**Last updated:** 2026-10-26  
**Current phase:** Post-resume operations (after D-056 Level B reverse)  
**Status:** Resumed; STANDBY green deploy succeeded; LIVE still blue

---

## Current Phase

### Active Work
- [x] Resume fleet app (CTs, HAProxy, MCP/SSH, DB VIP) (effort: M)
- [x] Deploy latest `main` to STANDBY (green) (effort: S)
- [ ] Re-enable Uptime Kuma monitors + clear Alertmanager silences (effort: S — operator)
- [ ] Smoke / `/test-release` on STANDBY before any `/release` (effort: S)
- [ ] Plan Phase 4 features and timeline (effort: S)

### Completed This Phase
- ✅ Resume from Level B — CT133/135 running, onboot on (2026-10-26)
- ✅ D-068 — blue IP `10.92.3.34` (Postgres VIP keeps `.23`)
- ✅ HAProxy green ACL fix + blue server IP update
- ✅ STANDBY deploy to green `10.92.3.25` success

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
- Do **not** switch LIVE until STANDBY smoke passes
