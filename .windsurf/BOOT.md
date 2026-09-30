# LDC Tools - Windsurf Boot Context

**App:** LDC Construction Tools  
**Port:** 3001  
**Containers:** ldc-staging (135), ldc-prod (133)  
**Canonical path:** `/opt/ldc-tools/frontend`

---

## Quick Reference

**Verify LIVE/STANDBY:**
```bash
.cloudy-work/_cloudy-ops/scripts/verify-live-standby.sh ldctools
```

**SSH Access:**
```bash
ssh ldc-staging  # STANDBY (typically)
ssh ldc-prod     # LIVE (typically)
```

**Container-First Rule:**
- ❌ NO builds, tests, or execution on local Mac
- ✅ ALL development work happens on containers
- ✅ Local Mac is for Windsurf IDE and git operations only

---

## Workflows Available

- `/start-day` - Load context and prepare for work
- `/mid-day` - Update context during the day
- `/end-day` - Close out day and prepare for tomorrow
- `/bump` - Version bump and deploy to STANDBY
- `/test-release` - Run automated tests before release
- `/release` - Switch traffic from STANDBY to LIVE
- `/sync` - Sync STANDBY with LIVE after release
- `/container-dev` - Enforce container-first development

---

## Context Files

**Shared context** (all apps):
- `.cloudy-work/_cloudy-ops/context/CURRENT-STATE.md`
- `.cloudy-work/_cloudy-ops/context/APP-MAP.md`
- `.cloudy-work/_cloudy-ops/context/DECISIONS.md`
- `.cloudy-work/_cloudy-ops/context/RUNBOOK-SHORT.md`

**Repo-local context** (LDC Tools specific):
- `PLAN.md` - Backlog, roadmap, known issues (D-035)
- `TASK-STATE.md` - Current work, next steps
- `DECISIONS.md` - LDC Tools specific decisions
- `.windsurf/BOOT.md` - This file

---

## First Steps

1. Run `/start-day` to load full context
2. Verify LIVE/STANDBY status
3. SSH to appropriate container for work
4. Use Windsurf for editing, containers for execution
