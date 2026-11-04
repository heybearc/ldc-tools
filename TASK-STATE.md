# LDC Tools Task State

**Last updated:** 2026-11-03  
**Current branch:** main  
**Working on:** v1.45.1 (`216e247`) is LIVE on blue (CT133). STANDBY green (CT135) is `17ddbd4`. Play internal test 1.0.1 version code 8 is rolled out. Apple Developer enrollment is in process.

---

## Current Task
v1.45.1 (`216e247`) is LIVE on blue (CT133). STANDBY green (CT135) has the keyboard fix (`17ddbd4`). `main` is `3b66c0d` (Android version code only). Hub dates stay paused. Play internal testing is available, and the store download still says item not found.

### What I'm doing right now
Testers join internal testing as the Gmail on the phone's Play Store, then download 1.0.1 (8). Apple enrollment is still in process. Hub dates stay paused.

### Recent completions
- ✅ Shipped v1.45.1 (`216e247`). Chat says Turn off when notifications are already on. qa-01 directory gate plus the generated chat tests. LIVE blue CT133, STANDBY green CT135.
- ✅ Phone chat composer lifts above the keyboard (`17ddbd4`) on STANDBY. Emulator has 1.0.1 version code 7. Play internal testing has version code 8.
- ✅ Shipped v1.45.0 (`32553ab`). Open claimed work, check steps, return to the pool, and chat in the phone app. qa-01 full suite 81/81. LIVE was green CT135.
- ✅ Shipped v1.44.0 (`2919abf`). Claim work, directory sections, and person profiles. qa-01 directory gate plus the generated store-app tests. LIVE was blue CT133.
- ✅ Shipped v1.43.0 (`cc8dcde`). Tablet layout, and failures say what happened. qa-01 directory gate plus the generated user-error test. LIVE green CT135, STANDBY blue CT133.
- ✅ Shipped v1.42.0 (`2351513`). Phone layout and directory contacts. qa-01 full suite 74/74 plus the generated mobile test. LIVE blue CT133, STANDBY green CT135.
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
Have the tester open Download test app from the Play Store account that joined the test. Hub assignment dates stay paused until the persons list has start and end dates.

---

## Known Issues
- Apple Developer enrollment is in process. Expo account `corya92` still has no Apple team, so the iOS EAS build cannot sign.
- Play internal test 1.0.1 (8) is Available to internal testers. Download test app still returns Item not found. Opt-in works for corylallen@gmail.com. Countries column is blank and not editable on this track.
- Play bundle: `/Users/cory/Downloads/ldc-tools-1.0.1-version-code-8.aab`. Emulator APK is 1.0.1 version code 7.
- Hart + Miller-Sieving parked on trade team TBD until a real trade is known
- ~9 TC Support without crew → parked as TT Support on an inferred team
- Persons list has current roles and no start or end dates. Incomplete crew roles are left unchanged.

---

## Exact Next Command
Have the tester open Download test app from the Play Store account that joined the test. Hub assignment dates stay paused until the persons list has start and end dates.
