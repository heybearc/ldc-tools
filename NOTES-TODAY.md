---
date: 2026-10-30
purpose: Scratchpad for today's discoveries (promote on /end-day)
---

## Today

### Mid-day (2026-11-08, governance)
- Promoted D-069. `/ship` classifies site, phone, phone API, or docs. A `mobile/` change builds iOS then Android on this Mac. The site still goes to standby.
- Cloudy-Work is `e85b8fa`. The command files were already on `f47d2d4`.
- STANDBY green CT135 has the site fixes (`0e45f7f`, http://10.92.3.25:3001). LIVE stays blue CT133. Not switched.
- No phone binary was built for that mobile diff. Next `/ship` runs both store lanes.
- Urgent feedback was not rechecked. Hub dates stay paused.
- Next: `/ship` when ready. New session before the next slice.

### Mid-day (2026-11-08, later)
- Local Fastlane is on `main` (`5614175`). STANDBY blue CT133 http://10.92.3.34:3001. LIVE stays green CT135. Not switched.
- Android 1.1.0 version code 15 is on the Play internal track. Signed with the existing upload key. Same Play service account as TheoShift.
- Xcode 27.2 is installed. iOS signing is no longer blocked on a missing Xcode.
- Open urgent feedback: 1 (FB-004, resolved, not closed). Hub dates stay paused.
- iOS 1.1.0 build 8 is in App Store Connect. Android 1.1.0 version code 16 is on the Play internal track.

### Mid-day (2026-11-08)
- Phone day-to-day tools and alerts are on `main` (`93497af`). STANDBY blue CT133 http://10.92.3.34:3001. LIVE stays green CT135. Not switched.
- iOS 1.1.0 build 4 is in App Store Connect. Build 5 (badge and lock screen) is queued: `135cc6b2`, submission `d7c6ba9a`. Android Expo builds are used up until 2026-12-01.
- Gmail send works. Completion mail now says when it fails. 37 open crew requests still have the email box off.
- Bugbot: phone create-team and create-project are narrower than the website. Not fixed.
- Directory photo save skips the role limit when the placement is unchanged. Siding still has two active TCOs.
- Open urgent feedback: 0. Hub dates stay paused.
- Next: attach iOS build 5 after Apple processes it. New session before the next slice.

### Mid-day (2026-11-07)
- No code changes since v1.47.0 (`b9733db`). LIVE green CT135. STANDBY blue CT133 is synced.
- Open urgent feedback: 0. Hub dates stay paused.
- Next: a new store build. App Store Connect still has iOS 1.0.3 build 2, which predates delete-account, report, and block.
- `mobile/android/` is a local prebuild and stays untracked. It includes a debug keystore.
- Matt Hirsch’s password reset from Nov 4 is still the open mail follow-up.

### Morning (2026-11-05)
- Shipped v1.47.0 (`b9733db`). LIVE green CT135. STANDBY blue CT133. qa-01 full suite 88 passed, plus the generated store-review test.
- https://ldctools.com/privacy and https://ldctools.com/support are public.
- iOS 1.0.3 build 2 in App Store Connect does not include the new phone screens. A new store build is still required.

### Mid-day (2026-11-04, afternoon)
- Shipped v1.46.2 (`333704c`). LIVE blue CT133. STANDBY green CT135 is synced. qa-01 admin gate plus the generated email test passed.
- Gmail rejected the old app password. The new password is saved. The test was sending a blank password after save. That is fixed.
- Matt Hirsch (`mwhirsch1975@gmail.com`) did not get the 2:11 PM reset. Send it again from User Management.
- iOS 1.0.3 build 2 is submitted. App Store Connect app `6830767824`. Submission finished.
- The emulator red screen was TheoShift’s dev server on port 8081. LDC Tools uses port 8082. No Play Store upload.
- Open urgent feedback: 0. Hub dates stay paused.

### Mid-day (2026-11-04)
- v1.46.1 (`be16844`) is LIVE on blue CT133. STANDBY green CT135 is synced. Phone icon and launch image are centered.
- Apple team is Cloudigan IT Solutions LLC (`S42AL6JZDB`). App ID registration is in progress: description LDC Tools, explicit bundle ID `com.ldctools.mobile`.
- Associated Domains stays off. The app has no universal links.
- iOS build still needs an interactive `eas build --platform ios --profile production` after the App ID exists.
- Open urgent feedback: no new items in this session. Hub dates stay paused.

### Mid-day (2026-11-03, evening)
- Shipped v1.45.1 (`216e247`). LIVE blue CT133. STANDBY green CT135 is `17ddbd4` (chat composer above the keyboard). `main` is `3b66c0d` (Android version code only).
- qa-01 directory gate plus generated chat tests passed before the switch.
- Emulator has 1.0.1 version code 7. Play internal testing has 1.0.1 version code 8 at `/Users/cory/Downloads/ldc-tools-1.0.1-version-code-8.aab`.
- Opt-in works. Download test app returns Item not found. Release is Available to internal testers. No countries editor on that track.
- Open urgent feedback: 0. No new items in this session.
- Apple Developer enrollment is still in process. Hub dates stay paused.
- Start a new chat before the next slice.

### Mid-day (2026-11-03, later)
- Shipped v1.45.0 (`32553ab`). LIVE green CT135. STANDBY blue CT133 synced, including version code `300c4d6`. qa-01 full suite 81/81 plus the work-step tests.
- Claimed work opens for step checkoff, Done, and Return to pool. Phone chat is in the app. Starting a process keeps the project and confirms it.
- Emulator APK 1.0.1 (version code 3): https://expo.dev/artifacts/eas/5yE3xvT9Y5-XxKpJ-36xD1waYzbznOKuqSm6NbINH9A.apk
- Play bundle 1.0.1 (version code 4): https://expo.dev/artifacts/eas/pCB4NpPvFwyJ7AJrmCdEn3xT4T04jAiTEgv22MhUgg0.aab
- Open urgent feedback: 0. No new items in this session.
- Apple Developer enrollment is still in process. Hub dates stay paused.
- Start a new chat before the next slice.

### Mid-day (2026-11-03)
- Shipped v1.44.0 (`2919abf`). LIVE blue CT133. STANDBY green CT135 synced. qa-01 directory gate plus the generated store-app tests passed on standby before the switch.
- Preview APK is installed on the Medium Phone emulator. Server should be `https://ldctools.com`.
- The Play bundle `d3f35b24` predates v1.44.0. Internal testing needs a new app bundle.
- Open urgent feedback: 0. No new items in this session.
- Phone pass of the first store build worked. v1.44.0 adds Available, directory sections, profiles, and the logo.
- Apple Developer application is in process. Google Play Developer account is ready.
- v1.43.0 (`cc8dcde`) was the previous LIVE release.
- Store app 1.0.0 lists Construction group, Personnel, and ancillary with the trade crews. A tablet loads that list once.
- Android APK is built: https://expo.dev/accounts/corya92/projects/ldc-tools/builds/aaff87f3-9a0f-4dca-b0e9-496d2ae734bc
- iOS EAS build cannot sign until Apple enrollment finishes and Expo account `corya92` has a team.
- Bundle ID and Android package are `com.ldctools.mobile`.
- Open urgent feedback: 0.
- Hub dates stay paused. The persons list still has no start or end dates.
- Start a new chat before the next slice.

### Mid-day (2026-10-31)
- Shipped v1.43.0 (`cc8dcde`). LIVE green CT135. qa-01 directory gate plus the generated user-error test passed on standby before the switch.
- Blue STANDBY is `8478d64` (status note after the release). The release commit is `cc8dcde`.
- Tablet: My Work and the directory sit side by side. A phone stays on two tabs. The app is not in the stores.
- An ended session asks you to sign in again. A dropped connection stops the spinner.
- A tablet still calls the home API twice. Unit tests for those messages are not in `npm test`.
- Hub dates stay paused. The persons list still has no start or end dates.
- Open urgent feedback: 0 (no new items in this session). Governance submodule is `15f30eb`.
- Start a new chat before the next slice.

### Focus
- Shipped v1.42.0 (`2351513`). LIVE blue CT133, STANDBY green CT135. qa-01 full suite 74/74 plus the generated mobile test. Phone layout and directory contacts. The Expo app is not in the stores. Hub dates stay paused.
- Shipped v1.41.0 (`16ffef1`). LIVE green CT135, STANDBY blue CT133. qa-01 full suite 72/72 plus the generated chat test. Team chat, My Work, help replies, and finishing several tasks. Hub dates stay paused.
- Shipped v1.40.0 (`9f368a3`). LIVE was blue CT133. qa-01 full suite 71/71. Work uses the header group, a task can have no deadline, and several tasks can be assigned together. Bulk claim was left out.

### Mid-day (checkpoint)
- Persons workbook is on main (`c4b37bf`). Compare tool is `41db3b5`: 211 people, 119 fully listed, 71 left unchanged because a role has no crew.
- No start or end dates in the list, so no assignment was ended.
- qa-01 directory gate passed on STANDBY blue after the v1.41.0 sync.
- Open urgent feedback: 0.
- Governance submodule is `15f30eb`. Context budget blocks the next prompt around 40k tokens.

### Mid-day (evening)
- v1.42.0 is live on blue. Green is synced to `2351513`.
- A new trade or crew person is a directory contact. The phone menu, stacked directory crews, and chat list-then-thread shipped.
- The store app is `mobile/`. It signs in and shows My Work and the directory. It stays portrait. Wide tablet layout is not built.
- Open urgent feedback: 0.
- This session shipped the release. Start a new chat before the next slice.

### Mid-day (after v1.41.0)
- v1.41.0 is live. The notes below described STANDBY before the ship.
- A process is one work item. Steps stay inside it. Done stores a date. Done rows sit in a collapsed section. Bulk select, page size, My Work, and a dashboard summary of assigned work are on STANDBY.
- Help emails only the Personnel Contact and Assistant. Replies and an unread mark stay on the work item. Chat is separate: one team room and direct messages, with browser notifications after Turn on notifications.
- `bethel.jw.org` and `jwpub.org` are never mailed, on crew requests and on help. Crew-request completion email can be turned off on one request or in bulk.
- Open urgent feedback: 0. Chat and the email toggles were not retested in the browser after `8b8291c`.
- The persons list is in the trade leadership workbook. It has current roles and no start or end dates. Incomplete crew roles are left unchanged.

### Mid-day
- Shipped v1.37.0 (`756ef8b`): directory profile from a name; admin name, email, and cancel invitation. Then v1.38.0 (`9f56415`): invite form on User Management and toast confirmations.
- Shipped v1.38.1 (`e384d04`): Resend Invitation failed because it wrote `regionId` and `zoneId` onto `UserInvitation`. qa-01 admin gate passed. Both nodes synced.
- An invited person only gets email from Send invitation email or Resend Invitation, and only when Email Configuration is active. The Invited label also means they have not finished setup.
- The v1.31.0 announcement was still active through 2026-11-12. Dismiss did not stick. Set `isActive` false.
- Open urgent feedback: 0.
- The persons list is in the trade leadership workbook. It has current roles and no start or end dates. Incomplete crew roles are left unchanged.

### Discoveries / Notes
- The form export is `Construction Group 01.12 LDC Crew Update Request(1-212).xlsx` (212 rows). Mapped columns: ID, Your Email, Choose an Action, Your Name, Volunteer Name, Volunteer BA ID, Crew Name, Project Roster Name, Questions or Comments. Four rows have a name and no email. The same form ID is skipped on a later import.
- Shipped v1.36.0 (`7537896`). Admin is a direct link. User management lists this region's Personnel. Super admin and Personnel keep a construction group, so Work and Projects can add items. LIVE green CT135, STANDBY was synced to the same commit.
- CG 01.12 Personnel roster from the hub screenshot is in the shared database, including invited user accounts. New accounts have no password until an admin sets one.
- Personnel, Construction group, and Ancillary names open a profile on STANDBY (`12d9e2b`). Live does not have that until the next ship.
- User management name and email inputs were not bound, so Save reported success and wrote the old values. Cancel invitation is on the row menu for invited users.
- Open urgent feedback: 0.
- Shipped v1.35.0 (`422989e`). Processes start onto the work list. Personnel has its own directory card. Sign-in opens the dashboard. qa-01 full suite 64/64 plus 6 generated tests. LIVE blue CT133, STANDBY green CT135.
- The crew-request spreadsheet is not in the repo. Slice 6 stays unmapped until that file is here.
- Open urgent feedback: 0.
- Shipped v1.33.0 (`9db88f9`). Projects list. Oversight assigns Personnel. qa-01 full suite 61/61.
- Shipped v1.34.0 (`707ae63`). A project date shows on the project and the work list. LIVE green CT135, both nodes were synced on that release before the next slice.
- Processes (`163f0a3`) are on STANDBY blue CT133. Starting a template creates a work item per step, with its explanation. The standby check passed. Not shipped.
- `/help/projects` is no longer a retired route, so the projects help page loads.
- Local `git push` over SSH was denied. The release and process commits went out with `gh` credentials.
- The persons list is in the trade leadership workbook. It has current roles and no start or end dates. Incomplete crew roles are left unchanged.
- Removed 167 volunteer records that were not in the directory and had no login. Removed Dathan Sours and Tobias Torres. Kept the other asked-about accounts.
- Construction group section on CG 01.12: Cory Allen (Contact), Matt Hirsch (Assistant), Amber Allen, Cory L Test, Ruth Hirsch, Kennedy Allen, Amber Williams (Support). Ancillary is empty.
- Support for those five is a volunteer role, not a PersonnelContact row.
- Saving a profile accepts an existing `/api/v1/directory-photos/` path. Zoom is only for a new crop.
- Shipped v1.31.0 (`7bbb610`). LIVE blue CT133, STANDBY green CT135. qa-01 directory+admin gate plus directory-groups tests passed. Docs note `9681859` is after the release and is not on the nodes.
- Hub start and end dates stay paused until the Persons export is back.
- Shipped v1.32.0 (`33baf50`). LIVE green CT135, STANDBY blue CT133. qa-01 full suite 60/60 plus the work-list test passed.
- Projects (`58009bd`) is on STANDBY blue only. The page lists name, number, location, status, start, end, and the Builder Assistant link. Oversight assigns Personnel. Not shipped. 

### 2026-10-28
- Import export alerts were escaped backticks, so the component did not typecheck. Restored real template literals.
- qa-01 standby detection now reads HAProxy CT136 on prox3 (`10.92.0.7`). CT136 is not on prox1. LDC ACL is `is_ldc`; STANDBY is `https://blue.ldctools.com` while green is LIVE.
- Directory toolbar wraps so Export CSV is not clipped. Edit can move a person to any trade, crew, or role. Sisters can only be Support.
- Shipped v1.29.0. LIVE blue CT133, STANDBY green CT135, both `3222e09`. qa-01 full suite 68/68.
- Empty Site/Civil deactivated. The live trade is Sitework/Civil.
- Imported headshots are still the files under directory-photos. Face centering only changed the circle. The app never stored the larger originals.
- Save crops a photo only after it is dragged, zoomed, or replaced. A name-only save leaves the picture alone.
- Shipped v1.30.0. LIVE green CT135, STANDBY blue CT133, both `e11cb3d`. qa-01 directory+admin gate plus the photo-position tests passed.
- No usage watch or alert. Sign-in updates lastLogin and loginCount. Admin health is on demand only.

### Decisions to Promote
- D-LDC-011: a process is one work item. Steps stay inside it.
- D-LDC-012: never mail `bethel.jw.org` or `jwpub.org`.
- D-LDC-013: team chat is a construction-group room plus direct messages. Help stays on the work item.
- D-LDC-010: directory groups plus construction-group work. Oversight assigns projects. Personnel assign tasks. Claimable tasks can be claimed by the team.
- Sisters can only be Support. Mark Sister on each woman; they are not classified automatically.
- The populated trade name is Sitework/Civil. Site/Civil was an empty duplicate.
- Profile photos are framed by hand in the edit form. Save stores that circle. Display does not shift the photo. 

### Blockers / Risks
- 

### Links / Commands
- 
