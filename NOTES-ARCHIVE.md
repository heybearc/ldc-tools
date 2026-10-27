---
purpose: Archive of rolled daily notes
---


## 2026-10-26

_Rolled from NOTES-TODAY.md_

---
date: 2026-10-26
purpose: Scratchpad for today's discoveries (promote on /end-day)
---

## Today

### Focus
- Resume ldc-tools → Trade Leadership Directory v1 (CG 01.12)

### Discoveries / Notes
- CT133 on **prox2**, CT135 on **prox1**; blue IP **10.92.3.34** (D-068); DB VIP **.23**
- HAProxy `is_ldc_green` bug fixed earlier today
- Oversight directory reads **User** + `TradeTeamOversight` / `TradeCrewOversight` (not VolunteerRole alone)
- Import: Site/Civil ↔ Sitework/Civil alias; created missing crews (LV, rough-in, Masonry, Stucco/EIFS)
- 193/195 imported; Hart + Miller-Sieving still need trade; bare TC Support → TT Support fallback

### Decisions to Promote
- D-068 (already in Cloudy-Work)
- Product thesis: team reference directory first; BA remains SoR for appointments

### Blockers / Risks
- Headshot decision open (source/storage TBD)
- Inferred household trades need human review

### Links / Commands
- STANDBY: http://10.92.3.25:3001
- LIVE: http://10.92.3.34:3001 / https://ldctools.com
- Overview: `/trade-teams/overview`

## 2026-10-27

_Rolled from NOTES-TODAY.md_

---
date: 2026-10-27
purpose: Scratchpad for today's discoveries (promote on /end-day)
---

## Today

### Focus
- Finish directory headshots; explain 210 vs 190

### Discoveries / Notes
- Hub list is 210 profiles. Oversight import is 195 rows / 190 people. All 190 have photos.
- 20 not imported (Other Roles only): Behra x2, Clark, Conner, Holley, Kaminski, Leach, Merritt x2, Perry x2, Plummer x2, Reed x2, Seavers x2, Thompson, Welch x2.
- Hart + Miller-Sieving are TT Support on placeholder team TBD.
- Headshot files live on both nodes under `/var/lib/ldc-tools/directory-photos`, not in git.
- Display code is on STANDBY (`9358935`). Later commits are docs only.

### Decisions to Promote
- v1 directory is trade oversight only. Other Roles stay out until asked.

### Blockers / Risks
- ~9 no-crew TC Support rows still parked as TT Support on an inferred team.
- Inferred household trades still need a human pass in the UI.

### Links / Commands
- STANDBY: http://10.92.3.25:3001/trade-teams/overview
- LIVE: http://10.92.3.34:3001 
