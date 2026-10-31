# LDC Tools Task State

**Last updated:** 2026-10-30  
**Current branch:** main  
**Working on:** Phone layout of the website, and the Expo store app in `mobile/`.

---

## Current Task
v1.41.0 is shipped. The website is being tightened for phones. The store app signs in and shows My Work and the directory. Hub dates stay paused.

### What I'm doing right now
v1.41.0 (`16ffef1`) is LIVE on green (CT135). Directory contacts are the next standby build. Hub dates stay paused.

### Recent completions
- ✅ Shipped v1.41.0 (`16ffef1`). Team chat, My Work, help replies, and finishing several tasks. qa-01 full suite 72/72. LIVE green CT135, STANDBY blue CT133.
- ✅ Shipped v1.40.0 (`9f368a3`). Work opens on the group already chosen. A task can have no deadline. Several open tasks can be assigned to one person. qa-01 full suite 71/71. LIVE blue CT133, STANDBY green CT135.
- ✅ Shipped v1.39.0 (`6ab0f34`). Crew-update import creates claimable work and keeps the requestor. qa-01 full suite 69/69. LIVE green CT135, STANDBY blue CT133.
- ✅ Shipped v1.38.1 (`e384d04`). Resend Invitation no longer writes region fields. qa-01 admin gate passed. LIVE blue CT133, STANDBY green CT135.
- ✅ Shipped v1.38.0 (`9f56415`). Invite form on User Management. Confirmations are toasts.
- ✅ Shipped v1.37.0 (`756ef8b`). Directory names open a profile. Admin can save name and email and cancel an invitation.
- ✅ Turned off the v1.31.0 announcement (it was active through 2026-11-12).
- ✅ Personnel directory names open a profile (`12d9e2b`) on STANDBY
- ✅ Shipped v1.36.0 (`7537896`); qa-01 admin gate plus construction-group access test passed
- ✅ Loaded the CG 01.12 Personnel roster into the shared database
- ✅ Shipped v1.35.0 (`422989e`); qa-01 full suite 64/64 plus generated tests passed
- ✅ Shipped v1.34.0 (`707ae63`); qa-01 directory gate plus the project-schedule test passed
- ✅ Shipped v1.33.0 (`9db88f9`); qa-01 full suite 61/61 plus the projects tests passed
- ✅ Shipped v1.32.0 (`33baf50`); qa-01 full suite 60/60 plus the work-list test passed
- ✅ Shipped v1.31.0 (`7bbb610`); qa-01 directory+admin gate and directory-groups tests passed
- ✅ Shipped v1.30.0 (`e11cb3d`); qa-01 directory+admin gate and photo-position tests passed
- ✅ Shipped v1.29.0 (`3222e09`); qa-01 full suite 68/68 plus generated directory tests passed
- ✅ Deactivated empty Site/Civil; Sitework/Civil remains the live trade
- ✅ Retired empty duplicate trades (Electrical, Exteriors, Interiors, Mechanical, Plumbing, Site Support, Structural) and Test Electrical Team
- ✅ `Host ldc` now points at blue `10.92.3.34`

### Exact Next Command
On a phone, open STANDBY and walk Directory, Work, and Chat. The store app starts with `cd mobile && npm start`.

---

## Known Issues
- Hart + Miller-Sieving parked on trade team TBD until a real trade is known
- ~9 TC Support without crew → parked as TT Support on an inferred team
- Persons list has current roles and no start or end dates. Incomplete crew roles are left unchanged.

---

## Exact Next Command
On a phone, open STANDBY and walk Directory, Work, and Chat. The store app starts with `cd mobile && npm start`.
