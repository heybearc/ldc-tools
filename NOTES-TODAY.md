---
date: 2026-10-29
purpose: Scratchpad for today's discoveries (promote on /end-day)
---

## Today

### Focus
- Ship directory groups, then build the work list

### Discoveries / Notes
- Removed 167 volunteer records that were not in the directory and had no login. Removed Dathan Sours and Tobias Torres. Kept the other asked-about accounts.
- Construction group section on CG 01.12: Cory Allen (Contact), Matt Hirsch (Assistant), Amber Allen, Cory L Test, Ruth Hirsch, Kennedy Allen, Amber Williams (Support). Ancillary is empty.
- Support for those five is a volunteer role, not a PersonnelContact row.
- Saving a profile accepts an existing `/api/v1/directory-photos/` path. Zoom is only for a new crop.
- Shipped v1.31.0 (`7bbb610`). LIVE blue CT133, STANDBY green CT135. qa-01 directory+admin gate plus directory-groups tests passed. Docs note `9681859` is after the release and is not on the nodes.
- Hub start and end dates stay paused until the Persons export is back. 

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
