---
date: 2026-10-28
purpose: Scratchpad for today's discoveries (promote on /end-day)
---

## Today

### Focus
- Spot-clean inferred household-trade and no-crew rows 

### Discoveries / Notes
- Import export alerts were escaped backticks, so the component did not typecheck. Restored real template literals.
- qa-01 standby detection now reads HAProxy CT136 on prox3 (`10.92.0.7`). CT136 is not on prox1. LDC ACL is `is_ldc`; STANDBY is `https://blue.ldctools.com` while green is LIVE.
- Directory toolbar wraps so Export CSV is not clipped. Edit can move a person to any trade, crew, or role. Sisters can only be Support.
- Shipped v1.29.0. LIVE blue CT133, STANDBY green CT135, both `3222e09`. qa-01 full suite 68/68.
- Empty Site/Civil deactivated. The live trade is Sitework/Civil. 

### Decisions to Promote
- Sisters can only be Support. Mark Sister on each woman; they are not classified automatically.
- The populated trade name is Sitework/Civil. Site/Civil was an empty duplicate. 

### Blockers / Risks
- 

### Links / Commands
- 
