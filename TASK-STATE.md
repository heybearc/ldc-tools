# LDC Tools Task State

**Last updated:** 2026-10-27 (mid-day)  
**Current branch:** main  
**Working on:** Trade Leadership Directory (v1) for CG 01.12

---

## Current Task
**Spot-clean inferred oversight rows** — next

### What I'm doing right now
v1.28.0 is LIVE on green (CT135) and synced to blue (CT133), both at `fe08a8c`. Directory is the home page. Search, copy email, add person, and edit are in. An end date deactivates an assignment and keeps the person listed until a replacement in that role has a start date. Empty duplicate trades are inactive. Next is the inferred household-trade and no-crew rows.

### Recent completions
- ✅ Shipped v1.28.0 (`fe08a8c`); qa-01 short gate plus directory edit test passed
- ✅ Retired empty duplicate trades (Electrical, Exteriors, Interiors, Mechanical, Plumbing, Site Support, Structural) and Test Electrical Team
- ✅ `Host ldc` now points at blue `10.92.3.34`

### Exact Next Command
Spot-clean inferred household-trade / no-crew rows in the directory UI

---

## Known Issues
- TypeScript error in `ImportExportButtons.tsx` (lines 52, 184) — deferred
- Hart + Miller-Sieving parked on trade team TBD until a real trade is known
- ~9 TC Support without crew → parked as TT Support on an inferred team
- Site/Civil is still an empty trade with no populated twin
- qa-01 cannot read HAProxy CT136 from prox1, so standby detection for LDC fails until that host is fixed

---

## Exact Next Command
Spot-clean inferred household-trade / no-crew rows in the directory UI
