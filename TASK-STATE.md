# LDC Tools Task State

**Last updated:** 2026-10-26 (mid-day)  
**Current branch:** main  
**Working on:** Trade Leadership Directory (v1) for CG 01.12

---

## Current Task
**Populate + clean Trade Leadership Directory** - IN PROGRESS

### What I'm doing right now
Hub scrape imported into CG 01.12 oversight (Users + TradeTeam/TradeCrew oversight). Directory at `/trade-teams/overview`. Pending: assign Hart + Miller-Sieving as TT Support; decide on headshots; in-app cleanup of inferred rows.

### Recent completions
- ✅ Fleet resume (D-056 reverse) + D-068 blue IP `10.92.3.34`
- ✅ STANDBY green deploy healthy (`b0f0264`)
- ✅ Product brief: Trade Leadership Directory v1
- ✅ Import template + CG 01.12 scrape workbook
- ✅ Oversight import: **193/195** assignments (team 35 + crew 158)

### Exact Next Command
1. Assign Daryl Hart + Tiffany Miller-Sieving as TT Support (placeholder trade TBD / any team)
2. Decide headshots in directory (yes/no + source)
3. Spot-clean inferred household-trade / no-crew rows in UI

---

## Known Issues
- TypeScript error in `ImportExportButtons.tsx` (lines 52, 184) — deferred
- 2 people still missing trade_team (Hart, Miller-Sieving)
- ~9 TC Support without crew → parked as TT Support on inferred team
- SSH `Host ldc` still points at old IP; use `root@10.92.3.34` / IdentityFile explicitly

---

## Exact Next Command
Assign Hart + Miller-Sieving as TT Support; confirm headshot decision
