# LDC Tools Task State

**Last updated:** 2026-05-19  
**Current branch:** main  
**Working on:** MCP status fix done; validate deploy workflow; Phase 4 planning

---

## Current Task
**Release hardening + deployment workflow reliability** - IN PROGRESS

### What I'm doing right now
Closing end-of-day context after completing a hotfix-to-release cycle for feedback submission reliability and correcting LIVE/STANDBY sync state.

### Recent completions
- ✅ Fixed feedback submission 500 (`feedbackNumber` missing on create) and pushed to `main` (`6ab60c3`)
- ✅ Fixed qa-01 test runner blocker by adding `dotenv`; `/test-release` passed on qa-01 STANDBY (4/4 smoke tests) (`251bd5f`)
- ✅ Completed `/bump` to `v1.27.4`, pushed release commit and GitHub release tag (`1321bf6`)
- ✅ Ran `/release` and `/sync`; corrected final state manually so both blue/green run `v1.27.4` at commit `1321bf6`
- ✅ Resolved previously open feedback items (`FB-012`, `FB-014`) and verified no new NEW feedback items

### Key findings
- **Root cause for feedback outage:** schema required `feedbackNumber`, submit API did not set it.
- **MCP naming hygiene:** use `ldctools-blue`/`ldctools-green` aliases and LIVE/STANDBY terminology.
- **MCP status fix (2026-05-19):** HAProxy ACL is `is_ldc` (not `is_ldc_tools`); backends are `ldc-tools-blue`/`ldc-tools-green`.

---

## Known Issues
**Current:**
- TypeScript error in `ImportExportButtons.tsx` (lines 52, 184)

---

## Next Steps

**Next session:**
1. Re-run MCP `get_deployment_status` / deploy dry-run to confirm LIVE=BLUE via HAProxy
2. Resume product backlog prioritization for Phase 4 (admin portal rework vs mobile/PWA)

**Potential work items:**
- Admin portal rework to match TheoShift (XL effort)
- Mobile optimization and PWA support (L effort)
- Fix TypeScript error in ImportExportButtons.tsx (S effort)
- Expand LDC smoke coverage beyond current qa-01 quick suite

---

## Deferred for Later
- Fix TypeScript error in `ImportExportButtons.tsx`
- Clean up Playwright HTML reporter folder overlap warning on qa-01

---

## Exact Next Command
Run `get_deployment_status` for ldc-tools — expect `haproxy.backend: blue` (matches `use_backend ldc-tools-blue if is_ldc`). See `PLAN.md` for backlog.
