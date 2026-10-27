# LDC Tools Task State

**Last updated:** 2026-10-27  
**Current branch:** main  
**Working on:** Trade Leadership Directory (v1.29.0) for CG 01.12

---

## Current Task
**Spot-clean inferred oversight rows** — next

### What I'm doing right now
v1.29.0 is LIVE on blue (CT133) and synced to green (CT135), both at `3222e09`. People can be moved across trades, crews, and roles. Sisters can only be Support. Next is the inferred household-trade and no-crew rows.

### Recent completions
- ✅ Shipped v1.29.0 (`3222e09`); qa-01 full suite 68/68 plus generated directory tests passed
- ✅ Retired empty duplicate trades (Electrical, Exteriors, Interiors, Mechanical, Plumbing, Site Support, Structural) and Test Electrical Team
- ✅ `Host ldc` now points at blue `10.92.3.34`

### Exact Next Command
Spot-clean inferred household-trade / no-crew rows in the directory UI

---

## Known Issues
- Hart + Miller-Sieving parked on trade team TBD until a real trade is known
- ~9 TC Support without crew → parked as TT Support on an inferred team
- Site/Civil is still an empty trade with no populated twin

---

## Exact Next Command
Spot-clean inferred household-trade / no-crew rows in the directory UI
