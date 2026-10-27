# LDC Tools Task State

**Last updated:** 2026-10-27 (mid-day)  
**Current branch:** main  
**Working on:** Trade Leadership Directory (v1) for CG 01.12

---

## Current Task
**Clean inferred oversight rows** - IN PROGRESS

### What I'm doing right now
CG 01.12 oversight is imported: **195 rows / 190 people**, all 190 have headshots. Hub list is 210; 20 Other Roles were not imported. Directory at `/trade-teams/overview`. Next is in-app cleanup of inferred household-trade and no-crew rows.

### Recent completions
- ✅ Hart + Miller-Sieving as TT Support on placeholder team TBD (`302a253`, deployed)
- ✅ Directory headshots (`9358935` on STANDBY green); photos on the containers, not in git
- ✅ 190/190 oversight people have a photo (12 close-ups this morning)

### Exact Next Command
Spot-clean inferred household-trade / no-crew rows in the directory UI

---

## Known Issues
- TypeScript error in `ImportExportButtons.tsx` (lines 52, 184) — deferred
- Hart + Miller-Sieving parked on trade team TBD until a real trade is known
- ~9 TC Support without crew → parked as TT Support on inferred team
- SSH `Host ldc` still points at old IP; use `root@10.92.3.34` / IdentityFile explicitly

---

## Exact Next Command
Spot-clean inferred household-trade / no-crew rows in the directory UI
