# LDC Tools Task State

**Last updated:** 2026-10-30  
**Current branch:** main  
**Working on:** Region work queue, slice 5 (processes) on standby

---

## Current Task
**Processes** — built (slice 5). Next is the crew-request import (slice 6) after this is on standby.

### What I'm doing right now
v1.34.0 is LIVE on green. Personnel save a process and start it. Each step becomes a work item with its explanation. Not shipped.

### Recent completions
- ✅ Shipped v1.33.0 (`9db88f9`); qa-01 full suite 61/61 plus the projects tests passed
- ✅ Shipped v1.32.0 (`33baf50`); qa-01 full suite 60/60 plus the work-list test passed
- ✅ Shipped v1.31.0 (`7bbb610`); qa-01 directory+admin gate and directory-groups tests passed
- ✅ Shipped v1.30.0 (`e11cb3d`); qa-01 directory+admin gate and photo-position tests passed
- ✅ Shipped v1.29.0 (`3222e09`); qa-01 full suite 68/68 plus generated directory tests passed
- ✅ Deactivated empty Site/Civil; Sitework/Civil remains the live trade
- ✅ Retired empty duplicate trades (Electrical, Exteriors, Interiors, Mechanical, Plumbing, Site Support, Structural) and Test Electrical Team
- ✅ `Host ldc` now points at blue `10.92.3.34`

### Exact Next Command
Crew-request import (slice 6), after processes are on standby

---

## Known Issues
- Hart + Miller-Sieving parked on trade team TBD until a real trade is known
- ~9 TC Support without crew → parked as TT Support on an inferred team
- Hub start and end dates are paused until the Persons export is back

---

## Exact Next Command
Crew-request import (slice 6), after processes are on standby
