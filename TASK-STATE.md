# LDC Tools Task State

**Last updated:** 2026-10-26 (evening)  
**Current branch:** main  
**Working on:** Trade Leadership Directory (v1) for CG 01.12

---

## Current Task
**Populate + clean Trade Leadership Directory** - IN PROGRESS

### What I'm doing right now
Hub scrape is in CG 01.12 oversight. Hart + Miller-Sieving are TT Support on placeholder team **TBD**. Directory at `/trade-teams/overview`. Pending: headshot decision, then in-app cleanup of inferred rows.

### Recent completions
- ✅ Fleet resume (D-056 reverse) + D-068 blue IP `10.92.3.34`
- ✅ STANDBY green deploy healthy (`b0f0264`)
- ✅ Product brief: Trade Leadership Directory v1
- ✅ Import template + CG 01.12 scrape workbook
- ✅ Oversight import: **195/195** (Hart + Miller-Sieving as TT Support on TBD)

### Exact Next Command
1. Decide headshots in directory (yes/no + source)
2. Spot-clean inferred household-trade / no-crew rows in UI

---

## Known Issues
- TypeScript error in `ImportExportButtons.tsx` (lines 52, 184) — deferred
- Hart + Miller-Sieving parked on trade team TBD until a real trade is known
- ~9 TC Support without crew → parked as TT Support on inferred team
- SSH `Host ldc` still points at old IP; use `root@10.92.3.34` / IdentityFile explicitly

---

## Exact Next Command
Confirm headshot decision (yes/no + source)
