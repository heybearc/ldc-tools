---
date: 2026-10-30
purpose: Scratchpad for today's discoveries (promote on /end-day)
---

## Today

### Focus
- Shipped v1.40.0 (`9f368a3`). LIVE blue CT133, STANDBY green CT135. qa-01 full suite 71/71. Work uses the header group, a task can have no deadline, and several tasks can be assigned together. Bulk claim was left out. Hub dates stay paused.

### Mid-day
- Shipped v1.37.0 (`756ef8b`): directory profile from a name; admin name, email, and cancel invitation. Then v1.38.0 (`9f56415`): invite form on User Management and toast confirmations.
- Shipped v1.38.1 (`e384d04`): Resend Invitation failed because it wrote `regionId` and `zoneId` onto `UserInvitation`. qa-01 admin gate passed. Both nodes synced.
- An invited person only gets email from Send invitation email or Resend Invitation, and only when Email Configuration is active. The Invited label also means they have not finished setup.
- The v1.31.0 announcement was still active through 2026-11-12. Dismiss did not stick. Set `isActive` false.
- Open urgent feedback: 0.
- The Excel import template and `frontend/tsconfig.tsbuildinfo` are still uncommitted.

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
- The Excel import template and `frontend/tsconfig.tsbuildinfo` are still uncommitted.
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
- D-LDC-010: directory groups plus construction-group work. Oversight assigns projects. Personnel assign tasks. Claimable tasks can be claimed by the team.
- Sisters can only be Support. Mark Sister on each woman; they are not classified automatically.
- The populated trade name is Sitework/Civil. Site/Civil was an empty duplicate.
- Profile photos are framed by hand in the edit form. Save stores that circle. Display does not shift the photo. 

### Blockers / Risks
- 

### Links / Commands
- 
