---
date: 2026-10-27
purpose: Scratchpad for today's discoveries (promote on /end-day)
---

## Today

### Focus
- Ship the trade directory as v1.28.0

### Discoveries / Notes
- v1.28.0 is LIVE green CT135 and synced to blue CT133, both `fe08a8c`
- qa-01 short gate plus the directory edit test passed against https://green.ldctools.com
- Empty duplicate trades were deactivated in the shared database, so LIVE and STANDBY both lost those cards
- Site/Civil remains, with no people and no twin
- qa-01 standby detection looks for HAProxy CT136 on prox1 and does not find it

### Decisions to Promote
- An end date deactivates that oversight assignment and keeps the person listed until a replacement in the same role has a start date

### Blockers / Risks
- Inferred household-trade and no-crew rows still need a human pass
- URGENT open feedback: 0

### Links / Commands
- LIVE: https://ldctools.com
- STANDBY: https://blue.ldctools.com
- Release: https://github.com/heybearc/ldc-tools/releases/tag/v1.28.0
