# Product Brief — LDC Team Board (v1)

**Date:** 2026-10-26  
**Status:** Draft  
**Owner:** LDC personnel / project support team  
**App:** ldc-tools (`ldctools.com`) — resumed; repositioned as team reference tooling (not BA system of record)

---

## Problem

When setting up or managing projects in BA, the team needs a fast, trusted answer to: **which Trade Team / Trade Crew leadership to add, and who to contact for a given trade.** That knowledge lives in spreadsheets, memory, and screenshots. Wrong or stale contacts slow project setup and outreach.

## Product thesis

LDC Tools becomes a **team reference + task workspace**.  
**v1 is not a full task product** — it is a **Trade Leadership Directory**: Trade Teams → Trade Crews → oversight roles only (not full crew membership).

## v1 — Trade Leadership Directory

### In scope

| Level | Roles | Purpose |
|-------|--------|---------|
| **Trade Team** (trade) | TTO, TTOA, TT Support | Who owns the trade at team level |
| **Trade Crew** (under team) | TCO, TCOA, TC Support | Who owns each crew / discipline under that trade |

For each person: name, email (and phone if available), role, active dates, trade/crew name, optional notes.

**Jobs to be done**
1. “For trade X, who do I add in BA for this project?”  
2. “Who do I call/email if we need help on crew Y?”  
3. “Export / print a current oversight map for the team.”

### Out of scope (v1)

- Full volunteer/crew member rosters  
- Competing with BA as assignment system of record  
- CG admin rework, PWA, schedule notifications  
- Generic task lists / checklist templates (v2+)

### Already in the codebase (reuse)

- Prisma: `TradeTeam`, `Crew`, `TradeTeamOversight`, `TradeCrewOversight` + role enums (TTO/TTOA/TT_SUPPORT, TCO/TCOA/TC_SUPPORT)  
- UI: `/trade-teams/overview` (grid/table + PDF export columns already match this model)  
- Role limits in `oversight-types.ts` (USLDC-style constraints)

**v1 work is mostly:** make this the **default home experience**, harden data entry/import, ensure contact fields are complete and searchable, hide legacy “construction OS” noise.

### Success criteria

- Team uses the directory for **every** new project BA setup for 2 weeks without falling back to a side spreadsheet  
- Lookup of “TTO/TCO for trade Z” in **&lt; 30 seconds**  
- One export (CSV/PDF) matches what the team would have built manually  

### Non-goals / trust rule

Directory is a **mirror for our team**. BA remains authoritative for formal appointments; we update the directory when leadership changes are known.

---

## Later (v2+) — Team Board

Same app, after directory sticks: importable **people trackers**, **request queues**, and **process checklists** (templates → instances). Same pattern: Lists → Items → Status → Owner — not a second BA.

---

## Immediate next build slice

1. Confirm / clean Trade Team + Crew master list (names + trade mapping)  
2. Assign / import TTO·TTOA·TT Support and TCO·TCOA·TC Support with contact info  
3. Directory UX: search by trade, person, or role; one-click copy email; export  
4. Soft-land homepage → this directory (legacy modules behind “More” or admin-only)

**Data source:** Spreadsheet populated by the team, then imported. Template: `docs/templates/LDC-Trade-Leadership-Import-Template.xlsx` (also on Desktop).
