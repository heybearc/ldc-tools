# LDC Tools Task State

**Last updated:** 2026-11-18  
**Current branch:** main  
**Working on:** v1.54.3 is LIVE on green (CT135, `8c1c190`). STANDBY blue (CT133) has Start/Finished at `d38ccb2`. Hub dates stay paused.

---

## Current Task
v1.54.3 is LIVE on green CT135. Start then Finished is on STANDBY blue CT133 and is not shipped. Hub dates stay paused.

### What I'm doing right now
Start then Finished is on STANDBY blue CT133 (`d38ccb2`). Not shipped. The installed phone app still shows Done until the next store build. Hub assignment dates stay paused.

### Recent completions
- ✅ Start then Finished, and chat no longer jumps the page (`d38ccb2`). Migration `startedAt` applied. STANDBY blue CT133 http://10.92.3.34:3001. Not shipped.
- ✅ Shipped v1.54.3 (`8c1c190`). Work filters: project, Overdue, Email off. LIVE green CT135. STANDBY was synced, then blue took `d38ccb2`. Tag https://github.com/heybearc/ldc-tools/releases/tag/v1.54.3
- ✅ Shipped v1.54.2 (`7edec05`). Admin shell fits the window. LIVE was green CT135. Tag https://github.com/heybearc/ldc-tools/releases/tag/v1.54.2
- ✅ Shipped v1.54.1 (`e6b7385`). Official App Store and Google Play badges in the footer and on the mobile page. qa-01 directory gate plus the mobile-install test. LIVE green CT135. STANDBY blue CT133 synced. No new store build. Tag https://github.com/heybearc/ldc-tools/releases/tag/v1.54.1
- ✅ Shipped v1.54.0 (`d293de5`). Signed-in Mobile app page. TestFlight https://testflight.apple.com/join/U1qScvxu. Play https://play.google.com/apps/test/com.ldctools.mobile/23. LIVE was blue CT133. Tag https://github.com/heybearc/ldc-tools/releases/tag/v1.54.0
- ✅ Shipped v1.53.0 (`d0793d4`, store numbers `1ce5f63`). qa-01 full suite 104 passed, plus the announcement-link test. LIVE was green CT135. iOS build 16 is on TestFlight. Android version code 23 is on the Play internal track. Tag https://github.com/heybearc/ldc-tools/releases/tag/v1.53.0
- ✅ Shipped v1.51.0 (`2b5fa31`, store numbers `0d9d4eb`). qa-01 admin gate plus the edit test passed. LIVE was blue CT133. iOS build 14 is on TestFlight. Android version code 21 is on the Play internal track. Tag https://github.com/heybearc/ldc-tools/releases/tag/v1.51.0
- ✅ Shipped v1.50.0 (`0c16ce8`). qa-01 admin gate plus the publish-date test passed. LIVE was green CT135. iOS build 13. Android version code 20. Tag https://github.com/heybearc/ldc-tools/releases/tag/v1.50.0
- ✅ FB-016 resolved. Saving a photo no longer checks the Trade Crew Overseer limit when the role and crew stay the same. Siding still has two active overseers. Those assignments were not changed.
- ✅ Shipped v1.49.1 (`5b4023f`). qa-01 directory gate and the chat picker test passed. LIVE was blue CT133. iOS build 12. Android version code 19. Tag https://github.com/heybearc/ldc-tools/releases/tag/v1.49.1
- ⏸ The first v1.49.1 attempt stopped when actool hung. The archive watcher now opens the handshake and retries a stuck catalog compile (`da45232`).
- ✅ Shipped v1.49.0 (`6ed30e6`). qa-01 full suite 98 passed, plus the generated process test. LIVE green CT135. STANDBY blue CT133 synced. iOS build 11 is on TestFlight. Android version code 18 is on the Play internal track. Chat on the live site lists the Personnel team.
- ✅ Process drafts, publish, cadence, and standalone or project shipped in v1.49.0. Work with no requestor email was hidden by the release-check filter; that is fixed in `f927b88`.
- ✅ Version notes for v1.49.0 are on main (`1ab944e`). No GitHub tag. Not deployed.
- ✅ Shipped v1.48.8 (`df42264`). Completion email follows a shift-select. qa-01 directory and volunteers gate plus the email-off test. LIVE blue CT133. STANDBY was synced, then green CT135 took `81ff84c`.
- ✅ Project assign is a search that can add several people. Chat lists and notifies only the Personnel team (`81ff84c`) on STANDBY green CT135. Not shipped.
- ✅ Shipped v1.48.7 (`962eeb0`). Phone numbers use (555) 555-5555. qa-01 directory and volunteers gate plus the phone-format test. LIVE green CT135. STANDBY blue CT133 was synced, then took `2ca911f`.
- ✅ Shipped v1.48.6 (`8220ede`). Created accounts stay on the list, several can be invited, and Add person can choose Personnel. LIVE was blue CT133.
- ✅ Deleted the three QA work items and three QA process templates from the shared database. The hide rule is on STANDBY only (`2ca911f`).
- ✅ Shipped v1.48.5 (`99313b9`). Account create uses platform access. qa-01 full suite 95 plus the create-user test. LIVE green CT135. STANDBY was synced, then blue CT133 took later commits.
- ✅ Created accounts with a password show on Accounts. Add person Place includes Personnel and Construction group (`ec017c7`) on STANDBY blue CT133. Not shipped.
- ✅ Bulk edit and send invitation for accounts that were created without an email (`86cce95`) on STANDBY. Not shipped.
- ✅ Shipped v1.48.4 (`1683f98`). Sign-in logo. qa-01 full suite 94 plus the logo test. LIVE was blue CT133.
- ✅ Removed QA work left by the release gate. Available work is 174 crew requests.
- ✅ Release-test cleanup (`fd1d11b`) is on STANDBY green CT135. Not shipped.
- ✅ D-069 recorded. `/ship` classifies site vs phone and builds both store binaries when `mobile/` changed.
- ✅ Site standby deploy of `0e45f7f` succeeded on green CT135. Main later moved for governance only (`7f43079`).
- ✅ Shipped v1.47.0 (`b9733db`). Public privacy and support, account deletion, chat report and block. qa-01 full suite (88) plus the generated store-review test. LIVE green CT135, STANDBY blue CT133.
- ✅ Shipped v1.46.2 (`333704c`). Password emails use the saved mailbox password. qa-01 admin gate plus the generated email test. LIVE blue CT133, STANDBY green CT135.
- ✅ Shipped v1.46.1 (`be16844`). The phone icon and launch image are centered. qa-01 directory gate plus the generated app-icon test. LIVE was green CT135, then blue before this ship.
- ✅ Shipped v1.46.0 (`f91ed69`). Edit a project, calendar by day week or month, and Projects in the phone app. qa-01 directory gate plus the generated projects and mobile tests. LIVE was green CT135.
- ✅ Shipped v1.45.1 (`216e247`). Chat says Turn off when notifications are already on. qa-01 directory gate plus the generated chat tests. LIVE was blue CT133.
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
Test Start then Finished on https://blue.ldctools.com. `/ship` when it should go live. Phone UI waits for the next store build. Hub assignment dates stay paused.

---

## Known Issues
- iOS 1.1.0 build 16 is in App Store Connect. Android version code 23 is on the Play internal track. Play does not email new testers; send the internal opt-in link. Xcode 27 can deadlock in actool; `mobile/scripts/hold-asset-catalog-pipes.py` unblocks that pipe during the store lanes.
- Android 1.1.0 version code 15 is on the Play internal track. Expo Android cloud builds stay used up until 2026-12-01.
- Phone feature flows passed 10/10 on the Android emulator. iOS Simulator 27.2 is installed. Those flows were not rerun on iOS.
- 37 open crew requests have completion email turned off.
- Play internal test 1.0.1 (8) is Available to internal testers. Download test app still returns Item not found. Opt-in works for corylallen@gmail.com. Countries column is blank and not editable on this track.
- Play bundle: `/Users/cory/Downloads/ldc-tools-1.0.1-version-code-8.aab`. Emulator APK is 1.0.1 version code 7.
- Hart + Miller-Sieving parked on trade team TBD until a real trade is known
- ~9 TC Support without crew → parked as TT Support on an inferred team
- Persons list has current roles and no start or end dates. Incomplete crew roles are left unchanged.

---

## Exact Next Command
Test Start then Finished on https://blue.ldctools.com. `/ship` when it should go live. Phone UI waits for the next store build. Hub assignment dates stay paused.
